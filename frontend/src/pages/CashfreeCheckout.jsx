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
    const [statusPopup, setStatusPopup] = useState(null);
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
        if (!order || ['SUCCESS', 'PAID'].includes(String(order.status || '').toUpperCase())) return undefined;
        let active = true;
        setCashfreeInstance(null);
        setSdkError('');

        const initializeCheckout = async () => {
            try {
                // The checkout API supplies the environment for this order.
                // Keep a safe sandbox default for legacy records; the admin-only
                // status endpoint is not accessible to shop-owner accounts.
                const environment = order.environment || 'sandbox';
                const instance = await prepareCashfreeCheckout({ environment });
                if (active) setCashfreeInstance(instance);
            } catch (error) {
                if (active) setSdkError(error.message || 'Unable to load Cashfree secure checkout.');
            }
        };

        initializeCheckout();
        return () => { active = false; };
    }, [order?.order_id, order?.environment, order?.status]);

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
            const nextStatus = String(result.status || (result.paid ? 'SUCCESS' : 'PENDING')).toUpperCase();
            setPaymentStatus(nextStatus);
            if (result.paid) {
                setStatusPopup({ type: 'success', title: 'Payment successful', message: 'Your payment has been verified securely. Your account is now updated.' });
            } else if (['FAILED', 'USER_DROPPED', 'EXPIRED'].includes(nextStatus)) {
                setStatusPopup({ type: 'failed', title: 'Payment failed', message: 'This payment was not completed. You can retry if the payment session is still active.' });
            } else {
                setStatusPopup({ type: 'pending', title: 'Payment pending', message: 'We have not received final confirmation yet. If money was deducted, please wait and check the status again.' });
            }

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
            const environment = order?.environment || 'sandbox';
            const instance = await prepareCashfreeCheckout({ environment });
            setCashfreeInstance(instance);
            toast.success('Secure checkout is ready. You can continue with payment.');
        } catch (error) {
            setSdkError(error.message || 'Unable to load Cashfree secure checkout.');
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
        <main className="min-h-[85vh] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/70 via-slate-50 to-white px-4 py-8 dark:from-indigo-950/50 dark:via-slate-950 dark:to-slate-950 sm:py-14">
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

                <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 shadow-[0_28px_90px_rgba(30,41,59,0.13)] ring-1 ring-slate-200/70 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 dark:ring-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-5 py-6 text-white sm:px-8">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-indigo-100">Payment order</p>
                            <p className="mt-1 break-all text-sm font-extrabold sm:text-base">{order.order_id}</p>
                        </div>
                        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">Cashfree</span>
                    </div>

                    <div className="space-y-5 p-5 sm:p-8">
                        <div className="rounded-[1.4rem] border border-slate-100 bg-gradient-to-br from-slate-50 to-indigo-50/60 p-5 dark:border-slate-800 dark:from-slate-800/80 dark:to-indigo-950/30 sm:p-6">
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
                                <button type="button" onClick={handlePay} disabled={opening || !order.payment_session_id || verifying || !cashfreeInstance} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-[1.25rem] bg-indigo-600 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
                                    {opening ? <><RefreshCw size={18} className="animate-spin" /> Opening Cashfree…</> : !cashfreeInstance ? <><RefreshCw size={18} className="animate-spin" /> Preparing secure payment…</> : <><LockKeyhole size={18} /> Continue to secure payment</>}
                                </button>
                                {!order.payment_session_id && <p className="text-center text-xs font-semibold text-rose-600">Payment session is unavailable. Please start a fresh payment from your dashboard.</p>}
                                {sdkError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"><p className="font-bold">Secure payment could not load</p><p className="mt-1">{sdkError}</p><button type="button" onClick={retryCashfreeSdk} className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-rose-600 px-4 py-2 font-bold text-white">Retry loading Cashfree</button></div>}
                                {!cashfreeInstance && !sdkError && <p role="status" className="text-center text-xs text-slate-500">Connecting to Cashfree… This usually takes a few seconds. If it does not load, an error and retry option will appear.</p>}
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

            <style>{`
                @keyframes paymentStatusEnter {
                    from { opacity: 0; transform: translateY(18px) scale(.94); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes paymentStatusIcon {
                    0% { transform: scale(.5) rotate(-12deg); opacity: .3; }
                    70% { transform: scale(1.12) rotate(4deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0); }
                }
                .payment-status-pop { animation: paymentStatusEnter .28s cubic-bezier(.2,.8,.2,1) both; }
                .payment-status-icon { animation: paymentStatusIcon .45s cubic-bezier(.2,.8,.2,1) .08s both; }
                @media (prefers-reduced-motion: reduce) {
                    .payment-status-pop, .payment-status-icon { animation: none; }
                }
            `}</style>
            {statusPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm" role="presentation">
                    <section role="dialog" aria-modal="true" aria-labelledby="payment-status-title" className="payment-status-pop w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-white p-7 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-8">
                        <div className={`mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full ${statusPopup.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : statusPopup.type === 'failed' ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'}`}>
                            {statusPopup.type === 'success' ? <CheckCircle2 size={42} className="payment-status-icon" /> : statusPopup.type === 'failed' ? <XCircle size={42} className="payment-status-icon" /> : <Clock3 size={42} className="payment-status-icon" />}
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">StockSaathi · Payment update</p>
                        <h2 id="payment-status-title" className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{statusPopup.title}</h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{statusPopup.message}</p>
                        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                            {statusPopup.type === 'success' ? (
                                <Link to="/dashboard" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-700">Go to dashboard</Link>
                            ) : (
                                <button type="button" onClick={() => { const type = statusPopup.type; setStatusPopup(null); if (type === 'pending') verifyPayment(true); else handlePay(); }} className="min-h-12 flex-1 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-indigo-700">{statusPopup.type === 'failed' ? 'Try payment again' : 'Check again'}</button>
                            )}
                            <button type="button" onClick={() => setStatusPopup(null)} className="min-h-12 flex-1 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Close</button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
};

export default CashfreeCheckout;
