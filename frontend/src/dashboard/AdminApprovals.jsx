import React, { useState, useEffect } from 'react';
import api, { BASE_URL } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Check, X, User, Phone, MapPin, 
    Calendar, Eye, ShieldCheck, AlertCircle, RefreshCcw, FileText, Smartphone, Zap, Shield, Cpu, ExternalLink,
    Store
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const AdminApprovals = () => {
    const [pendingShops, setPendingShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedShop, setSelectedShop] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPendingShops();
    }, []);

    const fetchPendingShops = async () => {
        try {
            const res = await api.get('/admin/pending-approvals');
            setPendingShops(res.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to connect to approval list");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status, reason = '') => {
        setSubmitting(true);
        try {
            await api.put(`/admin/approvals/${id}`, { status, reason });
            toast.success(`Shop ${status} successfully`);
            setIsDetailModalOpen(false);
            setIsRejectModalOpen(false);
            setRejectReason('');
            fetchPendingShops();
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        }).toUpperCase();
    };

    return (
        <div className="space-y-8 md:space-y-12 pb-32 font-jakarta px-4 sm:px-0">
            {/* Header Section with Futuristic Aesthetic */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 md:gap-10 pt-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-amber-500 font-black uppercase text-[10px] tracking-[0.4em]">
                        <RefreshCcw size={14} className="animate-spin-slow" /> Pending Requests
                    </div>
                    <h1 className="text-3xl md:text-7xl font-black tracking-tighter uppercase dark:text-white leading-[0.9]">
                        Shop <span className="text-amber-500">Approvals</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-xl text-sm md:text-lg">
                        Verify shop details and payment proof for new businesses.
                    </p>
                </div>
                
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-amber-500 text-white px-6 md:px-10 py-3 md:py-5 rounded-2xl md:rounded-[2rem] text-xs md:text-sm font-black uppercase tracking-widest shadow-2xl shadow-amber-500/20 border-2 border-amber-400 md:rotate-2">
                    {pendingShops.length} Shops Pending
                </motion.div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 gap-6 md:gap-8">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white dark:bg-slate-900 animate-pulse rounded-3xl md:rounded-[3rem] border border-slate-100 dark:border-white/5"></div>)}
                </div>
            ) : pendingShops.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[40vh] md:h-[50vh] flex flex-col items-center justify-center text-center p-8 md:p-20 bg-white dark:bg-slate-900 rounded-3xl md:rounded-[4rem] border-2 border-dashed border-slate-100 dark:border-white/5 shadow-2xl">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-500 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center text-white mb-6 md:mb-8 shadow-2xl shadow-emerald-500/20 rotate-12">
                        <ShieldCheck size={40} md:size={48} />
                    </div>
                    <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter dark:text-white">All Clear</h3>
                    <p className="text-slate-500 font-medium max-w-sm mt-3 uppercase text-[10px] tracking-[0.2em]">All shops have been reviewed.</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:gap-8">
                    <AnimatePresence mode="popLayout">
                        {pendingShops.map((shop, idx) => (
                            <motion.div key={shop._id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.1 }} className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-3xl md:rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-xl hover:shadow-3xl hover:border-amber-500/30 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 md:gap-10 relative z-10">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-10 w-full">
                                        <div className="w-16 h-16 md:w-24 md:h-24 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center font-black text-2xl md:text-4xl shadow-inner border border-amber-100 dark:border-amber-500/20 group-hover:rotate-6 transition-transform shrink-0">
                                            {shop.shopName.charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight dark:text-white mb-2 md:mb-3 group-hover:text-amber-500 transition-colors leading-tight truncate">{shop.shopName}</h3>
                                            <div className="flex flex-wrap items-center gap-x-4 md:gap-x-8 gap-y-2 md:gap-y-4">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <User size={14} className="text-amber-500" /> <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{shop.ownerName}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <FileText size={14} className="text-amber-500" /> <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{shop.businessType}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Calendar size={14} className="text-amber-500" /> <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{formatDate(shop.createdAt)}</span>
                                                </div>
                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${
                                                    shop.pendingSubscription?.plan === 'Professional' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 
                                                    shop.pendingSubscription?.plan === 'Enterprise' ? 'bg-amber-50 border-amber-100 text-amber-600' : 
                                                    'bg-slate-50 border-slate-100 text-slate-600'
                                                }`}>
                                                    <Zap size={12} /> <span className="text-[9px] font-black uppercase tracking-widest">{shop.pendingSubscription?.plan || 'Free Plan'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 md:gap-6 w-full xl:w-auto mt-2 xl:mt-0">
                                        <button onClick={() => { setSelectedShop(shop); setIsDetailModalOpen(true); }} className="flex-1 xl:flex-none h-12 md:h-18 px-4 md:px-10 bg-slate-950 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-2 md:gap-3 shrink-0">
                                            <Eye size={16} md:size={20} /> <span className="hidden sm:inline">Review Details</span><span className="sm:hidden">Review</span>
                                        </button>
                                        <button onClick={() => handleStatusUpdate(shop._id, 'Approved')} disabled={submitting} className="flex-1 xl:flex-none h-12 md:h-18 px-4 md:px-10 bg-emerald-600 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 md:gap-3 shadow-2xl shadow-emerald-500/20 shrink-0">
                                            <Check size={16} md:size={20} /> <span className="hidden sm:inline">Approve</span><span className="sm:hidden">OK</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Application Detail Modal - Futuristic Overlay */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Verification Details" className="max-w-5xl">
                {selectedShop && (
                    <div className="py-8 space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                            {/* Primary Intel */}
                            <div className="md:col-span-7 space-y-12">
                                <div className="p-10 bg-slate-50 dark:bg-slate-950 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-inner space-y-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20"><Store size={36} /></div>
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Shop Name</p>
                                            <h4 className="text-3xl font-black dark:text-white leading-none uppercase">{selectedShop.shopName}</h4>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                                            <p className="text-lg font-black dark:text-white">{selectedShop.phone}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                            <p className="text-lg font-black dark:text-white truncate lowercase">{selectedShop.email}</p>
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Store Address</p>
                                            <p className="text-lg font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight leading-relaxed italic">"{selectedShop.address}"</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] ml-4">Documents</p>
                                    <div className="grid grid-cols-2 gap-8">
                                        {[
                                            { label: 'ID Proof', field: 'aadharImage', icon: <Shield size={20} /> },
                                            { label: 'Payment Proof', field: 'paymentScreenshot', icon: <Zap size={20} /> }
                                        ].map((art, i) => (
                                            selectedShop[art.field] && (
                                                <div key={i} className="group relative rounded-[2.5rem] overflow-hidden border-4 border-slate-100 dark:border-white/5 bg-slate-950 aspect-[4/3] shadow-xl">
                                                    <img src={selectedShop[art.field].startsWith('http') ? selectedShop[art.field] : `${BASE_URL}${selectedShop[art.field]}`} alt={art.label} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" />
                                                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black to-transparent">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3 text-white"><div className="text-indigo-400">{art.icon}</div><span className="text-[10px] font-black uppercase tracking-widest">{art.label}</span></div>
                                                            <a href={selectedShop[art.field].startsWith('http') ? selectedShop[art.field] : `${BASE_URL}${selectedShop[art.field]}`} target="_blank" rel="noreferrer" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-950 hover:scale-110 transition-all"><ExternalLink size={18} /></a>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Intel */}
                            <div className="md:col-span-5 space-y-8">
                                <div className="p-10 bg-amber-500 text-white rounded-[3.5rem] shadow-2xl shadow-amber-500/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="relative z-10 space-y-6">
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">ID Number</p>
                                        <h4 className="text-4xl font-black font-mono tracking-tighter">{selectedShop.aadharNumber || 'NO-ID-DETECTED'}</h4>
                                        <div className="pt-6 border-t border-white/20">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Request Date</p>
                                            <p className="text-lg font-black">{formatDate(selectedShop.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-950 p-10 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-10">
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] text-center">Review Action</h5>
                                    <div className="space-y-4">
                                        <button onClick={() => handleStatusUpdate(selectedShop._id, 'Approved')} disabled={submitting} className="w-full h-20 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4">
                                            {submitting ? 'Approving...' : <><Check size={24} /> Approve Shop</>}
                                        </button>
                                        <button onClick={() => { setIsDetailModalOpen(false); setIsRejectModalOpen(true); }} className="w-full h-18 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">Reject Application</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Denial Core */}
            <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Reject Application" className="max-w-md">
                <div className="py-6 space-y-8">
                    <div className="p-10 bg-rose-500 text-white rounded-[3rem] text-center space-y-6 shadow-2xl shadow-rose-500/20 rotate-2">
                        <AlertCircle size={64} className="mx-auto" />
                        <div>
                            <h4 className="text-2xl font-black uppercase tracking-tight">Confirm Rejection?</h4>
                            <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80 leading-relaxed">Provide a reason for the shop owner.</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-4">Reason for Rejection</label>
                        <textarea required placeholder="e.g. ID proof mismatch..." className="w-full p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-white/5 outline-none focus:border-rose-500 h-40 resize-none font-bold dark:text-white" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setIsRejectModalOpen(false)} className="h-18 flex-1 bg-slate-50 dark:bg-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-500">Cancel</button>
                        <button disabled={!rejectReason || submitting} onClick={() => handleStatusUpdate(selectedShop._id, 'Rejected', rejectReason)} className="h-18 flex-[2] bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-all disabled:opacity-50">Reject Now</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminApprovals;
