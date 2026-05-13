import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Check, X, User, Phone, MapPin, 
    Calendar, Eye, ShieldCheck, AlertCircle
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

    useEffect(() => {
        fetchPendingShops();
    }, []);

    const fetchPendingShops = async () => {
        try {
            const res = await api.get('/admin/pending-approvals');
            setPendingShops(res.data.data);
        } catch (error) {
            toast.error("Failed to fetch pending shops");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status, reason = '') => {
        try {
            await api.put(`/admin/approvals/${id}`, { status, reason });
            toast.success(`Shop ${status.toLowerCase()} successfully`);
            setIsDetailModalOpen(false);
            setIsRejectModalOpen(false);
            setRejectReason('');
            fetchPendingShops();
        } catch (error) {
            toast.error("Update failed");
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    if (loading) return <div className="animate-pulse space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-[2rem]"></div>)}
    </div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Shop Approvals</h1>
                    <p className="text-slate-500">Review and authorize new shop owner registrations.</p>
                </div>
                <div className="bg-amber-50 text-amber-600 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border border-amber-100">
                    {pendingShops.length} Pending
                </div>
            </div>

            {pendingShops.length === 0 ? (
                <div className="h-[50vh] flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800">
                    <ShieldCheck size={48} className="text-slate-200 mb-4" />
                    <h3 className="text-xl font-black uppercase">All Caught Up!</h3>
                    <p className="text-slate-500">No new shop owners are waiting for approval.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {pendingShops.map((shop) => (
                        <motion.div 
                            layout
                            key={shop._id}
                            className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none hover:border-indigo-500/30 transition-all group"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-[1.5rem] flex items-center justify-center font-black text-2xl">
                                        {shop.shopName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight">{shop.shopName}</h3>
                                        <p className="text-slate-500 font-bold">{shop.ownerName} • {shop.businessType}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <button 
                                        onClick={() => { setSelectedShop(shop); setIsDetailModalOpen(true); }}
                                        className="flex-1 md:flex-none px-6 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Eye size={16} /> View Details
                                    </button>
                                    <button 
                                        onClick={() => handleStatusUpdate(shop._id, 'Approved')}
                                        className="flex-1 md:flex-none px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Check size={16} /> Approve
                                    </button>
                                    <button 
                                        onClick={() => { setSelectedShop(shop); setIsRejectModalOpen(true); }}
                                        className="flex-1 md:flex-none px-6 py-3 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <X size={16} /> Reject
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Shop Detail Modal */}
            <Modal 
                isOpen={isDetailModalOpen} 
                onClose={() => setIsDetailModalOpen(false)} 
                title="Shop Application Details"
                className="max-w-2xl"
            >
                {selectedShop && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Shop Name</p>
                                <p className="text-lg font-black">{selectedShop.shopName}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Business Type</p>
                                <p className="text-lg font-black">{selectedShop.businessType}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Owner Name</p>
                                <div className="flex items-center gap-2">
                                    <User size={16} className="text-indigo-600" />
                                    <p className="text-lg font-black">{selectedShop.ownerName}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact Phone</p>
                                <div className="flex items-center gap-2">
                                    <Phone size={16} className="text-indigo-600" />
                                    <p className="text-lg font-black">{selectedShop.phone}</p>
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Business Address</p>
                                <div className="flex items-start gap-2">
                                    <MapPin size={16} className="text-indigo-600 mt-1 shrink-0" />
                                    <p className="text-lg font-bold text-slate-700 leading-relaxed">{selectedShop.address}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Registered On</p>
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-indigo-600" />
                                    <p className="text-lg font-black">{formatDate(selectedShop.createdAt)}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Aadhar Number</p>
                                <p className="text-lg font-black font-mono">{selectedShop.aadharNumber || 'Not Provided'}</p>
                            </div>
                        </div>

                        {selectedShop.aadharImage && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Identity Document</p>
                                <div className="w-full aspect-video rounded-[2rem] overflow-hidden border-2 border-slate-100 bg-slate-50">
                                    <img 
                                        src={selectedShop.aadharImage.startsWith('http') ? selectedShop.aadharImage : `http://localhost:5000${selectedShop.aadharImage}`} 
                                        alt="Aadhar" 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                            </div>
                        )}

                        {selectedShop.paymentScreenshot && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Payment Proof (Screenshot)</p>
                                <div className="w-full rounded-[2rem] overflow-hidden border-2 border-amber-100 bg-amber-50/30">
                                    <img 
                                        src={selectedShop.paymentScreenshot.startsWith('http') ? selectedShop.paymentScreenshot : `http://localhost:5000${selectedShop.paymentScreenshot}`} 
                                        alt="Payment Screenshot" 
                                        className="w-full h-auto max-h-[400px] object-contain" 
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 pt-6 border-t border-slate-100">
                            <button 
                                onClick={() => handleStatusUpdate(selectedShop._id, 'Approved')}
                                className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20"
                            >
                                Approve Application
                            </button>
                            <button 
                                onClick={() => { setIsDetailModalOpen(false); setIsRejectModalOpen(true); }}
                                className="px-8 py-5 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Rejection Reason Modal */}
            <Modal 
                isOpen={isRejectModalOpen} 
                onClose={() => setIsRejectModalOpen(false)} 
                title="Reject Application"
                className="max-w-md"
            >
                <div className="space-y-6">
                    <div className="p-6 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center gap-4">
                        <AlertCircle size={32} className="shrink-0" />
                        <p className="text-xs font-bold leading-relaxed uppercase">
                            Please specify why you are rejecting this shop owner. This will be visible on their dashboard.
                        </p>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Reason for Rejection</label>
                        <textarea 
                            required
                            placeholder="e.g. Identity document is blurry or invalid address..."
                            className="input-field h-32 pt-4 resize-none"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsRejectModalOpen(false)}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={!rejectReason}
                            onClick={() => handleStatusUpdate(selectedShop._id, 'Rejected', rejectReason)}
                            className="flex-2 py-4 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-rose-700 transition-all disabled:opacity-50"
                        >
                            Confirm Rejection
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminApprovals;
