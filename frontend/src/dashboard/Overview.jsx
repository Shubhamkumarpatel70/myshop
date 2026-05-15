import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowRight,
    Clock,
    DollarSign,
    Package,
    ShieldCheck,
    ShoppingCart,
    Store,
    TrendingUp,
    Zap,
    History,
    Activity,
    ArrowUpRight
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Overview = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [period, setPeriod] = useState('30D');

    const fetchDashboardData = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        else setIsRefreshing(true);
        
        try {
            if (user?.role === 'super_admin') {
                const res = await api.get('/reports/admin-stats');
                const d = res.data?.data || {};
                setStats({
                    totalOwners: d.totalOwners || 0,
                    totalProducts: d.totalProducts || 0,
                    totalRevenue: d.totalRevenue || 0,
                    totalProfit: d.totalRevenue * 0.15,
                    todayRevenue: d.todayRevenue || 0,
                    todayCount: d.todayCount || 0,
                    activeShifts: d.activeShifts || 0,
                    pendingPOs: d.pendingPOs || 0,
                    lowStockProducts: d.lowStockShops || 0,
                    todaySales: d.todayCount || 0,
                    todayProducts: d.todayProducts || 0,
                    recentTransactions: d.shops || [],
                });
                setSalesData([]);
            } else {
                const [statsRes, analyticsRes] = await Promise.all([
                    api.get('/reports/dashboard'),
                    api.get(`/reports/sales?period=${period.replace('D', '')}`),
                ]);

                const base = statsRes.data?.data || {};
                const analytics = analyticsRes.data?.data || {};

                setStats({
                    ...base,
                    ...(analytics.stats || {}),
                    insights: analytics.insights || null,
                });
                setSalesData(analytics.dailySales || []);
            }
        } catch (error) {
            console.error('Failed to load dashboard data', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(() => {
            fetchDashboardData(true);
        }, 30000);
        return () => clearInterval(interval);
    }, [user?.role, period]);

    const currentRole = user?.role || 'shop_owner';
    const stockHealth = stats ? Math.round(((stats.totalProducts - stats.lowStockProducts) / (stats.totalProducts || 1)) * 100) : 0;

    const metrics = useMemo(() => {
        if (!stats) return [];
        if (currentRole === 'super_admin') {
            return [
                { label: 'Total Shops', value: stats.totalOwners || 0, icon: <Store size={20} />, color: 'indigo', hint: 'Registered partners' },
                { label: 'Network Items', value: stats.totalProducts || 0, icon: <Package size={20} />, color: 'emerald', hint: 'Across all shops' },
                { label: 'Net Profit', value: `₹${Number(stats.totalProfit || 0).toLocaleString()}`, icon: <TrendingUp size={20} />, color: 'violet', hint: 'Platform earnings' },
                { label: 'Low Stock Shops', value: stats.lowStockProducts || 0, icon: <AlertTriangle size={20} />, color: 'rose', hint: 'Action required' },
            ];
        }
        return [
            { label: 'Revenue', value: `₹${Number(stats.totalRevenue || 0).toLocaleString()}`, icon: <DollarSign size={20} />, color: 'indigo', hint: 'Selected period' },
            { label: 'Net Profit', value: `₹${Number(stats.totalProfit || 0).toLocaleString()}`, icon: <TrendingUp size={20} />, color: 'emerald', hint: 'Calculated earnings' },
            { label: 'Transactions', value: Number(stats.totalSalesCount || 0).toLocaleString(), icon: <ShoppingCart size={20} />, color: 'amber', hint: 'Orders completed' },
            { label: 'Low Stock', value: Number(stats.lowStockProducts || 0).toLocaleString(), icon: <AlertTriangle size={20} />, color: 'rose', hint: 'Critical inventory' },
        ];
    }, [stats, currentRole]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse p-4">
                <div className="h-40 rounded-[1.25rem] bg-slate-100" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 rounded-[1.25rem] bg-slate-100" />
                    ))}
                </div>
                <div className="h-[400px] rounded-[1.25rem] bg-slate-100" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 font-jakarta px-1">
            {/* Business Intelligence Header */}
            <section className="bg-white dark:bg-slate-900 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Real-time Performance Metrics</p>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                            Business <span className="text-indigo-600">Audit</span>
                        </h1>
                        <p className="text-slate-500 text-sm font-medium max-w-xl">
                            A detailed breakdown of your storefront's financial performance and operational efficiency.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                            <Activity size={16} className="text-emerald-500" />
                            <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider">Systems Nominal</span>
                        </div>
                    </div>
                </div>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[1.25rem] border border-slate-100 dark:border-slate-800/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Today's Revenue</p>
                        <div className="flex items-center justify-between">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white privacy-blur">₹{Number(stats?.todayRevenue || 0).toLocaleString()}</h3>
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[1.25rem] border border-slate-100 dark:border-slate-800/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Active Orders</p>
                        <div className="flex items-center justify-between">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats?.todayCount || 0}</h3>
                            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600">
                                <ShoppingCart size={20} />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[1.25rem] border border-slate-100 dark:border-slate-800/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Inventory Health</p>
                        <div className="flex items-center justify-between">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stockHealth}%</h3>
                            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center text-rose-600">
                                <Zap size={20} />
                            </div>
                        </div>
                        <div className="mt-4 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${stockHealth}%` }} 
                                className="h-full bg-indigo-600 rounded-full" 
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Metrics Grid */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric, idx) => (
                    <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white dark:bg-slate-900 rounded-[1.25rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-indigo-500/30 transition-all"
                    >
                        <div className={`w-12 h-12 rounded-[1.25rem] bg-${metric.color}-50 dark:bg-${metric.color}-900/20 flex items-center justify-center text-${metric.color}-600 mb-4 transition-transform group-hover:scale-110`}>
                            {metric.icon}
                        </div>
                        <div className="space-y-1">
                            <h4 className={`text-2xl font-black text-slate-900 dark:text-white ${metric.label.toLowerCase().includes('profit') || metric.label.toLowerCase().includes('revenue') ? 'privacy-blur' : ''}`}>{metric.value}</h4>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{metric.label}</p>
                            <p className="text-[10px] font-bold text-slate-400/80">{metric.hint}</p>
                        </div>
                    </motion.div>
                ))}
            </section>

            {/* Performance Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Revenue Analytics</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Growth Velocity Tracking</p>
                        </div>
                        <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-[1.25rem] border border-slate-100 dark:border-slate-800">
                            {['7D', '30D', '90D'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setPeriod(r)}
                                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] transition-all ${period === r ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: 800, fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-indigo-600 rounded-[1.25rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-500/20">
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-white/10 rounded-[1.25rem] flex items-center justify-center mb-6">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight leading-tight">Optimization<br/>Engine Active</h3>
                            <p className="mt-4 text-indigo-100 text-sm font-medium leading-relaxed">
                                System indicates healthy net margins. Focus on clearing high-risk items from the watchlist below.
                            </p>
                        </div>
                        <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Total Profit</p>
                                <p className="text-2xl font-black privacy-blur">₹{Number(stats?.totalProfit || 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Avg Ticket</p>
                                <p className="text-2xl font-black privacy-blur">₹{Math.round((stats?.totalRevenue || 0) / (stats?.totalSalesCount || 1)).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                </div>
            </section>

            {/* Watchlists */}
            {currentRole !== 'super_admin' && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Expiry Watchlist */}
                    <div className="bg-white dark:bg-slate-900 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-[1.25rem] flex items-center justify-center text-rose-600 shadow-sm border border-rose-100/50">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Expiry Watchlist</h3>
                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Critical: Action Required</p>
                                </div>
                            </div>
                            <span className="px-4 py-1.5 bg-rose-50 dark:bg-rose-900/40 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100">
                                {stats?.expiringProducts || 0} Alerts
                            </span>
                        </div>

                        <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                            {(stats?.expiringProductsList || []).length > 0 ? (
                                stats.expiringProductsList.map((item) => (
                                    <div key={item._id} className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-800/40 rounded-[1.25rem] border border-slate-100 dark:border-slate-800/50 group hover:border-rose-300 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm text-slate-300">
                                                <Package size={18} />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase text-slate-900 dark:text-white truncate max-w-[200px]">{item.productName}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Expires: {new Date(item.expiryDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-900 dark:text-white">{item.quantity} Units</p>
                                            <Link to="/dashboard/inventory" className="inline-flex items-center gap-1 mt-1 text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline group-hover:gap-2 transition-all">
                                                Audit <ArrowRight size={10} />
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-16 text-center">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-200 mb-4 border border-slate-100">
                                        <ShieldCheck size={32} />
                                    </div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">All Assets Stable</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Low Stock Watchlist */}
                    <div className="bg-white dark:bg-slate-900 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-[1.25rem] flex items-center justify-center text-amber-600 shadow-sm border border-amber-100/50">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Low Stock Watchlist</h3>
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Refill Protocol Active</p>
                                </div>
                            </div>
                            <span className="px-4 py-1.5 bg-amber-50 dark:bg-amber-900/40 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                                {stats?.lowStockProducts || 0} Items
                            </span>
                        </div>

                        <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                            {(stats?.lowStockProductsList || []).length > 0 ? (
                                stats.lowStockProductsList.map((item) => (
                                    <div key={item._id} className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-800/40 rounded-[1.25rem] border border-slate-100 dark:border-slate-800/50 group hover:border-amber-300 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm text-slate-300">
                                                <Package size={18} />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase text-slate-900 dark:text-white truncate max-w-[200px]">{item.productName}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Current: {item.quantity} Units</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-900 dark:text-white">Min: {item.lowStockThreshold}</p>
                                            <Link to="/dashboard/inventory" className="inline-flex items-center gap-1 mt-1 text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline group-hover:gap-2 transition-all">
                                                Restock <ArrowUpRight size={10} />
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-16 text-center">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-200 mb-4 border border-slate-100">
                                        <ShieldCheck size={32} />
                                    </div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Inventory Fully Operational</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Super Admin Table Section */}
            {currentRole === 'super_admin' && (
                <section className="bg-white dark:bg-slate-900 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Network Directory</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latest Merchant Onboarding</p>
                        </div>
                        <Link to="/dashboard/shops" className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">
                            View All Partners
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50 dark:border-slate-800">
                                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Merchant Entity</th>
                                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ownership</th>
                                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Plan Tier</th>
                                    <th className="py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {(stats?.recentTransactions || []).slice(0, 5).map((shop, idx) => (
                                    <tr key={shop._id || idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                                        <td className="py-4">
                                            <p className="font-black text-sm uppercase text-slate-900 dark:text-white">{shop.shopName || 'N/A'}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">{shop._id?.substring(0, 8).toUpperCase()}</p>
                                        </td>
                                        <td className="py-4 text-sm font-bold text-slate-600 dark:text-slate-400">{shop.ownerName || 'N/A'}</td>
                                        <td className="py-4">
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[9px] font-black uppercase tracking-widest">{shop.subscriptionPlan || 'Free'}</span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Overview;

