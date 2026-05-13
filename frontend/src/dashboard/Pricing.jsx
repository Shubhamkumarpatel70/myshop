import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Check, Zap, Shield, Crown, 
    ArrowRight, Upload, Info, AlertCircle,
    Package, Users, Clock, LogIn, Calendar, X, DollarSign, RefreshCw
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [screenshot, setScreenshot] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await api.get('/subscriptions/plans');
            setPlans(res.data.data);
        } catch (error) {
            toast.error("Failed to load plans");
        } finally {
            setLoading(false);
        }
    };

    const handleActivateTrial = async () => {
        setSubmitting(true);
        try {
            const res = await api.post('/subscriptions/activate-trial');
            if (res.data.success) {
                toast.success(res.data.message);
                updateUser(res.data.data);
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Trial activation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleScreenshotUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await api.post('/products/upload', formData);
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
        setSubmitting(true);
        try {
            const res = await api.post('/subscriptions/request', { plan: selectedPlan.name, screenshot });
            if (res.data.success) {
                toast.success(res.data.message);
                setIsUpgradeModalOpen(false);
                const profileRes = await api.get('/auth/profile');
                updateUser(profileRes.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Request failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelPlan = async () => {
        if (!cancelReason) return toast.error("Please provide a reason for cancellation");
        setSubmitting(true);
        try {
            const res = await api.post('/subscriptions/cancel', { reason: cancelReason });
            if (res.data.success) {
                toast.success("Cancellation request submitted");
                setIsCancelModalOpen(false);
                const profileRes = await api.get('/auth/profile');
                updateUser(profileRes.data.data);
            }
        } catch (error) {
            toast.error("Cancellation request failed");
        } finally {
            setSubmitting(false);
        }
    };

    // Proration Logic
    const prorationData = useMemo(() => {
        if (!user || !selectedPlan || user.subscriptionPlan === 'Free') return null;
        
        const currentPlan = plans.find(p => p.name === user.subscriptionPlan);
        if (!currentPlan) return null;

        const now = new Date();
        const activatedAt = new Date(user.planActivatedAt || user.createdAt);
        const expiresAt = new Date(user.planExpiresAt);
        
        const totalDuration = expiresAt - activatedAt;
        const elapsed = now - activatedAt;
        
        if (elapsed < 0) return { credit: currentPlan.price, remainingPrice: selectedPlan.price - currentPlan.price };

        const usedRatio = Math.min(1, elapsed / totalDuration);
        const credit = Math.floor(currentPlan.price * (1 - usedRatio));
        const finalPrice = Math.max(0, selectedPlan.price - credit);

        return {
            credit,
            finalPrice,
            daysUsed: Math.floor(elapsed / (1000 * 60 * 60 * 24)),
            totalDays: Math.floor(totalDuration / (1000 * 60 * 60 * 24))
        };
    }, [user, selectedPlan, plans]);

    const getIcon = (name) => {
        if (name === 'Free') return <Zap className="text-amber-500" size={24} />;
        if (name === 'Professional') return <Shield className="text-indigo-600" size={24} />;
        return <Crown className="text-amber-600" size={24} />;
    };

    const isNearExpiry = () => {
        if (!user?.planExpiresAt) return false;
        const expiry = new Date(user.planExpiresAt);
        const now = new Date();
        const diff = expiry - now;
        const days = diff / (1000 * 60 * 60 * 24);
        return days <= 15 && days > 0;
    };

    return (
        <div className="space-y-12 pb-20">
            {user && (
                <div className="space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-7xl mx-auto bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
                        
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-inner">
                                {getIcon(user.subscriptionPlan)}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.3em] mb-1">Your Active Subscription</p>
                                <h2 className="text-4xl font-black tracking-tighter uppercase">{user.subscriptionPlan} Plan</h2>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Calendar size={14} className="text-indigo-500" /> 
                                        Activated: {user.planActivatedAt ? new Date(user.planActivatedAt).toLocaleDateString() : new Date(user.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Clock size={14} className="text-rose-500" /> 
                                        Expires: {user.planExpiresAt ? new Date(user.planExpiresAt).toLocaleDateString() : 'Never'}
                                    </div>
                                    {user.isTrialUsed && (
                                        <div className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                                            Trial Used
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center md:items-end gap-4 relative z-10">
                            <div className="text-center md:text-right">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Billing Cycle</p>
                                <p className="text-xl font-black">Annual License</p>
                            </div>
                            
                            {user.subscriptionPlan !== 'Free' && user.cancellationRequest?.status === 'None' && (
                                <button 
                                    onClick={() => setIsCancelModalOpen(true)}
                                    className="px-6 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                                >
                                    Cancel Subscription
                                </button>
                            )}
                        </div>
                    </motion.div>

                    {/* Cancellation Status Banners */}
                    {user.cancellationRequest?.status === 'Pending' && (
                        <div className="max-w-7xl mx-auto p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Clock className="text-amber-600" size={24} />
                                <div>
                                    <p className="text-sm font-black uppercase text-amber-600">Cancellation Pending</p>
                                    <p className="text-xs font-bold text-slate-500 mt-0.5">Admin is reviewing your request. Plan remains active for now.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {user.cancellationRequest?.status === 'Approved' && (
                        <div className="max-w-7xl mx-auto p-8 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-xl">
                                    <Check size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-emerald-900">Refund Initiated</h3>
                                    <p className="font-bold text-emerald-700">Your refund will be processed within 5-7 working days.</p>
                                </div>
                            </div>
                            {user.cancellationRequest.refundUtr && (
                                <div className="px-8 py-4 bg-white rounded-2xl border border-emerald-100 text-center">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Refund UTR Number</p>
                                    <p className="text-xl font-black font-mono tracking-widest text-slate-900 select-all">{user.cancellationRequest.refundUtr}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {user.cancellationRequest?.status === 'Rejected' && (
                        <div className="max-w-7xl mx-auto p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4">
                            <AlertCircle className="text-rose-600" size={24} />
                            <div>
                                <p className="text-sm font-black uppercase text-rose-600">Cancellation Rejected</p>
                                <p className="text-xs font-bold text-slate-600 mt-0.5">Reason: {user.cancellationRequest.rejectReason}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {user && !user.isTrialUsed && user.subscriptionPlan === 'Free' && (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-4xl mx-auto p-8 bg-indigo-600 rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                            <Zap size={32} className="animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black tracking-tight">Try Professional for FREE</h3>
                            <p className="text-indigo-100 font-medium mt-1">Activate your one-time 7-day trial and unlock all limits.</p>
                        </div>
                    </div>
                    <button onClick={handleActivateTrial} disabled={submitting} className="relative z-10 h-14 px-8 bg-white text-indigo-600 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                        {submitting ? 'Activating...' : 'Start Free Trial'}
                    </button>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {loading ? [1, 2, 3].map(i => <div key={i} className="h-[600px] bg-white dark:bg-slate-900 rounded-[3rem] animate-pulse"></div>) : (
                    <>
                        {user && !user.isTrialUsed && user.subscriptionPlan === 'Free' && (
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }} 
                                className="relative p-10 rounded-[3rem] border-4 border-indigo-600 bg-indigo-50 dark:bg-indigo-500/5 flex flex-col group shadow-2xl shadow-indigo-500/10"
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Risk-Free</div>
                                <div className="mb-8">
                                    <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl text-indigo-600">
                                        <Zap size={24} className="animate-pulse" />
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tight uppercase">Professional <span className="text-indigo-600">Trial</span></h3>
                                    <div className="flex items-baseline gap-2 mt-4">
                                        <span className="text-4xl font-black tracking-tighter">₹0</span>
                                        <span className="text-slate-400 font-bold text-sm tracking-tight">/7 Days</span>
                                    </div>
                                    <p className="text-slate-500 text-sm mt-4 font-medium leading-relaxed italic">Experience the full power of StockSaathi for 7 days without any cost.</p>
                                </div>
                                <div className="flex-1 space-y-4 mb-10">
                                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <Package size={16} className="text-indigo-600" /> All Professional Features
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <Users size={16} className="text-indigo-600" /> Unlimited Possibilities
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-bold text-emerald-600">
                                        <Check size={16} /> No Credit Card Required
                                    </div>
                                </div>
                                <button 
                                    onClick={handleActivateTrial} 
                                    disabled={submitting} 
                                    className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all"
                                >
                                    {submitting ? 'Activating...' : 'Activate 7-Day Access'}
                                </button>
                            </motion.div>
                        )}
                        {plans.map((plan) => (
                    <div key={plan.name} className={`relative p-10 rounded-[3rem] border transition-all duration-500 flex flex-col ${user?.subscriptionPlan === plan.name ? 'border-indigo-500 bg-white dark:bg-slate-900 shadow-2xl shadow-indigo-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-indigo-200'}`}>
                        {plan.isRecommended && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30">Most Popular</div>}
                        <div className="mb-8">
                            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-inner">{getIcon(plan.name)}</div>
                            <h3 className="text-2xl font-black tracking-tight">{plan.name}</h3>
                            <div className="flex items-baseline gap-2 mt-4">
                                <span className="text-4xl font-black tracking-tighter">₹{plan.price.toLocaleString()}</span>
                                <span className="text-slate-400 font-bold text-sm tracking-tight">/{plan.duration}</span>
                            </div>
                            <p className="text-slate-500 text-sm mt-4 font-medium leading-relaxed">{plan.description}</p>
                        </div>
                        <div className="flex-1 space-y-4 mb-10">
                            <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                                <Package size={16} className="text-indigo-600" /> Max Products: {plan.maxProducts === 0 ? 'Unlimited' : plan.maxProducts}
                            </div>
                            <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                                <Users size={16} className="text-indigo-600" /> Max Staff: {plan.maxStaff === 0 ? 'Unlimited' : plan.maxStaff}
                            </div>
                            {plan.features.map((f, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                                    <Check size={16} className="text-emerald-500" /> {f}
                                </div>
                            ))}
                        </div>
                        {!user ? (
                            <button onClick={() => navigate('/login')} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3"><LogIn size={18} /> Login to Continue</button>
                        ) : (
                            <div className="space-y-3">
                                <button 
                                    disabled={user?.subscriptionPlan === plan.name && !isNearExpiry() || (plan.name === 'Free' && user?.subscriptionPlan !== 'Free') || user?.pendingSubscription?.status === 'Pending'} 
                                    onClick={() => { setSelectedPlan(plan); setIsUpgradeModalOpen(true); }} 
                                    className={`w-full h-16 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 ${user?.subscriptionPlan === plan.name ? (isNearExpiry() ? 'bg-indigo-600 text-white shadow-xl' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default') : 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 disabled:opacity-30'}`}
                                >
                                    {user?.pendingSubscription?.status === 'Pending' && user?.pendingSubscription?.plan === plan.name
                                        ? <><Clock size={18} /> Verification Pending</>
                                        : user?.subscriptionPlan === plan.name 
                                            ? (isNearExpiry() ? <><RefreshCw size={18} /> Continue Plan</> : 'Active Plan') 
                                            : plan.name === 'Free' ? 'Starter Plan' 
                                            : <><Zap size={18} /> {isNearExpiry() ? 'Renew & Upgrade' : `Upgrade to ${plan.name}`}</>
                                    }
                                </button>
                                {isNearExpiry() && user?.subscriptionPlan === plan.name && (
                                    <p className="text-[9px] font-black text-rose-500 text-center uppercase tracking-widest animate-pulse">Expiring Soon! Renew now.</p>
                                )}
                            </div>
                        )}
                    </div>
                        ))}
                    </>
                )}
            </div>

            {/* Upgrade/Renew Modal */}
            <Modal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} title={user?.subscriptionPlan === selectedPlan?.name ? `Continue ${selectedPlan?.name} Plan` : `Upgrade to ${selectedPlan?.name}`} className="max-w-2xl">
                <div className="space-y-8 py-4">
                    {prorationData && user.subscriptionPlan !== selectedPlan?.name && (
                        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Prorated Upgrade Credit</p>
                                <p className="text-sm font-bold text-slate-600">Credit for {prorationData.totalDays - prorationData.daysUsed} unused days</p>
                            </div>
                            <p className="text-2xl font-black text-emerald-600">-₹{prorationData.credit.toLocaleString()}</p>
                        </div>
                    )}

                    <div className="p-8 bg-indigo-50 dark:bg-indigo-500/5 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-500/20 space-y-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Final Amount to Pay</p>
                                <p className="text-5xl font-black tracking-tighter text-indigo-600">₹{(prorationData?.finalPrice || selectedPlan?.price || 0).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">UPI ID</p>
                                <p className="text-lg font-black tracking-tight select-all cursor-copy" onClick={() => { navigator.clipboard.writeText('stocksaathi@upi'); toast.success("UPI ID copied!"); }}>stocksaathi@upi</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Scan with any UPI app (GPay, PhonePe, Paytm). Upload the screenshot below for instant verification.</p>
                    </div>

                    <div className="relative h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center overflow-hidden">
                        {screenshot ? <img src={screenshot} alt="Payment" className="w-full h-full object-cover" /> : <><Upload size={32} className="text-slate-300" /><p className="mt-2 text-xs font-black text-slate-400 uppercase tracking-widest">Select Screenshot</p></>}
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleScreenshotUpload} disabled={uploading} />
                        {uploading && <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}
                    </div>

                    <button onClick={handleSubmitRequest} disabled={submitting || !screenshot} className="w-full h-18 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-3">
                        {submitting ? 'Submitting Request...' : 'Submit Payment Proof'} <Check size={20} />
                    </button>
                </div>
            </Modal>

            {/* Cancellation Modal */}
            <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Cancel Subscription" className="max-w-md">
                <div className="space-y-6 py-4">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Are you sure?</h3>
                        <p className="text-slate-500 text-sm font-medium">Your request will be sent to admin. Refunds are processed as per platform policy.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Reason for leaving</label>
                        <textarea 
                            placeholder="Please tell us why you want to cancel..."
                            className="input-field h-32 pt-4 resize-none"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setIsCancelModalOpen(false)} className="flex-1 h-16 bg-slate-50 rounded-2xl font-black uppercase text-xs tracking-widest">Keep Plan</button>
                        <button 
                            onClick={handleCancelPlan} 
                            disabled={submitting || !cancelReason}
                            className="flex-[2] h-16 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-500/20"
                        >
                            {submitting ? 'Submitting...' : 'Confirm Cancel'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Pricing;
