import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Copy, Mail, MapPin, Phone, ShieldCheck, Store, User } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Account = () => {
    const { user } = useAuth();

    const handleCopyId = () => {
        if (!user?.shopId) return;
        navigator.clipboard.writeText(user.shopId);
        toast.success('Shop ID copied');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const roleLabel = user?.role?.replace('_', ' ') || 'shop owner';

    const fields = [
        { label: 'Owner Name', value: user?.ownerName || '-', icon: <User size={16} className="text-indigo-600" /> },
        { label: 'Shop Name', value: user?.shopName || '-', icon: <Store size={16} className="text-indigo-600" /> },
        { label: 'Email', value: user?.email || '-', icon: <Mail size={16} className="text-indigo-600" /> },
        { label: 'Phone', value: user?.phone || '-', icon: <Phone size={16} className="text-indigo-600" /> },
        { label: 'Role', value: roleLabel, icon: <ShieldCheck size={16} className="text-indigo-600" /> },
        { label: 'Created At', value: formatDate(user?.createdAt), icon: <Calendar size={16} className="text-indigo-600" /> },
    ];

    return (
        <div className="space-y-6 pb-10">
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase dark:text-white">Account</h1>
                <p className="mt-1 text-slate-500 dark:text-slate-400">View your shop profile and account identity details.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl lg:col-span-4 sm:p-8"
                >
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Shop Identity</p>
                    <p className="mt-3 break-all font-mono text-2xl font-bold tracking-tight">{user?.shopId || 'N/A'}</p>
                    <p className="mt-2 text-sm text-slate-300">Use this ID for admin support and onboarding verification.</p>
                    <button
                        onClick={handleCopyId}
                        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
                    >
                        <Copy size={16} /> Copy ID
                    </button>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:col-span-8 sm:p-8"
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {fields.map((field) => (
                            <div key={field.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                                <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    {field.icon}
                                    {field.label}
                                </div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{field.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                        <div className="mb-1 inline-flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                            <MapPin size={16} className="text-indigo-600" /> Address
                        </div>
                        <p>{user?.address || 'Not provided'}</p>
                    </div>
                </motion.section>
            </div>
        </div>
    );
};

export default Account;
