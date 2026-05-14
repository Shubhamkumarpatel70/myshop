import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const planBadgeClass = (plan) => {
    if (plan === 'Enterprise' || plan === 'Elite') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
    if (plan === 'Professional') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
};

const AdminSubscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [utrNumber, setUtrNumber] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [editData, setEditData] = useState({ plan: '', expiresAt: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAllSubscriptions();
    }, []);

    const fetchAllSubscriptions = async () => {
        try {
            const res = await api.get('/subscriptions/admin/all');
            setSubscriptions(res.data.data || []);
        } catch {
            toast.error('Failed to load subscription audit data');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPayment = async (userId, status) => {
        setSubmitting(true);
        try {
            const res = await api.post('/subscriptions/admin/verify', { userId, status });
            if (res.data.success) {
                toast.success(`Payment ${status.toLowerCase()}`);
                setModalType(null);
                fetchAllSubscriptions();
            }
        } catch {
            toast.error('Failed to verify payment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleProcessCancellation = async (userId, status) => {
        setSubmitting(true);
        try {
            const res = await api.post('/subscriptions/admin/process-cancel', {
                userId,
                status,
                rejectReason: status === 'Rejected' ? rejectReason : '',
            });
            if (res.data.success) {
                toast.success(`Cancellation ${status.toLowerCase()}`);
                setModalType(null);
                setRejectReason('');
                fetchAllSubscriptions();
            }
        } catch {
            toast.error('Failed to process cancellation');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRefund = async () => {
        if (!utrNumber.trim()) return toast.error('Refund UTR is required');

        setSubmitting(true);
        try {
            const res = await api.post('/subscriptions/admin/refund', {
                userId: selectedUser._id,
                utr: utrNumber.trim(),
            });
            if (res.data.success) {
                toast.success('Refund marked successfully');
                setModalType(null);
                setUtrNumber('');
                fetchAllSubscriptions();
            }
        } catch {
            toast.error('Failed to process refund');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateSub = async () => {
        setSubmitting(true);
        try {
            const res = await api.put('/subscriptions/admin/update', {
                userId: selectedUser._id,
                ...editData,
            });
            if (res.data.success) {
                toast.success('Subscription updated');
                setModalType(null);
                fetchAllSubscriptions();
            }
        } catch {
            toast.error('Failed to update subscription');
        } finally {
            setSubmitting(false);
        }
    };

    const handleTerminate = async () => {
        setSubmitting(true);
        try {
            const res = await api.post('/subscriptions/admin/terminate', { userId: selectedUser._id });
            if (res.data.success) {
                toast.success('Subscription terminated');
                setModalType(null);
                fetchAllSubscriptions();
            }
        } catch {
            toast.error('Failed to terminate subscription');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleSuspension = async (userId) => {
        try {
            const res = await api.post('/subscriptions/admin/toggle-suspension', { userId });
            if (res.data.success) {
                toast.success(res.data.message);
                fetchAllSubscriptions();
            }
        } catch {
            toast.error('Failed to change suspension status');
        }
    };

    const filteredSubs = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return subscriptions;

        return subscriptions.filter((sub) =>
            [sub.shopName, sub.ownerName, sub.email, sub.phone]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(term))
        );
    }, [subscriptions, searchTerm]);

    const metrics = useMemo(
        () => ({
            pendingPayments: subscriptions.filter((s) => s.pendingSubscription?.status === 'Pending').length,
            cancelRequests: subscriptions.filter((s) => s.cancellationRequest?.status === 'Pending').length,
            refundDue: subscriptions.filter(
                (s) => s.cancellationRequest?.status === 'Approved' && !s.cancellationRequest?.refundUtr
            ).length,
            paidLicenses: subscriptions.filter((s) => s.subscriptionPlan !== 'Free').length,
        }),
        [subscriptions]
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Administration</p>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Subscription Audit</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Manage shop subscriptions, manual payments, and refund workflows.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs text-slate-500">Pending Payments</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{metrics.pendingPayments}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs text-slate-500">Cancellation Requests</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{metrics.cancelRequests}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs text-slate-500">Refund Due</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{metrics.refundDue}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs text-slate-500">Active Subscriptions</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{metrics.paidLicenses}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4">
                <div className="relative">
                    <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search shop, owner, email, phone"
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="min-w-[1180px] w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Shop Details</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Cancellation</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Expires</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading &&
                                [1, 2, 3].map((i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-4 py-6">
                                            <div className="h-6 rounded bg-slate-100 dark:bg-slate-800" />
                                        </td>
                                    </tr>
                                ))}

                            {!loading &&
                                filteredSubs.map((sub) => (
                                    <tr key={sub._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-4">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{sub.shopName}</p>
                                            <p className="text-xs text-slate-500">{sub.ownerName} • {sub.phone}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${planBadgeClass(sub.subscriptionPlan)}`}>
                                                {sub.subscriptionPlan || 'Free'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {sub.pendingSubscription?.status || 'None'}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {sub.cancellationRequest?.status || 'None'}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(sub.planExpiresAt)}</td>
                                        <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{sub.isSuspended ? 'Suspended' : 'Active'}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {sub.pendingSubscription?.status === 'Pending' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(sub);
                                                            setModalType('payment');
                                                        }}
                                                        className="inline-flex rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                                                    >
                                                        Verify
                                                    </button>
                                                )}

                                                {sub.cancellationRequest?.status === 'Pending' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(sub);
                                                            setModalType('cancel');
                                                        }}
                                                        className="inline-flex rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                                                    >
                                                        Review Cancel
                                                    </button>
                                                )}

                                                {sub.cancellationRequest?.status === 'Approved' && !sub.cancellationRequest?.refundUtr && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(sub);
                                                            setModalType('refund');
                                                        }}
                                                        className="inline-flex rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                                    >
                                                        Refund
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(sub);
                                                        setEditData({
                                                            plan: sub.subscriptionPlan,
                                                            expiresAt: sub.planExpiresAt?.split('T')[0] || '',
                                                        });
                                                        setModalType('edit');
                                                    }}
                                                    className="inline-flex rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(sub);
                                                        setModalType('terminate');
                                                    }}
                                                    className="inline-flex rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                                                >
                                                    Terminate
                                                </button>

                                                <button
                                                    onClick={() => handleToggleSuspension(sub._id)}
                                                    className="inline-flex rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    {sub.isSuspended ? 'Unsuspend' : 'Suspend'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                            {!loading && filteredSubs.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                                        No subscription records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={modalType === 'payment'} onClose={() => setModalType(null)} title="Verify Payment" className="max-w-3xl">
                {selectedUser && (
                    <div className="space-y-4 py-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedUser.shopName}</p>
                            <p className="text-xs text-slate-500">Requested plan: {selectedUser.pendingSubscription?.plan || 'N/A'}</p>
                        </div>

                        {selectedUser.pendingSubscription?.screenshot && (
                            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                <img
                                    src={selectedUser.pendingSubscription.screenshot}
                                    alt="Payment screenshot"
                                    className="h-64 w-full object-contain bg-slate-100 dark:bg-slate-900"
                                />
                            </div>
                        )}

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                                onClick={() => handleVerifyPayment(selectedUser._id, 'Rejected')}
                                disabled={submitting}
                                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-slate-300 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-rose-500/10"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => handleVerifyPayment(selectedUser._id, 'Approved')}
                                disabled={submitting}
                                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={modalType === 'cancel'} onClose={() => setModalType(null)} title="Cancellation Request" className="max-w-xl">
                {selectedUser && (
                    <div className="space-y-4 py-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                            <p className="text-xs text-slate-500">Merchant Reason</p>
                            <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                                {selectedUser.cancellationRequest?.reason || 'No reason provided'}
                            </p>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500">Rejection Reason (required if rejecting)</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                placeholder="Explain why this cancellation is rejected"
                            />
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                                onClick={() => handleProcessCancellation(selectedUser._id, 'Rejected')}
                                disabled={submitting || !rejectReason.trim()}
                                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-slate-300 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-rose-500/10"
                            >
                                Reject Request
                            </button>
                            <button
                                onClick={() => handleProcessCancellation(selectedUser._id, 'Approved')}
                                disabled={submitting}
                                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                                Approve Request
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={modalType === 'refund'} onClose={() => setModalType(null)} title="Refund UTR" className="max-w-md">
                <div className="space-y-3 py-3">
                    <input
                        type="text"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="Enter refund UTR number"
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />

                    <button
                        onClick={handleRefund}
                        disabled={submitting || !utrNumber.trim()}
                        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                        Save Refund UTR
                    </button>
                </div>
            </Modal>

            <Modal isOpen={modalType === 'edit'} onClose={() => setModalType(null)} title="Edit Subscription" className="max-w-md">
                <div className="space-y-3 py-3">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Plan</label>
                        <select
                            value={editData.plan}
                            onChange={(e) => setEditData((prev) => ({ ...prev, plan: e.target.value }))}
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            <option value="Free">Free</option>
                            <option value="Professional">Professional</option>
                            <option value="Enterprise">Enterprise</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Expiry Date</label>
                        <input
                            type="date"
                            value={editData.expiresAt}
                            onChange={(e) => setEditData((prev) => ({ ...prev, expiresAt: e.target.value }))}
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                    </div>

                    <button
                        onClick={handleUpdateSub}
                        disabled={submitting}
                        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Save Changes
                    </button>
                </div>
            </Modal>

            <Modal isOpen={modalType === 'terminate'} onClose={() => setModalType(null)} title="Terminate Subscription" className="max-w-md">
                <div className="space-y-3 py-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        This will reset the merchant to free tier immediately.
                    </p>
                    <button
                        onClick={handleTerminate}
                        disabled={submitting}
                        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                        Confirm Termination
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default AdminSubscriptions;
