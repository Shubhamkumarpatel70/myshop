import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { 
    Activity as ActivityIcon, Package, User, 
    ShoppingCart, RefreshCw, Plus, Trash2, 
    Edit, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Activity = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivity();
    }, []);

    const fetchActivity = async () => {
        try {
            const res = await api.get('/reports/activity');
            setActivities(res.data.data);
        } catch (error) {
            toast.error("Failed to fetch global activity");
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'Add': return <Plus size={16} className="text-emerald-500" />;
            case 'Update': return <Edit size={16} className="text-blue-500" />;
            case 'Delete': return <Trash2 size={16} className="text-red-500" />;
            case 'Sale': return <ShoppingCart size={16} className="text-amber-500" />;
            case 'Restock': return <RefreshCw size={16} className="text-purple-500" />;
            default: return <ActivityIcon size={16} className="text-secondary-500" />;
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'Add': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Update': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Delete': return 'bg-red-50 text-red-700 border-red-100';
            case 'Sale': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'Restock': return 'bg-purple-50 text-purple-700 border-purple-100';
            default: return 'bg-secondary-50 text-secondary-700 border-secondary-100';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">System Activity</h1>
                    <p className="text-secondary-500">Live feed of all shop activities across the platform.</p>
                </div>
                <button 
                    onClick={fetchActivity}
                    className="p-3 bg-white dark:bg-secondary-900 rounded-2xl shadow-sm border border-secondary-100 dark:border-secondary-800 hover:bg-secondary-50 transition-colors"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="bg-white dark:bg-secondary-900 rounded-[2.5rem] shadow-xl border border-secondary-100 dark:border-secondary-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-secondary-50 dark:bg-secondary-800/50">
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">Action</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">Shop</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">Product</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">Change</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-4">
                                            <div className="h-8 bg-secondary-100 dark:bg-secondary-800 rounded-xl w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : activities.length > 0 ? (
                                activities.map((log) => (
                                    <motion.tr 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={log._id} 
                                        className="hover:bg-secondary-50/50 dark:hover:bg-secondary-800/30 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getActionColor(log.action)}`}>
                                                {getActionIcon(log.action)}
                                                {log.action}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-bold">{log.user?.shopName || 'Unknown Shop'}</p>
                                                <p className="text-[10px] text-secondary-500">by {log.user?.ownerName}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Package size={14} className="text-secondary-400" />
                                                <span className="text-sm font-medium">{log.product?.productName || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-secondary-400">{log.previousQuantity}</span>
                                                <span className="text-secondary-300">→</span>
                                                <span className="text-sm font-black">{log.newQuantity}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-secondary-500 font-medium">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </p>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-secondary-500 italic">
                                        No recent activity found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Activity;
