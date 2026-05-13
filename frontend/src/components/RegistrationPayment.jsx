import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
    CreditCard, ShieldCheck, QrCode, 
    Smartphone, ArrowRight, Info, CheckCircle2,
    Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const RegistrationPayment = ({ user, onPaymentSuccess }) => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [screenshot, setScreenshot] = useState(null);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            setSettings(res.data.data);
            if (res.data.data && !res.data.data.isPaymentRequired) {
                handleConfirm();
            }
        } catch (error) {
            toast.error("Failed to load payment details");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setScreenshot(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmitProof = async (e) => {
        e.preventDefault();
        if (!screenshot) {
            toast.error("Please upload a payment screenshot");
            return;
        }

        setConfirming(true);
        const formData = new FormData();
        formData.append('screenshot', screenshot);

        try {
            await api.post('/auth/submit-payment', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Payment proof submitted! We will verify it shortly.");
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            toast.error(error.response?.data?.message || "Submission failed");
        } finally {
            setConfirming(false);
        }
    };

    const handleConfirm = async () => {
        setConfirming(true);
        try {
            await api.post('/admin/confirm-payment');
            toast.success("Payment verified! Redirecting...");
            setTimeout(() => onPaymentSuccess(), 1500);
        } catch (error) {
            toast.error("Confirmation failed. Please contact support.");
        } finally {
            setConfirming(false);
        }
    };

    if (loading) return (
        <div className="h-[70vh] flex flex-col items-center justify-center space-y-4 animate-pulse">
            <div className="w-20 h-20 bg-slate-100 rounded-[2rem]"></div>
            <div className="h-8 w-64 bg-slate-100 rounded-xl"></div>
        </div>
    );

    if (settings && !settings.isPaymentRequired) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tight">Access Granted!</h2>
                <p className="text-slate-500">Redirecting to your dashboard...</p>
            </div>
        );
    }

    if (user?.paymentScreenshot) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6">
                <div className="w-24 h-24 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-amber-500/20 animate-pulse">
                    <ShieldCheck size={48} />
                </div>
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">Payment Under Audit</h2>
                <p className="text-slate-500 text-lg max-w-lg mx-auto font-medium leading-relaxed">
                    We have received your payment screenshot. Our team is verifying the transaction. 
                    Once confirmed, your dashboard will be unlocked automatically.
                </p>
                <div className="mt-10 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                        <CheckCircle2 size={20} />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Transaction Status: Pending Verification</p>
                </div>
            </div>
        );
    }

    const getStepStatus = (step) => {
        if (step === 'register') return 'complete';
        if (step === 'payment') {
            if (user?.isPaymentDone || user?.paymentScreenshot) return 'complete';
            return 'active';
        }
        if (step === 'audit') {
            if (user?.approvalStatus === 'Approved') return 'complete';
            if (user?.paymentScreenshot) return 'active';
            return 'pending';
        }
        return 'pending';
    };

    const StatusStepper = () => (
        <div className="flex items-center justify-center gap-4 mb-16">
            {[
                { id: 'register', label: 'Identity' },
                { id: 'payment', label: 'Payment' },
                { id: 'audit', label: 'Verification' }
            ].map((step, i, arr) => {
                const status = getStepStatus(step.id);
                return (
                    <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                status === 'complete' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                                status === 'active' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 animate-pulse' :
                                'bg-slate-200 dark:bg-slate-800 text-slate-400'
                            }`}>
                                {status === 'complete' ? <CheckCircle2 size={20} /> : <span className="text-xs font-black">{i + 1}</span>}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                status === 'complete' ? 'text-emerald-500' :
                                status === 'active' ? 'text-indigo-600' :
                                'text-slate-400'
                            }`}>{step.label}</span>
                        </div>
                        {i < arr.length - 1 && (
                            <div className={`w-12 h-0.5 rounded-full ${
                                status === 'complete' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                            }`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );

    if (loading) return (
        <div className="h-[70vh] flex flex-col items-center justify-center space-y-4 animate-pulse">
            <div className="w-20 h-20 bg-slate-100 rounded-[2rem]"></div>
            <div className="h-8 w-64 bg-slate-100 rounded-xl"></div>
        </div>
    );

    if (user?.paymentScreenshot && user?.approvalStatus === 'Pending') {
        return (
            <div className="max-w-4xl mx-auto py-10 px-4">
                <StatusStepper />
                <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-slate-800">
                    <div className="w-24 h-24 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-amber-500/20 animate-pulse">
                        <ShieldCheck size={48} />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">Under Verification</h2>
                    <p className="text-slate-500 text-lg max-w-lg mx-auto font-medium leading-relaxed">
                        Your payment proof has been submitted. Our compliance team is currently auditing your shop details.
                    </p>
                    <div className="mt-10 p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                            <Clock size={20} />
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">ETA: Typically within 2-4 business hours</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <StatusStepper />
            
            <div className="text-center mb-12">
                <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/20">
                    <CreditCard size={36} />
                </div>
                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
                    {user?.approvalStatus === 'Rejected' ? 'Re-Submit' : 'One Final Step'}
                </h2>
                <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
                    {user?.approvalStatus === 'Rejected' 
                        ? 'Your previous application was rejected. Please review the reason below and submit valid payment proof.'
                        : 'To unlock your shop\'s dashboard and start selling, please complete the one-time registration fee.'}
                </p>
            </div>

            {user?.approvalStatus === 'Rejected' && (
                <div className="mb-10 p-8 bg-rose-50 dark:bg-rose-500/5 rounded-[2.5rem] border-2 border-rose-100 dark:border-rose-500/20 text-center">
                    <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest mb-2">Rejection Reason</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white leading-relaxed italic">
                        "{user?.rejectionReason || 'Details provided were insufficient.'}"
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Payment Card */}
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden">
                    <form onSubmit={handleSubmitProof} className="relative z-10 space-y-8">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Total Payable Amount</p>
                            <h3 className="text-6xl font-black text-indigo-600 tracking-tighter">₹{settings?.regFee}</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                                <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                    <Smartphone size={24} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pay via UPI</p>
                                    <p className="font-black text-lg truncate">{settings?.upiId}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Upload Payment Screenshot</label>
                                <div className="relative group">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden" 
                                        id="screenshot-upload"
                                    />
                                    <label 
                                        htmlFor="screenshot-upload"
                                        className="w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-600 transition-all overflow-hidden relative bg-slate-50/50 dark:bg-slate-800/50"
                                    >
                                        {preview ? (
                                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <QrCode size={24} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-500 uppercase">Click to Upload</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={confirming || !screenshot}
                            className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {confirming ? 'Submitting...' : <><ShieldCheck size={20} /> Submit Payment Proof</>}
                        </button>
                    </form>
                </div>

                {/* QR Display */}
                <div className="bg-slate-950 rounded-[3.5rem] p-10 flex flex-col items-center justify-center text-white relative overflow-hidden group">
                    <div className="relative z-10 w-full flex flex-col items-center">
                        <div className="w-full aspect-square max-w-[280px] bg-white rounded-[2.5rem] p-6 flex items-center justify-center mb-8 shadow-2xl overflow-hidden">
                            {settings?.upiId ? (
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${settings.upiId}&pn=Admin&am=${settings.regFee}&cu=INR`)}`} 
                                    alt="Payment QR" 
                                    className="w-full h-full object-contain" 
                                />
                            ) : (
                                <div className="text-slate-200 flex flex-col items-center gap-3">
                                    <QrCode size={64} />
                                    <span className="text-xs font-black uppercase tracking-widest">Scan to Pay</span>
                                </div>
                            )}
                        </div>
                        <div className="text-center">
                            <h4 className="text-xl font-black uppercase tracking-tight mb-2">Scan & Pay</h4>
                            <p className="text-slate-400 text-sm font-medium">Use any UPI App (GPay, PhonePe, Paytm)</p>
                        </div>
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[100px]"></div>
                    </div>
                </div>
            </div>

            <div className="mt-10 text-center">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                    Need help? Contact support at <span className="text-indigo-600">{settings?.supportPhone}</span>
                </p>
            </div>
        </div>
    );
};

export default RegistrationPayment;
