import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Check, Zap, Shield, Crown, 
    ArrowRight, Upload, Info, AlertCircle,
    Package, Users, BarChart3, Clock
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const Pricing = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [screenshot, setScreenshot] = useState(null);
    const [uploading, setUploading] = useState(false);

    const plans = [
        {
            name: 'Free',
            price: '₹0',
            duration: 'Forever',
            description: 'Essential tools for small local vendors and kiosks.',
            icon: <Zap className="text-amber-500" size={24} />,
            features: [
                'Max 20 Products',
                '0 Staff Accounts',
                'Basic Sales History',
                'Offline POS Sync',
                'Standard Receipt Printing'
            ],
            color: 'bg-slate-50 dark:bg-slate-900',
            button: 'Current Plan',
            disabled: true
        },
        {
            name: 'Professional',
            price: '₹1,999',
            duration: 'per year',
            description: 'Built for growing stores, pharmacies, and hardware shops.',
            icon: <Shield className="text-indigo-600" size={24} />,
            features: [
                'Max 1,000 Products',
                'Up to 5 Staff Accounts',
                'Advanced PDF Reports',
                'Customer CRM Registry',
                'VIP Loyalty Tracking',
                'Email Support'
            ],
            color: 'bg-indigo-50/50 dark:bg-indigo-500/5',
            button: 'Upgrade to Pro',
            recommended: true
        },
        {
            name: 'Enterprise',
            price: '₹4,999',
            duration: 'per year',
            description: 'The complete Retail OS for multi-branch and high-volume businesses.',
            icon: <Crown className="text-amber-600" size={24} />,
            features: [
                'Unlimited Products',
                'Unlimited Staff Accounts',
                'Custom Business Analytics',
                'Multiple Shop Switching',
                '24/7 Dedicated Support',
                'Premium Barcode Tools'
            ],
            color: 'bg-amber-50/50 dark:bg-amber-500/5',
            button: 'Go Enterprise'
        }
    ];

    const handleScreenshotUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('/products/upload', formData); // Reuse product upload for now
            setScreenshot(res.data.url);
            toast.success("Payment proof uploaded!");
        } catch (error) {
            toast.error("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmitRequest = async () => {
        if (!screenshot) return toast.error("Please upload payment screenshot");
        
        setLoading(true);
        try {
            const res = await api.post('/subscriptions/request', {
                plan: selectedPlan.name,
                screenshot
            });
            if (res.data.success) {
                toast.success(res.data.message);
                setIsUpgradeModalOpen(false);
                // Refresh profile to show pending status
                const profileRes = await api.get('/auth/profile');
                updateUser(profileRes.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Request failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-indigo-600 font-black uppercase text-[10px] tracking-[0.3em]">
                    <Package size={14} /> Pricing & Growth
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                    Choose Your <span className="text-indigo-600">Expansion</span>
                </h1>
                <p className="text-slate-500 font-medium max-w-2xl mx-auto text-lg">
                    Scale StockSaathi as your business grows. No hidden fees, just simple tools to power your shop.
                </p>
            </div>

            {user?.pendingSubscription?.status === 'Pending' && (
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-4xl mx-auto p-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-[2rem] flex items-center gap-4"
                >
                    <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0">
                        <Clock size={24} className="animate-pulse" />
                    </div>
                    <div>
                        <p className="font-black text-amber-800 dark:text-amber-500 uppercase text-xs tracking-widest">Upgrade Request Pending</p>
                        <p className="text-sm text-amber-700 dark:text-amber-400/80 font-medium mt-1">
                            You have requested the <span className="font-black uppercase">{user.pendingSubscription.plan}</span> plan. Our team is verifying your payment screenshot.
                        </p>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {plans.map((plan) => (
                    <div 
                        key={plan.name}
                        className={`relative p-10 rounded-[3rem] border transition-all duration-500 flex flex-col ${
                            user?.subscriptionPlan === plan.name 
                            ? 'border-indigo-500 bg-white dark:bg-slate-900 shadow-2xl shadow-indigo-500/10' 
                            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-indigo-200'
                        }`}
                    >
                        {plan.recommended && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30">
                                Most Popular
                            </div>
                        )}

                        <div className="mb-8">
                            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                                {plan.icon}
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">{plan.name}</h3>
                            <div className="flex items-baseline gap-2 mt-4">
                                <span className="text-4xl font-black tracking-tighter">{plan.price}</span>
                                <span className="text-slate-400 font-bold text-sm tracking-tight">{plan.duration}</span>
                            </div>
                            <p className="text-slate-500 text-sm mt-4 font-medium leading-relaxed">{plan.description}</p>
                        </div>

                        <div className="flex-1 space-y-4 mb-10">
                            {plan.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                                    <div className="w-5 h-5 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center shrink-0">
                                        <Check size={12} className="text-indigo-600" />
                                    </div>
                                    {feature}
                                </div>
                            ))}
                        </div>

                        <button 
                            disabled={user?.subscriptionPlan === plan.name || plan.name === 'Free' || user?.pendingSubscription?.status === 'Pending'}
                            onClick={() => {
                                setSelectedPlan(plan);
                                setIsUpgradeModalOpen(true);
                            }}
                            className={`w-full h-16 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 ${
                                user?.subscriptionPlan === plan.name 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default' 
                                : 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed'
                            }`}
                        >
                            {user?.subscriptionPlan === plan.name ? 'Active Plan' : plan.button}
                            {user?.subscriptionPlan !== plan.name && plan.name !== 'Free' && <ArrowRight size={18} />}
                        </button>
                    </div>
                ))}
            </div>

            {/* Manual Payment Modal */}
            <Modal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                title={`Upgrade to ${selectedPlan?.name}`}
                className="max-w-2xl"
            >
                <div className="space-y-8 py-4">
                    <div className="p-6 bg-indigo-50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 space-y-4">
                        <div className="flex items-center gap-3 text-indigo-600">
                            <Info size={20} />
                            <p className="font-black uppercase text-[10px] tracking-widest">Manual Payment Instructions</p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                            To upgrade to <span className="font-black text-indigo-600">{selectedPlan?.name}</span>, please pay <span className="font-black text-slate-900 dark:text-white">{selectedPlan?.price}</span> via UPI to the address below and upload a screenshot of the transaction.
                        </p>
                        
                        <div className="flex flex-col items-center gap-4 py-6 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                            <div className="w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                                <p className="text-[10px] font-black uppercase text-slate-400">Admin UPI QR Code</p>
                            </div>
                            <p className="text-lg font-black tracking-tight select-all cursor-copy" onClick={() => {
                                navigator.clipboard.writeText('stocksaathi@upi');
                                toast.success("UPI ID copied!");
                            }}>stocksaathi@upi</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-secondary-400 ml-2 tracking-[0.2em]">Upload Payment Screenshot</label>
                        <div className="relative h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center group hover:border-indigo-500/50 transition-all cursor-pointer overflow-hidden">
                            {screenshot ? (
                                <img src={screenshot} alt="Payment" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <Upload size={32} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                    <p className="mt-2 text-xs font-black text-slate-400 uppercase tracking-widest">Select Screenshot</p>
                                </>
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={handleScreenshotUpload}
                                disabled={uploading}
                            />
                            {uploading && (
                                <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={handleSubmitRequest}
                        disabled={loading || !screenshot}
                        className="w-full h-18 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
                    >
                        {loading ? 'Submitting Request...' : 'Submit Payment Proof'} <Check size={20} />
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default Pricing;
