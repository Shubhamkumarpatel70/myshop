import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { CreditCard, Save, QrCode, User } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentSettings = () => {
    const [config, setConfig] = useState({
        upiId: '',
        merchantName: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/payments');
            if (res.data.data) {
                setConfig(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch payment config");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/payments', config);
            toast.success("Payment settings updated");
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-black tracking-tight uppercase">Payment Node</h1>
                <p className="text-secondary-500 font-medium">Configure your secure Scan & Pay (UPI) gateway.</p>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-secondary-900 rounded-[2.5rem] shadow-xl border border-secondary-100 dark:border-secondary-800 p-8"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-secondary-400 ml-1">Merchant Name (Display Name)</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-600" size={18} />
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. My General Store"
                                    className="input-field pl-12 h-14"
                                    value={config.merchantName}
                                    onChange={(e) => setConfig({...config, merchantName: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-secondary-400 ml-1">UPI ID (VPA)</label>
                            <div className="relative">
                                <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-600" size={18} />
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. yourname@okaxis"
                                    className="input-field pl-12 h-14"
                                    value={config.upiId}
                                    onChange={(e) => setConfig({...config, upiId: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-secondary-50 dark:bg-secondary-800/50 rounded-3xl border border-secondary-100 dark:border-secondary-800 flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <CreditCard size={24} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold">Secure Transactions</p>
                            <p className="text-xs text-secondary-500">Your UPI ID will be used to generate dynamic QR codes for your customers during checkout.</p>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={saving}
                        className="w-full h-16 bg-primary-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-primary-500/20 hover:bg-primary-500 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-30 flex items-center justify-center gap-3 group"
                    >
                        {saving ? 'Updating...' : <><Save size={20} className="group-hover:scale-110 transition-transform" /> Save Settings</>}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default PaymentSettings;
