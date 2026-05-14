import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart3, PieChart as PieChartIcon, 
    TrendingUp, ArrowDown, ArrowUp, 
    FileText, Calendar, Download, Target,
    CreditCard, Activity, Zap, ShieldCheck, Clock, X
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
        const { stats, insights } = analytics;
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(22);
        doc.text("Strategic Business Audit", 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        const filterText = dateFilter ? `Date: ${dateFilter}` : monthFilter ? `Month: ${monthFilter}` : 'All Time (Last 30D)';
        doc.text(`Generated on: ${new Date().toLocaleString()} | ${filterText}`, 14, 30);
        
        // Metrics Table
        const metricsData = [
            ["Metric", "Value", "Status"],
            ["Total Revenue", `Rs. ${stats.totalRevenue.toLocaleString()}`, "Active"],
            ["Net Profit", `Rs. ${stats.totalProfit.toLocaleString()}`, "Stable"],
            ["Net Margin", `${stats.netMargin}%`, parseFloat(stats.netMargin) > 20 ? "Optimal" : "Healthy"],
            ["Order Volume", stats.totalSalesCount, "Consistent"],
            ["Growth Rate", `${stats.growthRate}%`, parseFloat(stats.growthRate) >= 0 ? "Positive" : "Critical"]
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
        doc.text("Executive Insights", 14, finalY);
        doc.setFontSize(11);
        doc.text([
            `• Peak Traffic Window: ${insights.peakTime}`,
            `• Busiest Day of Week: ${insights.busiestDay}`,
            `• Top Payment Method: ${insights.topPayment}`,
            `• Inventory Status: ${insights.lowStockRisk}`
        ], 14, finalY + 10);

        doc.save(`audit_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    if (loading && !analytics) return (
        <div className="space-y-8 animate-pulse p-4">
            <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>)}
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
            <h3 className="text-xl font-black uppercase tracking-tight">No Strategic Data</h3>
            <p className="text-slate-500 max-w-xs">We need more transactions to generate your business intelligence reports.</p>
        </div>
    );

    const { dailySales, stats, insights } = analytics;

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
            sub: stats.revenueGrowth === 'New' ? 'New Performance' : `${stats.revenueGrowth}% Growth`,
            icon: <Zap size={20} />, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50 dark:bg-emerald-500/10' 
        },
        { 
            label: 'Order Volume', 
            value: stats.totalSalesCount, 
            sub: 'Processed',
            icon: <BarChart3 size={20} />, 
            color: 'text-amber-600', 
            bg: 'bg-amber-50 dark:bg-amber-500/10' 
        },
        { 
            label: 'AOV', 
            value: `₹${stats.avgTicketSize.toLocaleString()}`, 
            sub: 'Avg. Ticket',
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
                        <FileText size={14} /> Analytics Portal
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                        Business <span className="text-indigo-600">Audit</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl text-lg leading-relaxed">
                        A detailed breakdown of your storefront's financial performance and operational efficiency.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
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
                            <button onClick={clearFilters} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        {[
                            { label: '7D', value: '7' },
                            { label: '30D', value: '30' },
                            { label: '90D', value: '90' }
                        ].map(p => (
                            <button
                                key={p.value}
                                onClick={() => { setPeriodFilter(p.value); setDateFilter(''); setMonthFilter(''); }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${periodFilter === p.value ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Admin Only Advanced Filters */}
                    {user?.role === 'super_admin' && (
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
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
                        className="flex-1 xl:flex-none h-14 px-8 rounded-2xl bg-indigo-600 text-white text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3"
                    >
                        <Download size={18} /> Export Audit
                    </button>
                </div>
            </div>

            {/* Metric Scoreboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {reportCards.map((card, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="card p-8 group hover:scale-[1.02] transition-all cursor-default"
                    >
                        <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-xl flex items-center justify-center mb-6`}>
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

            {/* Strategic Insights Audit */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden"
            >
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">Strategic Audit Insights</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Automated Intelligence Report</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                        <div className="space-y-4">
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Peak Performance</p>
                            <div className="space-y-1">
                                <h4 className="text-2xl font-black text-emerald-400">High: {insights?.busiestDay || 'Calculating...'}</h4>
                                <p className="text-xs font-medium text-slate-400">This day consistently generates maximum footfall and transaction volume.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Growth Opportunity</p>
                            <div className="space-y-1">
                                <h4 className="text-2xl font-black text-rose-400">Low: {insights?.slowestDay || 'Calculating...'}</h4>
                                <p className="text-xs font-medium text-slate-400">Target this day with special discounts or loyalty rewards to boost engagement.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Traffic Window</p>
                            <div className="space-y-1">
                                <h4 className="text-2xl font-black text-indigo-400">{insights?.peakTime || '24h Cycle'}</h4>
                                <p className="text-xs font-medium text-slate-400">Ensure maximum staff availability during this critical hour window.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Top Channel</p>
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
                        <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">Revenue Velocity</h3>
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
                    <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mb-6 md:mb-10">Transaction Intensity</h3>
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
