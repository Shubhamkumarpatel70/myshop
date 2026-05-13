import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck, Clock, Check, X, 
    ExternalLink, Search, Mail, Phone,
    Store, Zap, Crown, Info, Edit2, Trash2, Ban, RefreshCcw, DollarSign, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const AdminSubscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalType, setModalType] = useState(null); // 'cancel', 'refund', 'payment', 'edit'
    const [utrNumber, setUtrNumber] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAllSubscriptions();
    }, []);

    const fetchAllSubscriptions = async () => {
        try {
            const res = await api.get('/subscriptions/admin/all');
            setSubscriptions(res.data.data);
        } catch (error) {
            toast.error("Failed to load subscriptions");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPayment = async (userId, status) => {
        setSubmitting(true);
        try {
            const res = await api.post('/subscriptions/admin/verify', {
                userId,
                status
            });
            if (res.data.success) {
                toast.success(`Payment ${status} successfully`);
                setModalType(null);
                fetchAllSubscriptions();
            }
        } catch (error) {
            toast.error("Verification failed");
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
                rejectReason: status === 'Rejected' ? rejectReason : ''
            });
            if (res.data.success) {
                toast.success(`Request ${status} successfully`);
                setModalType(null);
                fetchAllSubscriptions();
            }
        } catch (error) {
            toast.error("Action failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRefund = async () => {
        if (!utrNumber) return toast.error("Please enter UTR number");
        setSubmitting(true);
        try {
            const res = await api.post('/subscriptions/admin/refund', {
                userId: selectedUser._id,
                utr: utrNumber
            });
            if (res.data.success) {
                toast.success("Refund processed and plan terminated");
                setModalType(null);
                fetchAllSubscriptions();
            }
        } catch (error) {
            toast.error("Refund failed");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredSubs = subscriptions.filter(s => 
        s.shopName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPlanIcon = (name) => {
        if (name === 'Free') return <Zap size={18} className="text-slate-400" />;
        if (name === 'Professional') return <ShieldCheck size={18} className="text-indigo-600" />;
        return <Crown size={18} className="text-amber-600" />;
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 font-black uppercase text-[10px] tracking-[0.3em]">
                        <RefreshCcw size={14} className="animate-spin-slow" /> Unified Lifecycle Audit
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">
                        Subscription <span className="text-indigo-600">Audit</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl text-lg">
                        Manage payments, active licenses, and merchant refund workflows.
                    </p>
                </div>
                
                <div className="relative w-full lg:w-80 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by shop or owner..." 
                        className="input-field pl-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">New Payments</p>
                    <p className="text-3xl font-black text-indigo-600">{subscriptions.filter(s => s.pendingSubscription?.status === 'Pending').length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 border-rose-100 dark:border-rose-900/30">
                    <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-1">Cancellations</p>
                    <p className="text-3xl font-black text-rose-600">{subscriptions.filter(s => s.cancellationRequest?.status === 'Pending').length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">Refunds Due</p>
                    <p className="text-3xl font-black text-emerald-600">{subscriptions.filter(s => s.cancellationRequest?.status === 'Approved' && !s.cancellationRequest.refundUtr).length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Licenses</p>
                    <p className="text-3xl font-black">{subscriptions.filter(s => s.subscriptionPlan !== 'Free').length}</p>
                </div>
            </div>

            {/* Main Table/List */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Shop & Owner</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Plan & Expiry</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status / Requests</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="4" className="px-8 py-10"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredSubs.map((sub) => (
                                <tr key={sub._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 font-black uppercase shrink-0">
                                                {sub.shopName.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{sub.shopName}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <a href={`tel:${sub.phone}`} className="text-slate-400 hover:text-indigo-600 transition-colors"><Phone size={12} /></a>
                                                    <a href={`mailto:${sub.email}`} className="text-slate-400 hover:text-indigo-600 transition-colors"><Mail size={12} /></a>
                                                    <span className="text-[10px] font-bold text-slate-400 truncate">{sub.ownerName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                {getPlanIcon(sub.subscriptionPlan)}
                                                <span className="font-black uppercase text-xs tracking-tight">{sub.subscriptionPlan}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400">Expires: {formatDate(sub.planExpiresAt)}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-2">
                                            {/* Payment Requests */}
                                            {sub.pendingSubscription?.status === 'Pending' && (
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">Payment Proof</span>
                                                    <button 
                                                        onClick={() => { setSelectedUser(sub); setModalType('payment'); }}
                                                        className="text-[9px] font-black text-indigo-600 uppercase hover:underline"
                                                    >
                                                        Review & Activate
                                                    </button>
                                                </div>
                                            )}

                                            {/* Cancellation Requests */}
                                            {sub.cancellationRequest?.status === 'Pending' && (
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">Cancel Request</span>
                                                    <button 
                                                        onClick={() => { setSelectedUser(sub); setModalType('cancel'); }}
                                                        className="text-[9px] font-black text-rose-600 uppercase hover:underline"
                                                    >
                                                        Process
                                                    </button>
                                                </div>
                                            )}

                                            {/* Refund Needed */}
                                            {sub.cancellationRequest?.status === 'Approved' && !sub.cancellationRequest.refundUtr && (
                                                <button 
                                                    onClick={() => { setSelectedUser(sub); setModalType('refund'); }}
                                                    className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit hover:bg-emerald-100 transition-all"
                                                >
                                                    <DollarSign size={10} /> Needs Refund
                                                </button>
                                            )}

                                            {!sub.pendingSubscription?.status && sub.cancellationRequest?.status === 'None' && (
                                                <span className="text-[10px] font-bold text-slate-300">Clean Lifecycle</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 transition-all" title="Edit Profile">
                                                <Edit2 size={14} />
                                            </button>
                                            <button className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-600 transition-all" title="Terminate">
                                                <Trash2 size={14} />
                                            </button>
                                            <button className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-600 transition-all" title="Suspend">
                                                <Ban size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Verification Modal */}
            <Modal
                isOpen={modalType === 'payment'}
                onClose={() => setModalType(null)}
                title="Verify Purchase Payment"
                className="max-w-2xl"
            >
                {selectedUser && (
                    <div className="space-y-6 py-4">
                        <div className="flex justify-between items-center p-6 bg-indigo-50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20">
                            <div>
                                <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-1">Purchasing Plan</p>
                                <h3 className="text-2xl font-black uppercase tracking-tight">{selectedUser.pendingSubscription.plan}</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Requested On</p>
                                <p className="font-bold text-slate-700">{formatDate(selectedUser.pendingSubscription.requestedAt)}</p>
                            </div>
                        </div>
                        
                        <div className="aspect-video w-full rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                            <img 
                                src={selectedUser.pendingSubscription.screenshot} 
                                alt="Payment Proof" 
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => handleVerifyPayment(selectedUser._id, 'Rejected')}
                                disabled={submitting}
                                className="flex-1 h-16 bg-slate-100 dark:bg-slate-800 text-rose-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-50 transition-all disabled:opacity-50"
                            >
                                Reject
                            </button>
                            <button 
                                onClick={() => handleVerifyPayment(selectedUser._id, 'Approved')}
                                disabled={submitting}
                                className="flex-[2] h-16 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3"
                            >
                                {submitting ? 'Activating...' : 'Approve & Activate'} <Check size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Cancellation Modal */}
            <Modal
                isOpen={modalType === 'cancel'}
                onClose={() => setModalType(null)}
                title="Process Cancellation"
                className="max-w-xl"
            >
                {selectedUser && (
                    <div className="space-y-6 py-4">
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Merchant Reason</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white leading-relaxed italic">
                                "{selectedUser.cancellationRequest.reason}"
                            </p>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Rejection Reason (If rejecting)</p>
                            <textarea 
                                placeholder="Explain why the cancellation is being rejected..."
                                className="input-field h-28 pt-4 resize-none"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => handleProcessCancellation(selectedUser._id, 'Rejected')}
                                disabled={submitting || !rejectReason}
                                className="flex-1 h-16 bg-slate-100 dark:bg-slate-800 text-rose-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-50 transition-all disabled:opacity-50"
                            >
                                Reject Request
                            </button>
                            <button 
                                onClick={() => handleProcessCancellation(selectedUser._id, 'Approved')}
                                disabled={submitting}
                                className="flex-[2] h-16 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-500/20"
                            >
                                {submitting ? 'Processing...' : 'Approve & Refund'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Refund Modal */}
            <Modal
                isOpen={modalType === 'refund'}
                onClose={() => setModalType(null)}
                title="Complete Refund Process"
                className="max-w-md"
            >
                <div className="space-y-6 py-4">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CreditCard size={32} />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Manual Payment Issued?</h3>
                        <p className="text-slate-500 text-sm font-medium">Record the transaction ID to notify the owner and terminate the license.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">UTR / Bank Transaction ID</label>
                        <input 
                            type="text"
                            placeholder="e.g. 123456789012"
                            className="input-field h-16 text-center font-black text-xl tracking-widest"
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value)}
                        />
                    </div>

                    <button 
                        onClick={handleRefund}
                        disabled={submitting || !utrNumber}
                        className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50"
                    >
                        {submitting ? 'Updating...' : 'Finish & Terminate Plan'}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default AdminSubscriptions;
