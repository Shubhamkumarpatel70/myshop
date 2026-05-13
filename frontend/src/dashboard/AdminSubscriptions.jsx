import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck, Clock, Check, X, 
    ExternalLink, Search, Mail, Phone,
    Store, Zap, Crown, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const AdminSubscriptions = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/subscriptions/admin/requests');
            setRequests(res.data.data);
        } catch (error) {
            toast.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (userId, status) => {
        setVerifying(true);
        try {
            const res = await api.post('/subscriptions/admin/verify', {
                userId,
                status
            });
            if (res.data.success) {
                toast.success(res.data.message);
                setSelectedRequest(null);
                fetchRequests();
            }
        } catch (error) {
            toast.error("Verification failed");
        } finally {
            setVerifying(false);
        }
    };

    const filteredRequests = requests.filter(r => 
        r.shopName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 font-black uppercase text-[10px] tracking-[0.3em]">
                        <ShieldCheck size={14} /> Revenue Control
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                        Subscription <span className="text-indigo-600">Audit</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl text-lg">
                        Review manual payment screenshots and activate Professional/Enterprise tiers for shop nodes.
                    </p>
                </div>
                
                <div className="relative w-full lg:w-80 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search shops..." 
                        className="input-field pl-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Requests List */}
            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-white dark:bg-slate-900 rounded-[2.5rem] animate-pulse border border-slate-100 dark:border-slate-800"></div>
                    ))
                ) : filteredRequests.length === 0 ? (
                    <div className="py-20 text-center space-y-4 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                            <Check size={40} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-400 uppercase tracking-tighter">All caught up!</p>
                            <p className="text-slate-500 font-medium">No pending subscription requests found.</p>
                        </div>
                    </div>
                ) : filteredRequests.map((request) => (
                    <motion.div 
                        key={request._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all flex flex-col lg:flex-row items-center gap-8"
                    >
                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl shadow-inner">
                                    {request.shopName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">{request.shopName}</h3>
                                    <p className="text-xs font-bold text-slate-400">{request.ownerName}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Requested Plan</p>
                                <div className="flex items-center gap-2">
                                    {request.pendingSubscription.plan === 'Enterprise' ? (
                                        <Crown size={18} className="text-amber-600" />
                                    ) : (
                                        <ShieldCheck size={18} className="text-indigo-600" />
                                    )}
                                    <span className="text-lg font-black uppercase tracking-tighter">{request.pendingSubscription.plan}</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400">Current: {request.subscriptionPlan}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact Info</p>
                                <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                                    <a href={`tel:${request.phone}`} className="hover:text-indigo-600 transition-colors"><Phone size={18} /></a>
                                    <a href={`mailto:${request.email}`} className="hover:text-indigo-600 transition-colors"><Mail size={18} /></a>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full lg:w-auto">
                            <button 
                                onClick={() => setSelectedRequest(request)}
                                className="flex-1 lg:w-48 h-14 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                            >
                                <ExternalLink size={14} /> View Proof
                            </button>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleVerify(request._id, 'Approved')}
                                    className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                                    title="Approve Subscription"
                                >
                                    <Check size={24} />
                                </button>
                                <button 
                                    onClick={() => handleVerify(request._id, 'Rejected')}
                                    className="w-14 h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
                                    title="Reject Request"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Proof Modal */}
            <Modal
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                title="Payment Verification"
                className="max-w-2xl"
            >
                {selectedRequest && (
                    <div className="space-y-6 py-4">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 flex items-center gap-3">
                            <Info size={18} className="text-indigo-600" />
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                Verify the transaction ID and amount in the screenshot before approving.
                            </p>
                        </div>
                        
                        <div className="aspect-[3/4] w-full rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                            <img 
                                src={selectedRequest.pendingSubscription.screenshot} 
                                alt="Payment Proof" 
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => handleVerify(selectedRequest._id, 'Rejected')}
                                disabled={verifying}
                                className="flex-1 h-16 bg-slate-100 dark:bg-slate-800 text-rose-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                            >
                                Reject Request
                            </button>
                            <button 
                                onClick={() => handleVerify(selectedRequest._id, 'Approved')}
                                disabled={verifying}
                                className="flex-[2] h-16 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                            >
                                {verifying ? 'Verifying...' : 'Approve & Activate'} <Check size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminSubscriptions;
