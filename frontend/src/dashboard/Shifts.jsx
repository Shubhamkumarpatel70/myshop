import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
    Clock, Plus, LogOut, CheckCircle2, 
    AlertCircle, IndianRupee, History, 
    User, Calendar, ArrowRight, Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Shifts = () => {
    const [shifts, setShifts] = useState([]);
    const [currentShift, setCurrentShift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [openingCash, setOpeningCash] = useState('');
    const [closingCash, setClosingCash] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [shiftsRes, currentRes] = await Promise.all([
                api.get('/shifts'),
                api.get('/shifts/current')
            ]);
            setShifts(shiftsRes.data.data);
            setCurrentShift(currentRes.data.data);
        } catch (error) {
            toast.error("Failed to load shift data");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenShift = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/shifts/open', { openingCash: Number(openingCash) });
            if (res.data.success) {
                toast.success("Shift opened successfully!");
                setCurrentShift(res.data.data);
                setShowOpenModal(false);
                setOpeningCash('');
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to open shift");
        }
    };

    const handleCloseShift = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/shifts/close', { 
                closingCash: Number(closingCash),
                notes 
            });
            if (res.data.success) {
                toast.success("Shift closed and reconciled!");
                setCurrentShift(null);
                setShowCloseModal(false);
                setClosingCash('');
                setNotes('');
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to close shift");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Shifts...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">Shift Management</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage daily cash reconciliation and staff sessions.</p>
                </div>
                {!currentShift ? (
                    <button 
                        onClick={() => setShowOpenModal(true)}
                        className="btn btn-primary w-full lg:w-auto px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20"
                    >
                        <Plus size={20} /> Open New Shift
                    </button>
                ) : (
                    <button 
                        onClick={() => setShowCloseModal(true)}
                        className="bg-rose-600 text-white w-full lg:w-auto px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-rose-500/20 hover:bg-rose-700 transition-all"
                    >
                        <LogOut size={20} /> End Current Shift
                    </button>
                )}
            </div>

            {/* Current Active Shift Card */}
            {currentShift && (
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                    <Clock size={20} />
                                </div>
                                <span className="font-black uppercase tracking-[0.2em] text-xs opacity-80">Active Session</span>
                            </div>
                            <div>
                                <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest">Opening Balance</p>
                                <h2 className="text-5xl font-black tracking-tighter mt-1">₹{currentShift.openingCash.toLocaleString()}</h2>
                            </div>
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">Started At</p>
                                    <p className="font-bold text-lg">{new Date(currentShift.startTime).toLocaleTimeString()}</p>
                                </div>
                                <div className="w-px h-10 bg-white/20"></div>
                                <div>
                                    <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">Staff Member</p>
                                    <p className="font-bold text-lg">Current User</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/10 w-full lg:max-w-md">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertCircle size={18} className="text-indigo-200" />
                                <span className="text-xs font-black uppercase tracking-widest text-indigo-100">Live Status</span>
                            </div>
                            <p className="text-sm font-medium leading-relaxed opacity-90 mb-6">
                                All sales processed during this session will be reconciled against your closing balance. 
                                Ensure all cash transactions are properly entered in the POS.
                            </p>
                            <button 
                                onClick={() => setShowCloseModal(true)}
                                className="w-full py-4 bg-white text-indigo-600 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg"
                            >
                                Close Shift Now
                            </button>
                        </div>
                    </div>
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                </div>
            )}

            {/* Shift History Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <History size={20} className="text-indigo-600" />
                        <h3 className="text-xl font-black uppercase tracking-tight">Shift History</h3>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-500">
                        {shifts.length} Sessions Found
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Date & Staff</th>
                                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Duration</th>
                                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Cash Reconcile</th>
                                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Total Sales</th>
                                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {shifts.length > 0 ? shifts.map((shift) => (
                                <tr key={shift._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-tight">{shift.user?.ownerName || 'User'}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    {new Date(shift.startTime).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-sm font-bold text-slate-600 dark:text-slate-400">
                                        {new Date(shift.startTime).toLocaleTimeString()} - {shift.endTime ? new Date(shift.endTime).toLocaleTimeString() : 'Active'}
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-black text-sm">₹{shift.closingCash?.toLocaleString() || '---'}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                                                shift.closingCash >= shift.expectedCash ? 'text-emerald-500' : 'text-rose-500'
                                            }`}>
                                                {shift.closingCash >= shift.expectedCash ? 'Balanced' : 'Shortage'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right font-black text-indigo-600 dark:text-indigo-400">
                                        ₹{shift.totalSales?.toLocaleString() || '---'}
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex justify-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                shift.status === 'Open' 
                                                    ? 'bg-amber-50 text-amber-600 border-amber-100' 
                                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                                {shift.status}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-300">
                                                <History size={32} />
                                            </div>
                                            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No Shift History Found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showOpenModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowOpenModal(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <form onSubmit={handleOpenShift} className="p-10 space-y-8">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-indigo-500/20">
                                        <Clock size={32} />
                                    </div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight">Start New Shift</h2>
                                    <p className="text-slate-500 font-medium">Verify your opening cash balance to begin.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Opening Cash Balance (₹)</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-5 top-5 text-indigo-600" size={20} />
                                        <input 
                                            type="number"
                                            required
                                            value={openingCash}
                                            onChange={(e) => setOpeningCash(e.target.value)}
                                            placeholder="Enter amount in drawer"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-5 pl-14 pr-6 text-xl font-black focus:ring-2 focus:ring-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => setShowOpenModal(false)}
                                        className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
                                    >
                                        Open Shift <ArrowRight size={20} />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showCloseModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCloseModal(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <form onSubmit={handleCloseShift} className="p-10 space-y-8">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-rose-500/20">
                                        <LogOut size={32} />
                                    </div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight">End Shift Session</h2>
                                    <p className="text-slate-500 font-medium">Reconcile cash and finalize reports.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Closing Cash Balance (₹)</label>
                                        <div className="relative">
                                            <Wallet className="absolute left-5 top-5 text-rose-600" size={20} />
                                            <input 
                                                type="number"
                                                required
                                                value={closingCash}
                                                onChange={(e) => setClosingCash(e.target.value)}
                                                placeholder="Total cash in drawer"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-5 pl-14 pr-6 text-xl font-black focus:ring-2 focus:ring-rose-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Notes / Discrepancy Reason</label>
                                        <textarea 
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Optional comments..."
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all h-24 resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => setShowCloseModal(false)}
                                        className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-500/20"
                                    >
                                        Close & Reconcile
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Shifts;
