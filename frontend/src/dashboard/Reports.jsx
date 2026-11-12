import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart3, PieChart as PieChartIcon, 
    TrendingUp, ArrowDown, ArrowUp, 
    FileText, Calendar, Download, Target,
    CreditCard, Activity, Zap, ShieldCheck, Clock, X, RefreshCw
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { posStore } from '../utils/posStore';

const Reports = () => {
    const [analytics, setAnalytics] = useState(null);
    const [taxReport, setTaxReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [periodFilter, setPeriodFilter] = useState('30');
    const { user } = useAuth(); // Assuming useAuth is available for role check

    useEffect(() => {
        fetchData();
    }, [dateFilter, monthFilter, paymentMethodFilter, categoryFilter, periodFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/reports/sales';
            const params = new URLSearchParams();
            if (dateFilter) params.append('date', dateFilter);
            else if (monthFilter) params.append('month', monthFilter);
            else params.append('period', periodFilter);
            
            if (paymentMethodFilter) params.append('paymentMethod', paymentMethodFilter);
            if (categoryFilter) params.append('shopCategory', categoryFilter);
            
            const res = await api.get(`${url}?${params.toString()}`);
            const reportData = res.data.data;
            setAnalytics(reportData);
            const taxParams = {};
            if (dateFilter) { taxParams.from = dateFilter; taxParams.to = dateFilter; }
            else if (monthFilter) {
                const [year, month] = monthFilter.split('-').map(Number);
                taxParams.from = monthFilter + '-01';
                taxParams.to = new Date(year, month, 0).toISOString().slice(0, 10);
            } else {
                taxParams.from = new Date(Date.now() - Number(periodFilter) * 86400000).toISOString().slice(0, 10);
            }
            try {
                const taxResponse = await api.get('/reports/tax', { params: taxParams });
                setTaxReport(taxResponse.data?.data || null);
            } catch (taxError) { setTaxReport(null); }
            // Cache for offline
            await posStore.cacheReport(reportData);
        } catch (error) {
            console.error("Failed to fetch reports, loading from cache...");
            const cachedReport = await posStore.getCachedReport();
            if (cachedReport) {
                setAnalytics(cachedReport);
            }
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setDateFilter('');
        setMonthFilter('');
        setPaymentMethodFilter('');
        setCategoryFilter('');
        setPeriodFilter('30');
    };

    const handleExportPDF = () => {
        if (!analytics) return;
        const stats = analytics.stats || {};
        const insights = analytics.insights || {};
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(22);
        doc.text("Business Report", 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        const filterText = dateFilter ? `Date: ${dateFilter}` : monthFilter ? `Month: ${monthFilter}` : `Last ${periodFilter} days`;
        doc.text(`Generated on: ${new Date().toLocaleString()} | ${filterText}`, 14, 30);
        
        // Metrics Table
        const metricsData = [
            ["Metric", "Value", "Status"],
            ["Total Revenue", `Rs. ${Number(stats.totalRevenue || 0).toLocaleString()}`, "Recorded"],
            ["Net Profit", `Rs. ${Number(stats.totalProfit || 0).toLocaleString()}`, "Calculated"],
            ["Net Margin", `${Number(stats.netMargin || 0)}%`, Number(stats.netMargin || 0) > 20 ? "Good" : "Needs review"],
            ["Total Orders", Number(stats.totalSalesCount || 0), "Recorded"],
            ["Growth Rate", `${Number(stats.growthRate || 0)}%`, Number(stats.growthRate || 0) >= 0 ? "Up" : "Down"]
        ];

        doc.autoTable({
            startY: 40,
            head: [metricsData[0]],
            body: metricsData.slice(1),
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] }
        });

        // Insights Section
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text("Key Insights", 14, finalY);
        doc.setFontSize(11);
        doc.text([
            `• Busiest Time: ${insights.peakTime}`,
            `• Busiest Day: ${insights.busiestDay}`,
            `• Top Payment Type: ${insights.topPayment}`,
            `• Stock Status: ${insights.lowStockRisk}`
        ], 14, finalY + 10);

        // Daily sales breakdown (for the selected date range/month).
        const dailyRows = (dailySales || []).map(day => [
            new Date(`${day._id}T00:00:00+05:30`).toLocaleDateString('en-IN'),
            Number(day.count || 0),
            `Rs. ${Number(day.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
        ]);
        if (dailyRows.length) {
            doc.addPage();
            doc.setFontSize(16);
            doc.setTextColor(20);
            doc.text(monthFilter ? `Daily Sales - ${monthFilter}` : 'Daily Sales Breakdown', 14, 20);
            doc.autoTable({
                startY: 28,
                head: [['Date', 'Transactions', 'Sales']],
                body: dailyRows,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] },
                styles: { fontSize: 9, cellPadding: 3 }
            });
        }

        // Today's product-level details when available.
        const pdfProducts = monthFilter ? (monthlyProducts || []) : (todayReport?.products || []);
        if (pdfProducts.length) {
            doc.addPage();
            doc.setFontSize(16);
            doc.setTextColor(20);
            doc.text(monthFilter ? `Products Sold - ${monthFilter}` : `Products Sold - ${todayReport.date}`, 14, 20);
            doc.autoTable({
                startY: 28,
                head: [['Product', 'Quantity', 'Sales']],
                body: pdfProducts.map(product => [
                    product.productName,
                    Number(product.quantity || 0),
                    `Rs. ${Number(product.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                ]),
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] },
                styles: { fontSize: 9, cellPadding: 3 }
            });
        }

        const filePeriod = monthFilter || dateFilter || `last_${periodFilter}_days`;
        doc.save(`business_report_${filePeriod}.pdf`);
    };

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    if (loading && !analytics) return (
        <div className="space-y-8 animate-pulse p-4">
            <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-[1.25rem] mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-[1.25rem]"></div>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="h-[450px] bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]"></div>
                <div className="h-[450px] bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]"></div>
            </div>
        </div>
    );

    if (!analytics && !loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center p-10">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <Activity size={40} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">No Report Data</h3>
            <p className="text-slate-500 max-w-xs">Add some sales to see your business report.</p>
        </div>
    );

    const { dailySales, monthlyProducts, stats, insights, todayReport } = analytics;

    const reportCards = [
        { 
            label: 'Net Profit', 
            value: `₹${stats.totalProfit?.toLocaleString()}`, 
            sub: `${stats.netMargin}% Margin`,
            icon: <TrendingUp size={20} />, 
            color: 'text-indigo-600', 
            bg: 'bg-indigo-50 dark:bg-indigo-500/10' 
        },
        { 
            label: 'Revenue', 
            value: `₹${stats.totalRevenue.toLocaleString()}`, 
            sub: stats.revenueGrowth === 'New' ? 'First Sales' : `${stats.revenueGrowth}% Growth`,
            icon: <Zap size={20} />, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50 dark:bg-emerald-500/10' 
        },
        { 
            label: 'Total Orders', 
            value: stats.totalSalesCount, 
            sub: 'Processed',
            icon: <BarChart3 size={20} />, 
            color: 'text-amber-600', 
            bg: 'bg-amber-50 dark:bg-amber-500/10' 
        },
        { 
            label: 'AOV', 
            value: `₹${stats.avgTicketSize.toLocaleString()}`, 
            sub: 'Average Order Value',
            icon: <Target size={20} />, 
            color: 'text-rose-600', 
            bg: 'bg-rose-50 dark:bg-rose-500/10' 
        },
    ];

    return (
        <div className="space-y-10 pb-20">
            {/* Page Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 font-black uppercase text-[10px] tracking-[0.3em]">
                        <FileText size={14} /> Reports
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                        Business <span className="text-indigo-600">Report</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl text-lg leading-relaxed">
                        Check your sales, profit, and stock in one place.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-[1.25rem] border border-slate-200 dark:border-slate-800">
                        <input 
                            type="date" 
                            className="bg-transparent border-none text-xs font-black uppercase focus:ring-0 cursor-pointer"
                            value={dateFilter}
                            onChange={(e) => { setDateFilter(e.target.value); setMonthFilter(''); }}
                        />
                        <div className="w-px h-6 bg-slate-200"></div>
                        <input 
                            type="month" 
                            className="bg-transparent border-none text-xs font-black uppercase focus:ring-0 cursor-pointer"
                            value={monthFilter}
                            onChange={(e) => { setMonthFilter(e.target.value); setDateFilter(''); }}
                        />
                        {(dateFilter || monthFilter || paymentMethodFilter || categoryFilter || periodFilter !== '30') && (
                            <button onClick={clearFilters} className="p-2 text-rose-500 hover:bg-rose-50 rounded-[1.25rem] transition-all">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-[1.25rem] border border-slate-200 dark:border-slate-800">
                        {[
                            { label: '7D', value: '7' },
                            { label: '30D', value: '30' },
                            { label: '90D', value: '90' }
                        ].map(p => (
                            <button
                                key={p.value}
                                onClick={() => { setPeriodFilter(p.value); setDateFilter(''); setMonthFilter(''); }}
                                className={`px-4 py-2 rounded-[1.25rem] text-[10px] font-black transition-all ${periodFilter === p.value ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Admin Only Advanced Filters */}
                    {user?.role === 'super_admin' && (
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-[1.25rem] border border-slate-200 dark:border-slate-800">
                            <select 
                                className="bg-transparent border-none text-[10px] font-black uppercase focus:ring-0 cursor-pointer"
                                value={paymentMethodFilter}
                                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                            >
                                <option value="">All Payments</option>
                                <option value="Cash">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="Card">Card</option>
                                <option value="Scan & Pay">Scan & Pay</option>
                            </select>
                            <div className="w-px h-6 bg-slate-200"></div>
                            <select 
                                className="bg-transparent border-none text-[10px] font-black uppercase focus:ring-0 cursor-pointer"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                <option value="Retail">Retail</option>
                                <option value="Restaurant">Restaurant</option>
                                <option value="Pharmacy">Pharmacy</option>
                                <option value="Grocery">Grocery</option>
                            </select>
                        </div>
                    )}
                    <button 
                        onClick={handleExportPDF}
                        disabled={!analytics || loading}
                        className="flex-1 xl:flex-none h-14 px-8 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Download size={18} /> Download PDF Report
                    </button>
                </div>
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">GST Tax Summary</h2><p className="text-xs text-slate-500">Recorded GST for the selected period. Older sales without tax snapshots are excluded.</p></div>
                    <span className="text-xs font-semibold text-slate-500">{taxReport?.transactions || 0} transactions</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {[[ 'Taxable Sales', taxReport?.taxableAmount ], [ 'CGST', taxReport?.cgst ], [ 'SGST', taxReport?.sgst ], [ 'IGST', taxReport?.igst ], [ 'Total GST', taxReport?.taxAmount ]].map(([label, value]) => (
                        <div key={label} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">₹{Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p></div>
                    ))}
                </div>
            </section>
            {/* Metric Scoreboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {reportCards.map((card, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="card p-8 group hover:scale-[1.02] transition-all cursor-default rounded-[1.25rem]"
                    >
                        <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-[1.25rem] flex items-center justify-center mb-6`}>
                            {card.icon}
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{card.label}</p>
                        <h3 className="text-3xl font-black tracking-tight">{card.value}</h3>
                        <p className="text-xs font-bold text-slate-500 mt-2 flex items-center gap-1">
                            {card.sub.includes('%') && (
                                <span className={parseFloat(card.sub) >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                    {parseFloat(card.sub) >= 0 ? '↑' : '↓'}
                                </span>
                            )}
                            {card.sub}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Saved month history from permanent sale records */}
            {monthFilter && (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Monthly Sales History</h2>
                        <p className="mt-1 text-xs text-slate-500">Daily totals for {monthFilter}. Each day is calculated from saved sales and payment records.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-5">
                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs text-slate-500">Month Sales</p><p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">₹{Number(stats.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p></div>
                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs text-slate-500">Transactions</p><p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{Number(stats.totalSalesCount || 0).toLocaleString('en-IN')}</p></div>
                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800 col-span-2 sm:col-span-1"><p className="text-xs text-slate-500">Daily Records</p><p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{dailySales?.length || 0}</p></div>
                    </div>
                    {dailySales?.length ? (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                            <table className="w-full min-w-[420px] text-sm">
                                <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800"><tr><th className="px-3 py-3">Date</th><th className="px-3 py-3 text-right">Transactions</th><th className="px-3 py-3 text-right">Sales</th></tr></thead>
                                <tbody>{dailySales.map(day => (
                                    <tr key={day._id} className="border-t border-slate-100 dark:border-slate-800">
                                        <td className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-100">{new Date(`${day._id}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td className="px-3 py-3 text-right text-slate-600 dark:text-slate-300">{Number(day.count || 0)}</td>
                                        <td className="px-3 py-3 text-right font-bold text-slate-900 dark:text-white">₹{Number(day.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    ) : <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-800">No sales recorded for this month.</p>}
                    <div className="mt-6">
                        <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Products Sold This Month</h3>
                        {monthlyProducts?.length ? (
                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                <table className="w-full min-w-[360px] text-sm">
                                    <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800"><tr><th className="px-3 py-3">Product</th><th className="px-3 py-3 text-right">Qty Sold</th><th className="px-3 py-3 text-right">Sales</th></tr></thead>
                                    <tbody>{monthlyProducts.map(product => <tr key={product.productName} className="border-t border-slate-100 dark:border-slate-800"><td className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-100">{product.productName}</td><td className="px-3 py-3 text-right">{product.quantity}</td><td className="px-3 py-3 text-right font-bold">₹{Number(product.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>)}</tbody>
                                </table>
                            </div>
                        ) : <p className="text-sm text-slate-500">No product sales recorded for this month.</p>}
                    </div>
                </section>
            )}

            {/* Live report for the current day */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Today's Sales</h2>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            Live records for {todayReport?.date ? new Date(`${todayReport.date}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'today'} · Updates when this report is refreshed.
                        </p>
                    </div>
                    <button type="button" onClick={fetchData} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                        { label: 'Total Sales', value: `₹${Number(todayReport?.totalSales || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
                        { label: 'Transactions', value: Number(todayReport?.totalTransactions || 0).toLocaleString('en-IN') },
                        { label: 'Items Sold', value: Number(todayReport?.unitsSold || 0).toLocaleString('en-IN') },
                        { label: 'Products Sold', value: Number(todayReport?.productsSold || 0).toLocaleString('en-IN') }
                    ].map(card => (
                        <div key={card.label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                            <p className="text-xs font-medium text-slate-500">{card.label}</p>
                            <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">{card.value}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div className="min-w-0">
                        <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Products Sold Today</h3>
                        {todayReport?.products?.length ? (
                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                <table className="w-full min-w-[320px] text-sm">
                                    <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800">
                                        <tr><th className="px-3 py-3 font-semibold">Product</th><th className="px-3 py-3 text-right font-semibold">Qty Sold</th><th className="px-3 py-3 text-right font-semibold">Sales</th></tr>
                                    </thead>
                                    <tbody>
                                        {todayReport.products.map((product, index) => (
                                            <tr key={product.productName} className={index ? 'border-t border-slate-100 dark:border-slate-800' : ''}>
                                                <td className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-100">{product.productName}</td>
                                                <td className="px-3 py-3 text-right text-slate-600 dark:text-slate-300">{product.quantity}</td>
                                                <td className="px-3 py-3 text-right font-semibold text-slate-800 dark:text-slate-100">₹{Number(product.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-800">No products sold today yet.</p>}
                    </div>
                    <div className="min-w-0">
                        <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Today's Transactions</h3>
                        {todayReport?.transactions?.length ? (
                            <div className="space-y-2">
                                {todayReport.transactions.map((sale, index) => (
                                    <div key={sale.transactionId || `${sale.createdAt}-${index}`} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{sale.customerName}</p>
                                                <p className="mt-1 text-xs text-slate-500">{sale.transactionId ? `#${sale.transactionId}` : 'Sale'} · {new Date(sale.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {sale.paymentMethod}</p>
                                            </div>
                                            <p className="shrink-0 text-sm font-extrabold text-slate-900 dark:text-white">₹{Number(sale.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">{sale.items?.map(item => `${item.productName} × ${item.quantity}`).join(', ') || 'No item details'}</p>
                                        {sale.status && sale.status !== 'Completed' && <span className="mt-2 inline-flex rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">{sale.status}</span>}
                                    </div>
                                ))}
                            </div>
                        ) : <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-800">No sales recorded today yet.</p>}
                        {Number(todayReport?.totalTransactions || 0) > 30 && <p className="mt-2 text-xs text-slate-500">Showing the latest 30 transactions.</p>}
                    </div>
                </div>
            </section>

            {/* Quick Business Insights */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950 rounded-[1.25rem] p-10 text-white relative overflow-hidden"
            >
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">Quick Insights</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Based on your sales</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                        <div className="space-y-4">
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Busiest Day</p>
                            <div className="space-y-1">
                                <h4 className="text-2xl font-black text-emerald-400">High: {insights?.busiestDay || 'Calculating...'}</h4>
                                <p className="text-xs font-medium text-slate-400">This day consistently generates maximum footfall and transaction volume.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Slowest Day</p>
                            <div className="space-y-1">
                                <h4 className="text-2xl font-black text-rose-400">Low: {insights?.slowestDay || 'Calculating...'}</h4>
                                <p className="text-xs font-medium text-slate-400">Target this day with special discounts or loyalty rewards to boost engagement.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Busiest Time</p>
                            <div className="space-y-1">
                                <h4 className="text-2xl font-black text-indigo-400">{insights?.peakTime || '24h Cycle'}</h4>
                                <p className="text-xs font-medium text-slate-400">Ensure maximum staff availability during this critical hour window.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Top Payment Type</p>
                            <div className="space-y-1">
                                <h4 className="text-2xl font-black text-amber-400">{insights?.topPayment || 'Mixed'}</h4>
                                <p className="text-xs font-medium text-slate-400">Preferred customer payment method for settlements and checkout speed.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profit vs Revenue Area Chart */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card p-8 lg:p-10 rounded-[3rem]"
                >
                    <div className="flex justify-between items-center mb-6 md:mb-10">
                        <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">Sales Over Time</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-indigo-600"></div>
                                <span className="text-[9px] md:text-[10px] font-black uppercase text-slate-400">Gross</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[250px] md:h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailySales}>
                                <defs>
                                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.2}/>
                                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff', fontSize: '10px' }}
                                    itemStyle={{ color: '#fff', fontWeight: 900 }}
                                />
                                <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={4} fill="url(#chartGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Daily Order Density */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="card p-8 lg:p-10 rounded-[3rem]"
                >
                    <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mb-6 md:mb-10">Daily Orders</h3>
                    <div className="h-[250px] md:h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailySales}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff', fontSize: '10px' }}
                                    itemStyle={{ color: '#fff', fontWeight: 900 }}
                                />
                                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>


        </div>
    );
};

export default Reports;
