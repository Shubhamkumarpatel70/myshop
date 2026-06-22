import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
    IndianRupee, Users, Store, TrendingUp, 
    Calendar, Download, ArrowUpRight, BarChart3,
    PieChart, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

const AdminRevenue = () => {
    const { t } = useLanguage();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/subscriptions/admin/revenue');
            setStats(res.data.data);
        } catch (error) {
            toast.error(t("Failed to load financial records"));
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center">{t("Initializing Financial Core...")}</div>;

    const cards = [
        { 
            title: t('Total Revenue'), 
            value: `₹${stats.totalEarnings.toLocaleString()}`, 
            icon: <IndianRupee className="text-emerald-500" />,
            desc: t('Total lifetime platform earnings')
        },
        { 
            title: t('Active Subscriptions'), 
            value: stats.activeSubscriptions, 
            icon: <Zap className="text-amber-500" />,
            desc: t('Pro & Enterprise accounts')
        },
        { 
            title: t('Total Merchants'), 
            value: stats.totalShops, 
            icon: <Store className="text-indigo-500" />,
            desc: t('Global shop network')
        }
    ];

    return (
        <div className="space-y-8 pb-10 font-jakarta">
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">{t("Financial Hub")}</p>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{t("Revenue Reconciliation")}</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t("Real-time audit of platform revenue, subscription performance, and growth metrics.")}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                {card.icon}
                            </div>
                            <span className="p-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg text-[10px] font-bold">
                                {t("LIVE DATA")}
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-tight">{card.title}</h3>
                        <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{card.value}</p>
                        <p className="text-xs text-slate-400 mt-2 font-medium">{card.desc}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl">
                            <PieChart size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("Plan Distribution")}</h3>
                    </div>
                    
                    <div className="space-y-4">
                        {Object.entries(stats.planDistribution).map(([name, count], i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">{t(name)}</span>
                                    <span className="text-sm font-black text-slate-900 dark:text-white">{count} {t("Shops")}</span>
                                </div>
                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(count / stats.totalShops) * 100}%` }}
                                        className={`h-full rounded-full ${
                                            name === 'Free' ? 'bg-slate-400' : 
                                            name === 'Professional' ? 'bg-indigo-600' : 'bg-amber-500'
                                        }`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-white/10 text-white rounded-xl">
                                <TrendingUp size={20} />
                            </div>
                            <h3 className="text-lg font-bold">{t("Growth Momentum")}</h3>
                        </div>
                        <p className="text-4xl font-black">74%</p>
                        <p className="text-sm text-indigo-200 mt-2 font-medium">{t("Retention rate of Pro users")}</p>
                        
                        <div className="mt-12 grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">{t("Avg. Revenue")}</p>
                                <p className="text-xl font-bold mt-1">₹1,490</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">{t("Churn Rate")}</p>
                                <p className="text-xl font-bold mt-1">2.4%</p>
                            </div>
                        </div>
                    </div>
                    
                    <BarChart3 className="absolute -bottom-10 -right-10 text-white/5" size={240} />
                </div>
            </div>
        </div>
    );
};

export default AdminRevenue;
