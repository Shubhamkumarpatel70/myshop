import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { CreditCard, ShieldCheck, CheckCircle2, Clock3, LockKeyhole, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { openCashfreeCheckout, preloadCashfreeSdk } from '../utils/cashfree';

const RegistrationPayment = ({ user, onPaymentSuccess }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const onPaymentSuccessRef = useRef(onPaymentSuccess);
    onPaymentSuccessRef.current = onPaymentSuccess;
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [paymentState, setPaymentState] = useState('ready');
    const [manualScreenshot, setManualScreenshot] = useState(null);
    const [manualSubmitting, setManualSubmitting] = useState(false);

    useEffect(() => { preloadCashfreeSdk(); }, []);

    useEffect(() => {
        let active = true;
        const loadSettings = async () => {
            try {
                const response = await api.get('/admin/settings');
                if (!active) return;
                setSettings(response.data.data || {});
                if (!response.data.data?.isPaymentRequired) {
                    await api.post('/admin/confirm-payment');
                    onPaymentSuccessRef.current?.();
                }
            } catch (error) {
                if (active) toast.error(error.response?.data?.message || 'Unable to load registration payment settings.');
            } finally {
                if (active) setLoading(false);
            }
        };
        loadSettings();
        return () => { active = false; };
    }, []);

    useEffect(() => {
        const orderId = searchParams.get('order_id');
        if (!orderId) return;
        let active = true;
        const verify = async () => {
            setVerifying(true);
            setPaymentState('verifying');
            try {
                const response = await api.get('/payments/registration/verify', { params: { order_id: orderId } });
                if (!active) return;
                if (response.data?.data?.paid) {
                    setPaymentState('success');
                    toast.success('Registration payment verified successfully.');
                    const next = new URLSearchParams(searchParams);
                    next.delete('order_id');
                    next.delete('cf_id');
                    next.set('payment', 'success');
                    setSearchParams(next, { replace: true });
                    window.setTimeout(() => onPaymentSuccessRef.current?.() || window.location.reload(), 900);
                } else {
                    setPaymentState('pending');
                    toast('Payment is not confirmed yet. You can check again shortly.', { icon: '⏳' });
                }
            } catch (error) {
                if (active) {
                    setPaymentState('pending');
                    toast.error(error.response?.data?.message || 'Payment verification is pending. Please retry.');
                }
            } finally {
                if (active) setVerifying(false);
            }
        };
        verify();
        return () => { active = false; };
    }, [searchParams, setSearchParams]);

    const submitManualPayment = async () => {
        if (!manualScreenshot) return toast.error('Please select your payment screenshot first.');
        setManualSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('screenshot', manualScreenshot);
            await api.post('/auth/submit-payment', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Payment proof submitted. Admin will verify it manually.');
            setPaymentState('submitted');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to submit payment proof.');
        } finally { setManualSubmitting(false); }
    };

    const startPayment = async () => {
        setPaying(true);
        try {
            const response = await api.post('/payments/registration/order');
            const { payment_session_id: paymentSessionId, environment } = response.data.data || {};
            if (!paymentSessionId) throw new Error('Cashfree did not return a payment session.');
            await openCashfreeCheckout({ paymentSessionId, environment });
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Unable to start payment. Please try again.');
        } finally {
            setPaying(false);
        }
    };

    const checkPayment = async () => {
        const orderId = searchParams.get('order_id') || user?.registrationPaymentOrderId;
        if (!orderId) return toast.error('No pending registration order found. Start payment again.');
        setVerifying(true);
        try {
            const response = await api.get('/payments/registration/verify', { params: { order_id: orderId } });
            if (response.data?.data?.paid) {
                setPaymentState('success');
                toast.success('Payment verified. Your account will continue to approval.');
                window.setTimeout(() => onPaymentSuccess?.() || window.location.reload(), 800);
            } else {
                setPaymentState('pending');
                toast('Payment is still processing. Please try again shortly.', { icon: '⏳' });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to verify payment right now.');
        } finally {
            setVerifying(false);
        }
    };

    if (loading) return (
        <div className="grid min-h-[65vh] place-items-center">
            <div className="flex flex-col items-center gap-3 text-slate-500">
                <span className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                <span className="text-sm font-medium">Preparing secure registration checkout…</span>
            </div>
        </div>
    );

    if (!settings?.isPaymentRequired) return (
        <div className="grid min-h-[60vh] place-items-center text-center">
            <div><CheckCircle2 className="mx-auto mb-4 text-emerald-500" size={48}/><h2 className="text-2xl font-bold">Payment not required</h2><p className="mt-2 text-slate-500">Your account access is being updated.</p></div>
        </div>
    );

    if (user?.isPaymentDone || paymentState === 'success') return (
        <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-5 text-center">
            <div><CheckCircle2 className="mx-auto mb-5 text-emerald-500" size={56}/><h2 className="text-3xl font-black">Payment verified</h2><p className="mt-3 text-slate-500">Your registration payment is complete. Shop approval remains a separate step.</p></div>
        </div>
    );

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
            <div className="mx-auto mb-8 max-w-2xl text-center">
                <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"><CreditCard size={30}/></div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">StockSaathi · by ASKC Technologies</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">{user?.approvalStatus === 'Rejected' ? 'Complete registration payment' : 'One secure step to get started'}</h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">{(settings?.paymentVerificationMode || 'manual') === 'cashfree' ? 'Pay the one-time registration fee using Cashfree’s secure hosted checkout. Your dashboard unlocks only after the server verifies the payment.' : 'Pay using the admin UPI ID or QR code and submit your payment screenshot for manual review.'}</p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                        <div><p className="text-sm font-semibold text-slate-500">Registration fee</p><p className="mt-2 text-5xl font-black tracking-tight text-indigo-600">₹{Number(settings?.regFee || 0).toLocaleString('en-IN')}</p><p className="mt-2 text-xs text-slate-500">INR · One-time payment</p></div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">Secure checkout</span>
                    </div>
                    {user?.approvalStatus === 'Rejected' && user?.rejectionReason && <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"><strong>Review required:</strong> {user.rejectionReason}</div>}
                    {(settings?.paymentVerificationMode || 'manual') === 'cashfree' ? (<>
                    <button onClick={startPayment} disabled={paying || verifying || Number(settings?.regFee || 0) <= 0} className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
                        {paying ? <><RefreshCw size={18} className="animate-spin"/> Connecting to Cashfree…</> : <><CreditCard size={18}/> Pay ₹{Number(settings?.regFee || 0).toLocaleString('en-IN')} securely</>}
                    </button>
                    {(searchParams.get('order_id') || user?.registrationPaymentOrderId || paymentState === 'pending') && <button onClick={checkPayment} disabled={verifying} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">{verifying ? <RefreshCw size={16} className="animate-spin"/> : <Clock3 size={16}/>} Check payment status</button>}
                    <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300"><LockKeyhole size={16} className="mt-0.5 shrink-0 text-emerald-600"/><p>Card, UPI and supported payment methods are handled by Cashfree. We never store your card or UPI credentials.</p></div>
                    </>) : (<div className="mt-8 space-y-4">
                        {settings?.qrCode && <img src={settings.qrCode} alt="Registration payment QR" className="mx-auto h-48 w-48 rounded-xl border bg-white object-contain p-2" />}
                        {settings?.upiId && <p className="text-center text-sm font-semibold">UPI ID: <span className="select-all">{settings.upiId}</span></p>}
                        {paymentState === 'submitted' ? <p className="rounded-xl bg-amber-50 p-4 text-center text-sm font-semibold text-amber-700">Payment proof submitted. Waiting for admin verification.</p> : <>
                            <label className="block text-sm font-semibold">Upload payment screenshot</label>
                            <input type="file" accept="image/*" onChange={e => setManualScreenshot(e.target.files?.[0] || null)} className="block w-full text-sm" />
                            <button onClick={submitManualPayment} disabled={!manualScreenshot || manualSubmitting} className="w-full rounded-xl bg-indigo-600 px-5 py-4 text-sm font-bold text-white disabled:opacity-60">{manualSubmitting ? 'Submitting…' : 'Submit Payment Proof'}</button>
                        </>}
                    </div>)}

                </section>
                <aside className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
                    <ShieldCheck size={28} className="text-emerald-400"/>
                    <h2 className="mt-5 text-xl font-bold">How activation works</h2>
                    <ol className="mt-5 space-y-5 text-sm text-slate-300">
                        <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 font-bold text-white">1</span><span>{(settings?.paymentVerificationMode || 'manual') === 'cashfree' ? 'Complete payment on Cashfree’s hosted checkout.' : 'Pay using the displayed UPI ID or QR and upload the screenshot.'}</span></li>
                        <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 font-bold text-white">2</span><span>{(settings?.paymentVerificationMode || 'manual') === 'cashfree' ? 'StockSaathi verifies the payment directly with Cashfree.' : 'An admin reviews your payment screenshot and confirms it.'}</span></li>
                        <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 font-bold text-white">3</span><span>Your shop then proceeds through the admin approval process.</span></li>
                    </ol>
                    <div className="mt-8 border-t border-white/10 pt-5 text-xs text-slate-400"><p className="flex items-center gap-2"><ShieldCheck size={14}/> Encrypted, hosted payment page</p><p className="mt-2">Need help? {settings?.supportPhone || 'Contact support'}</p></div>
                </aside>
            </div>
            {paymentState === 'verifying' && <p className="mt-6 text-center text-sm text-slate-500">Confirming payment securely…</p>}
        </div>
    );
};

export default RegistrationPayment;
