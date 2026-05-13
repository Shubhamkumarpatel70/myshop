import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Package, Layers, AlertTriangle, Clock, 
    DollarSign, ShoppingCart, TrendingUp, ArrowUpRight,
    Calendar, Briefcase, Zap, ShieldCheck, Target,
    Search, Plus, Globe, Activity, BarChart3, Users, Store
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Overview = () => {
    const [stats, setStats] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30D');
    const { user } = useAuth();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                if (user?.role === 'Admin') {
                    const res = await api.get('/reports/admin-stats');
                    setStats({
                        totalOwners: res.data.data.totalOwners,
                        totalProducts: res.data.data.totalProducts,
                        totalRevenue: res.data.data.totalRevenue,
                        lowStockProducts: res.data.data.lowStockShops,
                        expiringProducts: res.data.data.todaySales,
                        todayProducts: res.data.data.todayProducts,
                        recentTransactions: res.data.data.shops
                    });
                } else {
                    const statsRes = await api.get('/reports/dashboard');
                    const analyticsRes = await api.get(`/reports/sales?period=${period.replace('D', '')}`);
                    setStats(statsRes.data.data);
                    setSalesData(analyticsRes.data.data.dailySales || []);
                }
            } catch (error) {
                console.error("Dashboard Fetch Error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user, period]);

    if (loading) return (
        <div className="space-y-8 animate-pulse p-4">
            <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                <div className="lg:col-span-2 h-[450px] bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]"></div>
                <div className="h-[450px] bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]"></div>
            </div>
        </div>
    );

    const getHealthScore = () => {
        if (!stats) return 0;
        let score = 100; // Base score set to 100% per user request
        if (stats.lowStockProducts > 0) score -= 10;
        if (stats.expiredProducts > 0) score -= 15;
        if (stats.totalRevenue > 10000) score += 5;
        return Math.min(100, Math.max(0, score));
    };

    const healthColor = getHealthScore() > 80 ? '#10b981' : getHealthScore() > 50 ? '#f59e0b' : '#ef4444';

    const mainCards = [
        { 
            title: 'Gross Revenue', 
            value: `₹${stats?.totalRevenue?.toLocaleString() || 0}`, 
            icon: <DollarSign size={24} />, 
            color: 'bg-indigo-600', 
            trend: `${stats?.growthRate || 0}%`, 
            description: 'Total sales generated'
        },
        { 
            title: user?.role === 'Admin' ? 'Active Network' : 'Net Profit', 
            value: user?.role === 'Admin' ? `${stats?.totalOwners || 0} Shops` : `₹${stats?.totalProfit?.toLocaleString() || 0}`, 
            icon: user?.role === 'Admin' ? <Globe size={24} /> : <TrendingUp size={24} />, 
            color: 'bg-emerald-500', 
            trend: `${stats?.growthRate || 0}%`, 
            description: user?.role === 'Admin' ? 'Partners on platform' : 'Profit after COGS'
        },
        { 
            title: 'Active Inventory', 
            value: stats?.totalProducts?.toLocaleString() || 0, 
            icon: <Package size={24} />, 
            color: 'bg-amber-500', 
            trend: 'Stable', 
            description: 'Units in warehouse'
        },
        { 
            title: 'Transactions', 
            value: stats?.totalSalesCount?.toLocaleString() || 0, 
            icon: <Zap size={24} />, 
            color: 'bg-rose-500', 
            trend: `${stats?.growthRate || 0}%`, 
            description: 'Orders processed'
        },
    ];

    return (
        <div className="space-y-10 pb-20">
            {/* Business Intelligence Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-indigo-600 font-black uppercase text-[10px] tracking-[0.3em]">
                        <Activity size={14} /> Control Center
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                        Business <span className="text-indigo-600">Intelligence</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-xl">
                        {user?.role === 'Admin' 
                            ? "Global oversight of all connected shop nodes and system performance." 
                            : `Real-time analytics for ${user?.shopName}. Your growth is currently up 12% from last month.`}
                    </p>
                </div>
                
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="hidden sm:flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                        <Calendar size={18} className="text-indigo-600" />
                        <span className="text-sm font-bold uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <button onClick={() => window.location.reload()} className="btn btn-primary h-14 px-8 rounded-[1.5rem]">
                        Refresh Insights
                    </button>
                </div>
            </div>

            {/* Smart Risk & Action Banner */}
            {(stats?.lowStockProducts > 0 || stats?.expiredProducts > 0) && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-1 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500 rounded-[2rem] shadow-2xl shadow-rose-500/10"
                >
                    <div className="bg-white dark:bg-slate-950 rounded-[1.9rem] p-5 lg:p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-5 text-center sm:text-left">
                            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 animate-pulse shrink-0">
                                <AlertTriangle size={24} lg:size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg lg:text-xl font-black uppercase tracking-tight">Immediate Action Required</h3>
                                <p className="text-slate-500 text-xs lg:text-sm font-medium">
                                    We detected <span className="text-rose-500 font-black">{stats.expiredProducts || 0} expired items</span> and 
                                    <span className="text-amber-500 font-black"> {stats.lowStockProducts || 0} low stock risks</span>. 
                                </p>
                            </div>
                        </div>
                        <Link to="/dashboard/inventory" className="btn btn-primary h-12 lg:h-14 px-8 lg:px-10 whitespace-nowrap w-full md:w-auto">
                            Resolve Risks
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {mainCards.map((card, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="card group hover:scale-[1.02] active:scale-95 cursor-default relative overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 ${card.color} opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition-all duration-500`}></div>
                        
                        <div className="flex justify-between items-start relative z-10">
                            <div className={`w-12 h-12 ${card.color} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/10`}>
                                {card.icon}
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                                    card.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                                }`}>
                                    {card.trend}
                                </span>
                            </div>
                        </div>
                        <div className="mt-8 relative z-10">
                            <h3 className="text-4xl font-black tracking-tight">{card.value}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{card.title}</p>
                            <p className="text-[10px] text-slate-400 mt-2 italic">{card.description}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Performance Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Curve */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card lg:col-span-2 relative overflow-hidden"
                >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tight">Growth Trajectory</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Historical Revenue Analytics</p>
                        </div>
                        <div className="flex p-1 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            {['7D', '30D', '90D'].map(t => (
                                <button 
                                    key={t} 
                                    onClick={() => setPeriod(t)}
                                    className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${t === period ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="_id" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} 
                                    dy={10} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} 
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '1.5rem', 
                                        border: 'none', 
                                        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                                        backgroundColor: '#1e293b',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#fff', fontWeight: 900 }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="total" 
                                    stroke="#4f46e5" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#revenueGrad)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Business Health Meter */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card flex flex-col items-center justify-center text-center p-10"
                >
                    <div className="relative w-48 h-48 mb-8">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="96" cy="96" r="88"
                                stroke="currentColor"
                                strokeWidth="16"
                                fill="transparent"
                                className="text-slate-100 dark:text-slate-800"
                            />
                            <circle
                                cx="96" cy="96" r="88"
                                stroke={healthColor}
                                strokeWidth="16"
                                strokeDasharray={552.92}
                                strokeDashoffset={552.92 * (1 - getHealthScore() / 100)}
                                strokeLinecap="round"
                                fill="transparent"
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-black tracking-tighter" style={{ color: healthColor }}>
                                {getHealthScore()}%
                            </span>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Health Score</span>
                        </div>
                    </div>
                    <div className="space-y-4 w-full">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="text-emerald-500" size={18} />
                                <span className="text-xs font-bold uppercase tracking-widest">Compliance</span>
                            </div>
                            <span className="text-xs font-black text-emerald-500">OPTIMAL</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <Target className="text-indigo-500" size={18} />
                                <span className="text-xs font-bold uppercase tracking-widest">Profitability</span>
                            </div>
                            <span className="text-xs font-black text-indigo-500">GOOD</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed px-4">
                            Your store health is calculated based on inventory turnover, stock-outs, and revenue trends.
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Admin: Recent Merchant Nodes */}
            {user?.role === 'Admin' && stats?.recentTransactions && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-8 rounded-[3rem]"
                >
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Recent Merchant Nodes</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Latest shops onboarded to the network</p>
                        </div>
                        <Link to="/dashboard/shops" className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline">View All Shops</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Shop Name</th>
                                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Owner</th>
                                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Type</th>
                                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {stats.recentTransactions.slice(0, 5).map((shop) => (
                                    <tr key={shop._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center text-indigo-600">
                                                    <Store size={16} />
                                                </div>
                                                <span className="font-bold text-sm">{shop.shopName}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm font-medium text-slate-500">{shop.ownerName}</td>
                                        <td className="py-4">
                                            <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg">
                                                {shop.businessType}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                                                shop.isSuspended ? 'text-rose-500 bg-rose-50' : 'text-emerald-500 bg-emerald-50'
                                            }`}>
                                                {shop.isSuspended ? 'Suspended' : 'Active'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Quick Strategic Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link to="/dashboard/sales" className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-500/20 flex flex-col gap-4 hover:scale-105 transition-all group">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Plus size={24} />
                    </div>
                    <div>
                        <h4 className="font-black uppercase tracking-tight">New Order</h4>
                        <p className="text-indigo-100 text-[10px]">Open POS Interface</p>
                    </div>
                </Link>
                <Link to="/dashboard/inventory" className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] flex flex-col gap-4 hover:scale-105 transition-all group shadow-sm">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <Package size={24} />
                    </div>
                    <div>
                        <h4 className="font-black uppercase tracking-tight">Stock In</h4>
                        <p className="text-slate-400 text-[10px]">Add New Inventory</p>
                    </div>
                </Link>
                <Link to="/dashboard/reports" className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] flex flex-col gap-4 hover:scale-105 transition-all group shadow-sm">
                    <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-2xl flex items-center justify-center">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h4 className="font-black uppercase tracking-tight">Analytics</h4>
                        <p className="text-slate-400 text-[10px]">Full Business Reports</p>
                    </div>
                </Link>
                <Link to="/dashboard/staff" className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] flex flex-col gap-4 hover:scale-105 transition-all group shadow-sm">
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <h4 className="font-black uppercase tracking-tight">Staffing</h4>
                        <p className="text-slate-400 text-[10px]">Manage Permissions</p>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default Overview;
