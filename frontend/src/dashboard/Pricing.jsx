import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertCircle,
    ArrowRight,
    Calendar,
    Check,
    Clock,
    Crown,
    ExternalLink,
    LogIn,
    Package,
    RefreshCw,
    ShieldCheck,
    Upload,
    Users,
    Zap,
    Star,
    Shield,
    HeartHandshake,
    MessageCircle,
    MessageCircle,
    CheckCircle2,
    Tag,
    QrCode
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

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
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        fetchPlans();
        fetchSettings();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await api.get('/subscriptions/plans');
            setPlans(res.data.data || []);
        } catch {
            toast.error('Unable to load pricing plans');
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            setSettings(res.data.data);
        } catch (error) {
            console.error('Failed to load settings', error);
        }
    };

    const handleActivateTrial = async () => {
        setSubmitting(true);
        try {
            const res = await api.post('/subscriptions/activate-trial');
            if (res.data.success) {
                toast.success('Trial activated successfully');
                updateUser(res.data.data);
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to activate trial');
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
            toast.success('Payment screenshot uploaded');
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmitRequest = async () => {
        if (!selectedPlan) return;
        if (!screenshot) {
            toast.error('Please upload payment screenshot');
            return;
        }

        setSubmitting(true);
        try {
            let res;
            if (selectedPlan.isAddon) {
                res = await api.post('/subscriptions/request-addon', {
                    addon: selectedPlan.name,
                    screenshot,
                });
            } else {
                res = await api.post('/subscriptions/request', {
                    plan: selectedPlan.name,
                    screenshot,
                });
            }

            if (res.data.success) {
                toast.success(selectedPlan.isAddon ? 'Add-on request submitted' : 'Subscription request submitted');
                setIsUpgradeModalOpen(false);
                setScreenshot(null);
                const profileRes = await api.get('/auth/profile');
                updateUser(profileRes.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelPlan = async () => {
        if (!cancelReason.trim()) {
            toast.error('Please provide a cancellation reason');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/subscriptions/cancel', { reason: cancelReason });
            if (res.data.success) {
                toast.success('Cancellation request submitted');
                setIsCancelModalOpen(false);
                setCancelReason('');
                const profileRes = await api.get('/auth/profile');
                updateUser(profileRes.data.data);
            }
        } catch {
            toast.error('Unable to submit cancellation request');
        } finally {
            setSubmitting(false);
        }
    };

    const prorationData = useMemo(() => {
        if (!user || !selectedPlan || user.subscriptionPlan === 'Free') return null;

        const currentPlan = plans.find((p) => p.name === user.subscriptionPlan);
        if (!currentPlan || !user.planExpiresAt) return null;

        const now = new Date();
        const activatedAt = new Date(user.planActivatedAt || user.createdAt);
        const expiresAt = new Date(user.planExpiresAt);

        const totalDuration = expiresAt - activatedAt;
        const elapsed = now - activatedAt;
        if (totalDuration <= 0) return null;

        const usedRatio = Math.min(1, Math.max(0, elapsed / totalDuration));
        const credit = Math.floor(currentPlan.price * (1 - usedRatio));
        const finalPrice = Math.max(0, selectedPlan.price - credit);

        return {
            credit,
            finalPrice,
            daysUsed: Math.floor(elapsed / (1000 * 60 * 60 * 24)),
            totalDays: Math.floor(totalDuration / (1000 * 60 * 60 * 24)),
        };
    }, [user, selectedPlan, plans]);

    const getIcon = (name) => {
        if (name === 'Free') return <Zap className="text-slate-500" size={24} />;
        if (name === 'Professional') return <ShieldCheck className="text-indigo-600" size={24} />;
        return <Crown className="text-amber-500" size={24} />;
    };

    const isNearExpiry = () => {
        if (!user?.planExpiresAt) return false;
        const expiry = new Date(user.planExpiresAt);
        const now = new Date();
        const days = (expiry - now) / (1000 * 60 * 60 * 24);
        return days <= 15 && days > 0;
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="space-y-10 pt-10 pb-16 font-jakarta">
            {!user && (
                <div className="mx-auto max-w-3xl py-6 text-center">
                    <p className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700">
                        Pricing Plans
                    </p>
                    <h1 className="mt-4 font-outfit text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                        Choose the plan that fits your retail growth
                    </h1>
                    <p className="mt-3 text-slate-600 dark:text-slate-300">
                        Start free, then upgrade when you need more inventory capacity and team features.
                    </p>
                </div>
            )}

            {user && (
                <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 md:p-10">
                    {/* Decorative Blurs */}
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl"></div>
                    <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl"></div>
                    
                    <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 md:h-20 md:w-20 shrink-0">
                                {getIcon(user.subscriptionPlan)}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Current active plan</p>
                                <h2 className="mt-1 font-outfit text-4xl font-black tracking-tight text-slate-900 dark:text-white md:text-5xl flex items-center gap-4">
                                    {user.subscriptionPlan}
                                    {user.subscriptionPlan !== 'Free' && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
                                            <CheckCircle2 size={10} />
                                            {user.isTrialUsed && user.planExpiresAt ? 'Active Paid' : 'Active Trial'}
                                        </span>
                                    )}
                                </h2>
                                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-2">
                                        <Calendar size={14} className="text-indigo-500" />
                                        Purchase: {formatDate(user.planActivatedAt || user.createdAt)}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Clock size={14} className="text-emerald-500" />
                                        Expiry: {user.planExpiresAt ? formatDate(user.planExpiresAt) : 'Lifetime Access'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex shrink-0 flex-col gap-3 md:items-end">
                            {user.subscriptionPlan !== 'Free' && user.cancellationRequest?.status === 'None' && (
                                <button
                                    onClick={() => setIsCancelModalOpen(true)}
                                    className="inline-flex h-12 items-center justify-center rounded-xl border border-rose-200 bg-white px-6 text-xs font-black uppercase tracking-widest text-rose-600 shadow-sm transition-all hover:bg-rose-50 dark:border-rose-500/20 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                >
                                    Request cancellation
                                </button>
                            )}
                            {isNearExpiry() && (
                                <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                    <AlertCircle size={14} /> Plan expires soon
                                </div>
                            )}
                        </div>
                    </div>

                    <AnimatePresence>
                        {user.cancellationRequest?.status === 'Pending' && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
                                Cancellation request pending admin review.
                            </motion.div>
                        )}
                        {user.cancellationRequest?.status === 'Approved' && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
                                Cancellation approved. Your refund initiated within 5-7 days.
                                {user.cancellationRequest.refundUtr ? ` UTR Reference: ${user.cancellationRequest.refundUtr}` : ''}
                            </motion.div>
                        )}
                        {user.cancellationRequest?.status === 'Rejected' && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
                                Cancellation rejected: {user.cancellationRequest.rejectReason}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {user && !user.isTrialUsed && user.subscriptionPlan === 'Free' && (
                <div className="rounded-3xl bg-indigo-600 p-6 text-white shadow-[0_20px_50px_rgba(79,70,229,0.35)] sm:p-8">
                    <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                            <h3 className="font-outfit text-2xl font-bold">Start your 7-day trial</h3>
                            <p className="mt-1 text-sm text-indigo-100">Try professional features before committing to a paid plan.</p>
                        </div>
                        <button
                            onClick={handleActivateTrial}
                            disabled={submitting}
                            className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-slate-100 disabled:opacity-70"
                        >
                            {submitting ? 'Activating...' : 'Activate trial'}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {loading
                    ? [1, 2, 3].map((i) => (
                          <div key={i} className="h-[480px] animate-pulse rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" />
                      ))
                    : plans.map((plan) => {
                          const isCurrentPlan = user?.subscriptionPlan === plan.name;
                          const hasPending = user?.pendingSubscription?.status === 'Pending';
                          const hasPendingForPlan = hasPending && user?.pendingSubscription?.plan === plan.name;

                          return (
                              <motion.article
                                  key={plan.name}
                                  initial={{ opacity: 0, y: 14 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`relative flex flex-col rounded-3xl border p-6 shadow-sm transition-all sm:p-7 ${isCurrentPlan ? 'border-indigo-500 bg-indigo-50/40 dark:border-indigo-400 dark:bg-indigo-500/10' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}
                              >
                                  {plan.isRecommended && (
                                      <span className="absolute -top-4 left-6 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-500/30 ring-4 ring-white dark:ring-slate-900">
                                          <Star size={12} fill="currentColor" />
                                          Recommended
                                      </span>
                                  )}

                                  <div className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                      {getIcon(plan.name)}
                                  </div>

                                  <h3 className="font-outfit text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{plan.name}</h3>
                                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{plan.description}</p>

                                  <div className="mt-4 flex items-end gap-2">
                                      <p className="font-outfit text-4xl font-extrabold text-slate-900 dark:text-white">₹{plan.price.toLocaleString()}</p>
                                      <p className="pb-1 text-sm text-slate-500">/ {plan.duration}</p>
                                  </div>

                                  <div className="mt-5 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/50">
                                      <p className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                          <Package size={15} className="text-indigo-600" /> Products: {plan.maxProducts === 0 ? 'Unlimited' : plan.maxProducts}
                                      </p>
                                      <p className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                          <Users size={15} className="text-indigo-600" /> Staff: {plan.maxStaff === 0 ? 'Unlimited' : plan.maxStaff}
                                      </p>
                                      <p className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                          <Tag size={15} className="text-indigo-600" /> Barcodes: {plan.maxBarcodes === 0 ? 'Unlimited' : plan.maxBarcodes}
                                      </p>
                                  </div>

                                  <div className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                      {plan.features.map((feature, idx) => (
                                          <p key={idx} className="inline-flex items-center gap-2">
                                              <Check size={15} className="text-emerald-500" />
                                              {feature}
                                          </p>
                                      ))}
                                  </div>

                                  <div className="mt-6">
                                      {!user ? (
                                          <button
                                              onClick={() => navigate('/login')}
                                              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                                          >
                                              <LogIn size={16} />
                                              Login to subscribe
                                          </button>
                                      ) : (
                                          <>
                                              <button
                                                  disabled={
                                                      (isCurrentPlan && !isNearExpiry()) ||
                                                      (plan.name === 'Free' && user.subscriptionPlan !== 'Free') ||
                                                      hasPending
                                                  }
                                                  onClick={() => {
                                                      setSelectedPlan(plan);
                                                      setIsUpgradeModalOpen(true);
                                                  }}
                                                  className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors ${isCurrentPlan ? (isNearExpiry() ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'cursor-default bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300') : 'bg-indigo-600 text-white hover:bg-indigo-700'} disabled:opacity-50`}
                                              >
                                                  {hasPendingForPlan ? (
                                                      <>
                                                          <Clock size={16} /> Request pending
                                                      </>
                                                  ) : isCurrentPlan ? (
                                                      isNearExpiry() ? (
                                                          <>
                                                              <RefreshCw size={16} /> Renew plan
                                                          </>
                                                      ) : (
                                                          'Current plan'
                                                      )
                                                  ) : plan.name === 'Free' ? (
                                                      'Free plan'
                                                  ) : (
                                                      <>
                                                          <Zap size={16} />
                                                          Upgrade
                                                      </>
                                                  )}
                                              </button>
                                              {isNearExpiry() && isCurrentPlan && (
                                                  <p className="mt-2 text-center text-xs font-medium text-amber-600 dark:text-amber-400">Renew now to avoid access interruption.</p>
                                              )}
                                          </>
                                      )}
                                  </div>
                              </motion.article>
                          );
                      })}
            </div>

            <Modal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} title="Complete Subscription" className="max-w-4xl">
                <div className="py-6 space-y-10">
                    {prorationData && user?.subscriptionPlan !== selectedPlan?.name && (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="rounded-3xl border-2 border-emerald-100 bg-emerald-50/50 p-6 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                            <div className="flex items-center gap-4 text-emerald-700 dark:text-emerald-300">
                                <ShieldCheck size={24} />
                                <div>
                                    <p className="text-lg font-black uppercase tracking-tight">Prorated Credit: ₹{prorationData.credit.toLocaleString()}</p>
                                    <p className="text-xs font-bold opacity-80">We've adjusted the price based on your current active plan usage.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Left Side: Payment Details */}
                        <div className="space-y-8">
                            <div className="rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Final Payable Amount</p>
                                <h3 className="mt-2 font-outfit text-6xl font-black tracking-tighter">₹{(prorationData?.finalPrice || selectedPlan?.price || 0).toLocaleString()}</h3>
                                
                                <div className="mt-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60">UPI Merchant ID</p>
                                        <p className="font-bold text-sm">{settings?.upiId || 'stocksaathi@upi'}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(settings?.upiId || 'stocksaathi@upi');
                                            toast.success('Merchant ID Copied');
                                        }}
                                        className="p-2.5 bg-white text-indigo-600 rounded-xl hover:scale-110 transition-all shadow-lg"
                                    >
                                        <ExternalLink size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] ml-4">Payment Proof</label>
                                <div className="relative group rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden min-h-[220px] transition-all hover:border-indigo-500">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="absolute inset-0 cursor-pointer opacity-0 z-10" 
                                        onChange={handleScreenshotUpload} 
                                        disabled={uploading} 
                                    />
                                    {screenshot ? (
                                        <img src={screenshot} alt="Payment proof" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                                                <Upload size={28} />
                                            </div>
                                            <p className="text-xs font-bold uppercase tracking-widest">Tap to upload screenshot</p>
                                            <p className="text-[9px] mt-1 opacity-60">PNG, JPG, JPEG accepted</p>
                                        </div>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-sm dark:bg-slate-900/70 z-20">
                                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Side: QR Code & Steps */}
                        <div className="space-y-8">
                            <div className="bg-slate-950 rounded-[3rem] p-8 flex flex-col items-center text-white relative overflow-hidden group shadow-2xl">
                                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent"></div>
                                <div className="relative z-10 w-full flex flex-col items-center">
                                    <div className="w-full aspect-square max-w-[200px] bg-white rounded-[2rem] p-4 flex items-center justify-center mb-6 shadow-2xl">
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${settings?.upiId || 'stocksaathi@upi'}&pn=StockSaathi&am=${prorationData?.finalPrice || selectedPlan?.price || 0}&cu=INR`)}`} 
                                            alt="Payment QR" 
                                            className="w-full h-full object-contain" 
                                        />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h4 className="text-lg font-black uppercase tracking-tight leading-none">Scan & Pay Now</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Automated Payment Routing</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-white/5 space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">1</div>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">Scan QR code using any UPI app (GPay, PhonePe, Paytm, etc.)</p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">2</div>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">Upload the successful payment screenshot in the proof section.</p>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmitRequest}
                                disabled={submitting || !screenshot}
                                className="w-full h-18 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                            >
                                {submitting ? 'Authenticating...' : <><Zap size={20} /> Initialize License</>}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Value Propositions / Trust Signals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
                {[
                    { icon: Shield, title: "Enterprise Security", desc: "Your data is encrypted with 256-bit SSL and backed up daily." },
                    { icon: HeartHandshake, title: "Priority Support", desc: "Professional & Enterprise users get 24/7 dedicated assistance." },
                    { icon: Zap, title: "Zero Downtime", desc: "Our infrastructure ensures 99.9% uptime for your business operations." }
                ].map((item, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <item.icon size={24} />
                        </div>
                        <h4 className="font-black uppercase tracking-tight text-slate-900 dark:text-white">{item.title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>

            {/* Barcode Booster Section */}
            <div className="mt-20 relative overflow-hidden rounded-[3rem] border border-indigo-200 bg-indigo-50/30 p-10 dark:border-indigo-500/20 dark:bg-indigo-500/5">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <QrCode size={200} className="text-indigo-600" />
                </div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest mb-6 shadow-lg shadow-indigo-500/20">
                            <Tag size={12} /> Add-on Module
                        </span>
                        <h2 className="font-outfit text-4xl font-black tracking-tight text-slate-900 dark:text-white md:text-5xl">
                            Barcode <span className="text-indigo-600">Booster</span>
                        </h2>
                        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 font-medium max-w-lg leading-relaxed">
                            Need more identifiers without upgrading your entire plan? Get unlimited barcode generation for your shop with our standalone booster.
                        </p>
                        
                        <div className="mt-8 flex items-center gap-4">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-slate-900 dark:text-white">₹499</span>
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">One-time payment</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center"><Check size={14} /></div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Unlimited EAN-13 Barcode Generation</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center"><Check size={14} /></div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Permanent License Activation</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center"><Check size={14} /></div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Priority Global Registry Access</p>
                            </div>
                        </div>

                        <button 
                            disabled={user?.hasBarcodeAddon || user?.pendingSubscription?.plan === 'Barcode Booster'}
                            onClick={() => {
                                setSelectedPlan({ name: 'Barcode Booster', price: 499, isAddon: true });
                                setIsUpgradeModalOpen(true);
                            }}
                            className={`w-full h-18 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl ${
                                user?.hasBarcodeAddon 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 cursor-default' 
                                : user?.pendingSubscription?.plan === 'Barcode Booster'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-indigo-500/20'
                            }`}
                        >
                            {user?.hasBarcodeAddon ? <><ShieldCheck size={20} /> Already Activated</> : user?.pendingSubscription?.plan === 'Barcode Booster' ? <><Clock size={20} /> Request Pending</> : <><Zap size={20} /> Activate Booster</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <section className="mt-32 max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Frequently Asked Questions</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Everything you need to know about our plans and billing.</p>
                </div>
                
                <div className="grid gap-4">
                    {[
                        { q: "How does the 7-day trial work?", a: "You get full access to all Professional features for 7 days. No credit card is required. At the end of the trial, you can choose a paid plan or continue with the Free plan." },
                        { q: "Can I change plans later?", a: "Yes, you can upgrade or downgrade your plan at any time. If you upgrade, the price will be prorated based on your remaining current plan duration." },
                        { q: "What happens to my data if I cancel?", a: "Your data remains safe. If you cancel a paid plan, your account will revert to the Free plan limits. You can still access your inventory and sales history." },
                        { q: "Do you offer refunds?", a: "Yes, we offer a prorated refund if you cancel your subscription. The refund is initiated within 5-7 business days after admin approval." }
                    ].map((faq, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors">
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{faq.q}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </section>

            <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Cancel Subscription" className="max-w-md">
                <div className="space-y-4 py-2">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                        <AlertCircle size={18} />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Tell us why you want to cancel. This request will be reviewed by admin.</p>
                    <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="Reason for cancellation"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setIsCancelModalOpen(false)}
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            Keep plan
                        </button>
                        <button
                            onClick={handleCancelPlan}
                            disabled={submitting || !cancelReason.trim()}
                            className="inline-flex h-10 items-center justify-center rounded-lg bg-rose-600 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
                        >
                            Submit request
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Pricing;
