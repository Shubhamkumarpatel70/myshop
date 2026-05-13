import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck, Clock, Check, X, 
    ExternalLink, Search, Mail, Phone,
    Store, Zap, Crown, Info, Edit2, Trash2, Ban, RefreshCcw, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const AdminSubscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalType, setModalType] = useState(null); // 'cancel', 'refund', 'edit'
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
                        <RefreshCcw size={14} className="animate-spin-slow" /> Lifecycle Manager
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">
                        Subscription <span className="text-indigo-600">Audit</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl text-lg">
                        Manage active licenses, process cancellations, and handle merchant refunds.
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
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Shops</p>
                    <p className="text-3xl font-black">{subscriptions.length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">Active Paid</p>
                    <p className="text-3xl font-black">{subscriptions.filter(s => s.subscriptionPlan !== 'Free').length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 border-rose-100 dark:border-rose-900/30">
                    <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-1">Cancellations</p>
                    <p className="text-3xl font-black text-rose-600">{subscriptions.filter(s => s.cancellationRequest?.status === 'Pending').length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">Refunds Pending</p>
                    <p className="text-3xl font-black text-emerald-600">{subscriptions.filter(s => s.cancellationRequest?.status === 'Approved' && !s.cancellationRequest.refundUtr).length}</p>
                </div>
            </div>

            {/* Main Table/List */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Shop & Owner</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Plan</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Duration</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Cancel Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-8 py-10"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredSubs.map((sub) => (
                                <tr key={sub._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 font-black uppercase">
                                                {sub.shopName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{sub.shopName}</p>
                                                <p className="text-xs font-bold text-slate-400">{sub.ownerName}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            {getPlanIcon(sub.subscriptionPlan)}
                                            <span className="font-black uppercase text-sm tracking-tight">{sub.subscriptionPlan}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400">Activated: {formatDate(sub.planActivatedAt)}</p>
                                            <p className="text-[10px] font-bold text-rose-500">Expires: {formatDate(sub.planExpiresAt)}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {sub.cancellationRequest?.status === 'Pending' ? (
                                            <div className="flex flex-col gap-2">
                                                <span className="px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest w-fit animate-pulse">Request Pending</span>
                                                <button 
                                                    onClick={() => { setSelectedUser(sub); setModalType('cancel'); }}
                                                    className="text-[10px] font-black text-indigo-600 uppercase hover:underline text-left"
                                                >
                                                    Process Request
                                                </button>
                                            </div>
                                        ) : sub.cancellationRequest?.status === 'Approved' ? (
                                            <div className="space-y-1">
                                                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest w-fit flex items-center gap-1">
                                                    <Check size={10} /> Approved
                                                </span>
                                                {!sub.cancellationRequest.refundUtr && (
                                                    <button 
                                                        onClick={() => { setSelectedUser(sub); setModalType('refund'); }}
                                                        className="text-[10px] font-black text-indigo-600 uppercase hover:underline flex items-center gap-1"
                                                    >
                                                        <DollarSign size={10} /> Add Refund UTR
                                                    </button>
                                                )}
                                                {sub.cancellationRequest.refundUtr && (
                                                    <p className="text-[9px] font-bold text-slate-400">UTR: {sub.cancellationRequest.refundUtr}</p>
                                                )}
                                            </div>
                                        ) : sub.cancellationRequest?.status === 'Rejected' ? (
                                            <div className="space-y-1">
                                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest w-fit">Rejected</span>
                                                <p className="text-[9px] font-medium text-slate-400 italic">"{sub.cancellationRequest.rejectReason}"</p>
                                            </div>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-300">No Requests</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 transition-all" title="Edit Expiry">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-600 transition-all" title="Terminate Plan">
                                                <Trash2 size={16} />
                                            </button>
                                            <button className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-600 transition-all" title={sub.isSuspended ? 'Unsuspend' : 'Suspend Account'}>
                                                <Ban size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

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
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Reason for Cancellation</p>
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
                                {submitting ? 'Processing...' : 'Approve & Start Refund'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Refund Modal */}
            <Modal
                isOpen={modalType === 'refund'}
                onClose={() => setModalType(null)}
                title="Issue Refund Proof"
                className="max-w-md"
            >
                <div className="space-y-6 py-4">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <DollarSign size={32} />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Manual Refund Done?</h3>
                        <p className="text-slate-500 text-sm font-medium">Enter the UPI/Bank UTR Number to notify the shop owner and terminate their license.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">UTR / Transaction ID</label>
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
                        {submitting ? 'Completing...' : 'Complete Refund & Terminate'}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default AdminSubscriptions;
