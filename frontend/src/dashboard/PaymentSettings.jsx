import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { CreditCard, QrCode, Save, User } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentSettings = () => {
    const [config, setConfig] = useState({ upiId: '', merchantName: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/payments');
            if (res.data.data) setConfig(res.data.data);
        } catch {
            toast.error('Unable to load payment settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/payments', config);
            toast.success('Payment settings saved');
        } catch {
            toast.error('Unable to save payment settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="grid h-56 place-items-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6 pb-10">
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase dark:text-white">Payment Settings</h1>
                <p className="mt-1 text-slate-500 dark:text-slate-400">Configure your UPI details for Scan & Pay in POS checkout.</p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Merchant Name</label>
                        <div className="relative">
                            <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                required
                                value={config.merchantName}
                                onChange={(e) => setConfig({ ...config, merchantName: e.target.value })}
                                placeholder="My Store"
                                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">UPI ID</label>
                        <div className="relative">
                            <QrCode size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                required
                                value={config.upiId}
                                onChange={(e) => setConfig({ ...config, upiId: e.target.value })}
                                placeholder="name@bank"
                                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 inline-flex rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                                <CreditCard size={16} />
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Customers will use this UPI ID to complete QR-based payments during checkout.
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                    >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default PaymentSettings;
