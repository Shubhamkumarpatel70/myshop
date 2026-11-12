import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, CheckCircle2, Clock3, CreditCard, LockKeyhole,
    RefreshCw, ShieldCheck, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { openCashfreeCheckout, prepareCashfreeCheckout } from '../utils/cashfree';

const formatAmount = (amount) => Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const CashfreeCheckout = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const orderId = searchParams.get('order_id') || '';
    const returnedFromGateway = searchParams.get('returned') === '1';
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [opening, setOpening] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('');
    const [cashfreeInstance, setCashfreeInstance] = useState(null);
    const [sdkError, setSdkError] = useState('');
    const autoVerifyStarted = useRef(false);

    useEffect(() => {
        let active = true;
        const loadOrder = async () => {
            if (!orderId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const response = await api.get('/payments/cashfree/checkout', {
                    params: { order_id: orderId }
                });
                if (!active) return;
                const data = response.data?.data;
                if (!data?.order_id) throw new Error('Payment order details were not returned.');
                setOrder(data);
                setPaymentStatus(data.status || 'ACTIVE');
            } catch (error) {
                if (active) toast.error(error.response?.data?.message || error.message || 'Unable to load this payment order.');
            } finally {
                if (active) setLoading(false);
            }
        };
        loadOrder();
        return () => { active = false; };
    }, [orderId]);

    useEffect(() => {
        if (!order?.environment || isPaidStatus(order.status)) return undefined;
        let active = true;
        setCashfreeInstance(null);
        setSdkError('');
        prepareCashfreeCheckout({ environment: order.environment })
            .then(instance => { if (active) setCashfreeInstance(instance); })
            .catch(error => { if (active) setSdkError(error.message || 'Unable to prepare secure checkout.'); });
        return () => { active = false; };
    }, [order?.environment, order?.status]);

    const verifyPayment = useCallback(async (showToast = true) => {
        if (!orderId) return;
        setVerifying(true);
        try {
            const isRegistration = orderId.startsWith('SSREG_');
            const endpoint = isRegistration
                ? '/payments/registration/verify'
                : '/payments/cashfree/subscription/verify';
            const response = await api.get(endpoint, { params: { order_id: orderId } });
            const result = response.data?.data || {};
            setPaymentStatus(result.status || (result.paid ? 'SUCCESS' : 'PENDING'));

            if (result.paid) {
                try {
                    const profile = await api.get('/auth/profile');
                    updateUser(profile.data.data);
                } catch (profileError) {
                    console.warn('Payment verified; profile refresh will retry on next login.', profileError);
                }
                if (showToast) toast.success('Payment confirmed successfully.');
            } else if (showToast) {
                toast('Payment is not confirmed yet. If money was deducted, wait a moment and check again.', { icon: '⏳' });
            }
        } catch (error) {
            if (showToast) toast.error(error.response?.data?.message || 'Unable to verify payment right now.');
        } finally {
            setVerifying(false);
        }
    }, [orderId, updateUser]);

    useEffect(() => {
        if (!order || !returnedFromGateway || autoVerifyStarted.current) return;
        autoVerifyStarted.current = true;
        verifyPayment(false);
    }, [order, returnedFromGateway, verifyPayment]);

    const handlePay = () => {
        if (!order?.payment_session_id) {
            toast.error('This order has no active Cashfree payment session. Create a new payment order.');
            return;
        }
        if (paymentStatus === 'SUCCESS' || paymentStatus === 'PAID') return;
        if (!cashfreeInstance) {
            toast.error(sdkError || 'Secure payment is still loading. Please wait and try again.');
            return;
        }

        setOpening(true);
        try {
            // Call checkout immediately in the click event. Do not await SDK loading
            // here: mobile browsers can block redirects after an async delay.
            const checkoutResult = openCashfreeCheckout({
                cashfree: cashfreeInstance,
                paymentSessionId: order.payment_session_id
            });
            Promise.resolve(checkoutResult)
                .catch(error => toast.error(error.message || 'Cashfree checkout could not be opened.'))
                .finally(() => setOpening(false));
        } catch (error) {
            setOpening(false);
            toast.error(error.message || 'Cashfree checkout could not be opened. Please try again.');
        }
    };

    const retryCashfreeSdk = async () => {
        setSdkError('');
        setCashfreeInstance(null);
        try {
            const instance = await prepareCashfreeCheckout({ environment: order?.environment });
            setCashfreeInstance(instance);
        } catch (error) {
            setSdkError(error.message || 'Unable to prepare secure checkout.');
            toast.error(error.message || 'Unable to load Cashfree. Check your internet and retry.');
        }
    };

    const isPaid = ['SUCCESS', 'PAID'].includes(String(paymentStatus).toUpperCase());
    const isFailed = ['FAILED', 'USER_DROPPED', 'EXPIRED'].includes(String(paymentStatus).toUpperCase());

    if (loading) {
        return (
            <main className="grid min-h-[75vh] place-items-center bg-slate-50 px-4 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <span className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    <p className="text-sm font-semibold">Loading your secure checkout…</p>
                </div>
            </main>
        );
    }

    if (!orderId || !order) {
        return (
            <main className="grid min-h-[75vh] place-items-center bg-slate-50 px-4 dark:bg-slate-950">
                <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    <XCircle className="mx-auto mb-4 text-rose-500" size={48} />
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Checkout unavailable</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">We could not find this payment order for your account. Return to your dashboard and start a new payment.</p>
                    <Link to="/dashboard" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white">Go to dashboard</Link>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-[85vh] bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 px-4 py-8 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/20 sm:py-14">
            <div className="mx-auto w-full max-w-3xl">
                <button type="button" onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                    <ArrowLeft size={17} /> Back
                </button>

                <header className="mb-8 text-center">
                    <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                        <CreditCard size={30} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-600">StockSaathi · Secure payments</p>
                    <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">Complete your payment</h1>
                    <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">Review your order details, then continue to Cashfree’s secure payment page.</p>
                </header>

                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.09)] dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-indigo-700 to-violet-600 px-5 py-5 text-white sm:px-8">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-indigo-100">Payment order</p>
                            <p className="mt-1 break-all text-sm font-extrabold sm:text-base">{order.order_id}</p>
                        </div>
                        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">Cashfree</span>
                    </div>

                    <div className="space-y-5 p-5 sm:p-8">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50 sm:p-5">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">You are paying for</p>
                            <p className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">{order.purpose}</p>
                            {order.plan && <p className="mt-1 text-sm text-slate-500">Plan: {order.plan}</p>}
                        </div>

                        <div className="flex items-end justify-between gap-4 border-b border-dashed border-slate-200 pb-5 dark:border-slate-700">
                            <div>
                                <p className="text-sm font-semibold text-slate-500">Total amount</p>
                                <p className="mt-1 text-xs text-slate-400">Including all applicable charges</p>
                            </div>
                            <p className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">₹{formatAmount(order.amount)}</p>
                        </div>

                        {isPaid ? (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
                                <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 size={25} />
                                    <p className="font-extrabold">Payment successful</p>
                                </div>
                                <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">Cashfree payment has been verified by our server. Your account details have been refreshed.</p>
                                <Link to="/dashboard" className="mt-4 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white">Continue to dashboard</Link>
                            </div>
                        ) : (
                            <>
                                {isFailed && (
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                                        The previous payment attempt did not complete. You can retry this order if Cashfree still accepts the session.
                                    </div>
                                )}
                                <button type="button" onClick={handlePay} disabled={opening || !order.payment_session_id || verifying || !cashfreeInstance} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
                                    {opening ? <><RefreshCw size={18} className="animate-spin" /> Opening Cashfree…</> : !cashfreeInstance ? <><RefreshCw size={18} className="animate-spin" /> Preparing secure payment…</> : <><LockKeyhole size={18} /> Continue to secure payment</>}
                                </button>
                                {!order.payment_session_id && <p className="text-center text-xs font-semibold text-rose-600">Payment session is unavailable. Please start a fresh payment from your dashboard.</p>}
                                {sdkError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"><p>{sdkError}</p><button type="button" onClick={retryCashfreeSdk} className="mt-2 font-bold underline">Retry loading Cashfree</button></div>}
                            </>
                        )}

                        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 sm:grid-cols-2">
                            <div className="flex items-start gap-2">
                                <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                                <div><p className="text-xs font-bold text-slate-800 dark:text-slate-200">Secure checkout</p><p className="mt-1 text-xs leading-5 text-slate-500">Your payment details are handled by Cashfree.</p></div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Clock3 className="mt-0.5 shrink-0 text-indigo-600" size={18} />
                                <div><p className="text-xs font-bold text-slate-800 dark:text-slate-200">Payment status</p><p className="mt-1 text-xs leading-5 text-slate-500">{paymentStatus || 'Waiting for payment'} · verified server-side</p></div>
                            </div>
                        </div>

                        {!isPaid && (
                            <button type="button" onClick={() => verifyPayment(true)} disabled={verifying} className="mx-auto flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10">
                                <RefreshCw size={16} className={verifying ? 'animate-spin' : ''} /> {verifying ? 'Checking payment…' : 'I have paid · Check payment status'}
                            </button>
                        )}
                    </div>
                </section>

                <p className="mt-6 text-center text-xs leading-5 text-slate-400">Do not refresh or close the page while Cashfree is processing your payment. A successful payment is confirmed only after server-side verification.</p>
            </div>
        </main>
    );
};

export default CashfreeCheckout;
