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
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Overview = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30D');

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                if (user?.role === 'super_admin') {
                    const res = await api.get('/reports/admin-stats');
                    const d = res.data?.data || {};
                    setStats({
                        totalOwners: d.totalOwners || 0,
                        totalProducts: d.totalProducts || 0,
                        totalRevenue: d.totalRevenue || 0,
                        lowStockProducts: d.lowStockShops || 0,
                        todaySales: d.todaySales || 0,
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
            }
        };

        fetchDashboardData();
    }, [user?.role, period]);

    const roleConfig = {
        super_admin: {
            badge: 'Admin Dashboard',
            title: 'Platform control center',
            description: 'Monitor network-wide shops, product flow, approvals, and compliance from one place.',
            quickActions: [
                { label: 'Review approvals', to: '/dashboard/admin/approvals' },
                { label: 'Subscription audit', to: '/dashboard/admin/subscriptions' },
                { label: 'Shop finder', to: '/dashboard/admin/shop-finder' },
                { label: 'Admin inventory', to: '/dashboard/admin/inventory' },
            ],
        },
        shop_owner: {
            badge: 'Owner Dashboard',
            title: 'Business performance overview',
            description: 'Track sales, stock health, and team operations for your store.',
            quickActions: [
                { label: 'Start sale', to: '/dashboard/sales' },
                { label: 'Manage inventory', to: '/dashboard/inventory' },
                { label: 'View reports', to: '/dashboard/reports' },
                { label: 'Manage staff', to: '/dashboard/staff' },
            ],
        },
        manager: {
            badge: 'Manager Dashboard',
            title: 'Daily operations summary',
            description: 'Keep billing and inventory workflows running smoothly with live operational visibility.',
            quickActions: [
                { label: 'Start sale', to: '/dashboard/sales' },
                { label: 'Inventory status', to: '/dashboard/inventory' },
                { label: 'Category setup', to: '/dashboard/categories' },
                { label: 'Shift logs', to: '/dashboard/shifts' },
            ],
        },
        cashier: {
            badge: 'Cashier Dashboard',
            title: 'Checkout operations panel',
            description: 'Focus on fast billing, shift tracking, and transaction accuracy.',
            quickActions: [
                { label: 'Open POS', to: '/dashboard/sales' },
                { label: 'My shifts', to: '/dashboard/shifts' },
                { label: 'My account', to: '/dashboard/account' },
                { label: 'Back to overview', to: '/dashboard' },
            ],
        },
    };

    const currentRole = user?.role || 'shop_owner';
    const currentRoleConfig = roleConfig[currentRole] || roleConfig.shop_owner;

    const metrics = useMemo(() => {
        if (!stats) return [];

        if (currentRole === 'super_admin') {
            return [
                {
                    label: 'Total shops',
                    value: stats.totalOwners || 0,
                    icon: <Store size={18} className="text-indigo-600" />,
                    hint: 'Registered merchant accounts',
                },
                {
                    label: 'Network products',
                    value: stats.totalProducts || 0,
                    icon: <Package size={18} className="text-emerald-600" />,
                    hint: 'Products across all shops',
                },
                {
                    label: 'Revenue',
                    value: `₹${Number(stats.totalRevenue || 0).toLocaleString()}`,
                    icon: <DollarSign size={18} className="text-amber-600" />,
                    hint: 'Aggregate platform sales',
                },
                {
                    label: 'Low stock shops',
                    value: stats.lowStockProducts || 0,
                    icon: <AlertTriangle size={18} className="text-rose-600" />,
                    hint: 'Shops requiring stock action',
                },
            ];
        }

        return [
            {
                label: 'Revenue',
                value: `₹${Number(stats.totalRevenue || 0).toLocaleString()}`,
                icon: <DollarSign size={18} className="text-indigo-600" />,
                hint: 'Total sales for selected period',
            },
            {
                label: 'Transactions',
                value: Number(stats.totalSalesCount || 0).toLocaleString(),
                icon: <ShoppingCart size={18} className="text-emerald-600" />,
                hint: 'Completed sales entries',
            },
            {
                label: 'Products',
                value: Number(stats.totalProducts || 0).toLocaleString(),
                icon: <Package size={18} className="text-amber-600" />,
                hint: 'Active catalog count',
            },
            {
                label: 'Low stock alerts',
                value: Number(stats.lowStockProducts || 0).toLocaleString(),
                icon: <AlertTriangle size={18} className="text-rose-600" />,
                hint: 'Items near reorder threshold',
            },
        ];
    }, [stats, currentRole]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-72 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-36 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                    ))}
                </div>
                <div className="h-[360px] rounded-2xl bg-slate-200 dark:bg-slate-800" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
                <p className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
                    {currentRoleConfig.badge}
                </p>
                <h1 className="mt-3 font-outfit text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                    {currentRoleConfig.title}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
                    {currentRoleConfig.description}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {currentRoleConfig.quickActions.map((action) => (
                        <Link
                            key={action.label}
                            to={action.to}
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                            {action.label}
                        </Link>
                    ))}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                    <motion.article
                        key={metric.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                    >
                        <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800">{metric.icon}</div>
                        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{metric.value}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{metric.label}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{metric.hint}</p>
                    </motion.article>
                ))}
            </section>

            {currentRole !== 'super_admin' && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-outfit text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sales trend</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Revenue movement for selected duration</p>
                        </div>
                        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
                            {['7D', '30D', '90D'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setPeriod(range)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${period === range ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[300px] sm:h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="_id" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2.5} fill="url(#salesFill)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}

            {currentRole === 'super_admin' && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="font-outfit text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Recent shops</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Latest onboarding or active network entities</p>
                        </div>
                        <Link to="/dashboard/shops" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                            View all
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="py-2 pr-4 font-semibold text-slate-600 dark:text-slate-300">Shop</th>
                                    <th className="py-2 pr-4 font-semibold text-slate-600 dark:text-slate-300">Owner</th>
                                    <th className="py-2 pr-4 font-semibold text-slate-600 dark:text-slate-300">Plan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(stats?.recentTransactions || []).slice(0, 6).map((shop, idx) => (
                                    <tr key={shop._id || idx} className="border-b border-slate-100 dark:border-slate-800">
                                        <td className="py-2 pr-4 font-medium text-slate-900 dark:text-white">{shop.shopName || 'N/A'}</td>
                                        <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{shop.ownerName || 'N/A'}</td>
                                        <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{shop.subscriptionPlan || 'Free'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {currentRole !== 'super_admin' && (
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-3 inline-flex rounded-lg bg-indigo-50 p-2 dark:bg-indigo-500/15">
                            <TrendingUp size={18} className="text-indigo-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Performance focus</h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Track daily sales consistency and bill throughput.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-3 inline-flex rounded-lg bg-emerald-50 p-2 dark:bg-emerald-500/15">
                            <ShieldCheck size={18} className="text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Operational quality</h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Use role-based access and shift logs for accountability.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-3 inline-flex rounded-lg bg-amber-50 p-2 dark:bg-amber-500/15">
                            <Clock size={18} className="text-amber-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Daily discipline</h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Resolve low-stock alerts and close transactions on time.</p>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Overview;
