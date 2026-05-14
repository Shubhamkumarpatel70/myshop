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
        <div className="space-y-6 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">Shift Management</h1>
                    <p className="text-slate-500 text-sm font-medium">Daily cash reconciliation and staff sessions.</p>
                </div>
                {!currentShift ? (
                    <button 
                        onClick={() => setShowOpenModal(true)}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                    >
                        <Plus size={18} /> Open New Shift
                    </button>
                ) : (
                    <button 
                        onClick={() => setShowCloseModal(true)}
                        className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all"
                    >
                        <LogOut size={18} /> End Current Shift
                    </button>
                )}
            </div>

            {/* Current Active Shift Card */}
            {currentShift && (
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md">
                                    <Clock size={16} />
                                </div>
                                <span className="font-black uppercase tracking-widest text-[10px] opacity-80">Active Session</span>
                            </div>
                            <div>
                                <p className="text-indigo-100 text-[11px] font-bold uppercase tracking-widest">Opening Balance</p>
                                <h2 className="text-4xl font-black tracking-tight mt-0.5">₹{currentShift.openingCash.toLocaleString()}</h2>
                            </div>
                            <div className="flex flex-wrap items-center gap-6">
                                <div>
                                    <p className="text-indigo-100 text-[9px] font-black uppercase tracking-widest">Started At</p>
                                    <p className="font-bold text-base">{new Date(currentShift.startTime).toLocaleTimeString()}</p>
                                </div>
                                <div className="w-px h-8 bg-white/20 hidden sm:block"></div>
                                <div>
                                    <p className="text-indigo-100 text-[9px] font-black uppercase tracking-widest">Revenue (Live)</p>
                                    <p className="font-bold text-base">₹{currentShift.currentRevenue?.toLocaleString() || '0'}</p>
                                </div>
                                <div className="w-px h-8 bg-white/20 hidden sm:block"></div>
                                <div>
                                    <p className="text-indigo-100 text-[9px] font-black uppercase tracking-widest">Reconciliation</p>
                                    <p className="font-bold text-base">₹{currentShift.expectedCash?.toLocaleString() || '---'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 w-full lg:max-w-xs">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertCircle size={16} className="text-indigo-200" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Live Status</span>
                            </div>
                            <p className="text-xs leading-relaxed opacity-90 mb-4 font-medium">
                                All POS sales are being tracked. Reconcile cash at the end of the day.
                            </p>
                            <button 
                                onClick={() => setShowCloseModal(true)}
                                className="w-full py-3 bg-white text-indigo-600 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-indigo-50 transition-all shadow-lg"
                            >
                                Close Shift
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Shift History Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History size={18} className="text-indigo-600" />
                        <h3 className="text-sm font-black uppercase tracking-tight">Shift History</h3>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Staff</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Time Range</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Cash Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Revenue</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {shifts.length > 0 ? shifts.map((shift) => (
                                <tr key={shift._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-xs uppercase tracking-tight">{shift.user?.ownerName || 'User'}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    {new Date(shift.startTime).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                        {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {shift.endTime ? new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-black text-xs">₹{shift.closingCash?.toLocaleString() || '---'}</span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${
                                                shift.closingCash >= shift.expectedCash ? 'text-emerald-500' : 'text-rose-500'
                                            }`}>
                                                {shift.closingCash >= shift.expectedCash ? 'Balanced' : 'Shortage'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-xs text-indigo-600 dark:text-indigo-400">
                                        ₹{shift.totalSales?.toLocaleString() || '---'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
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
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No Shift History Found</td>
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
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <form onSubmit={handleOpenShift} className="p-8 space-y-6">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                                        <Clock size={24} />
                                    </div>
                                    <h2 className="text-xl font-black uppercase tracking-tight">Open Shift</h2>
                                    <p className="text-slate-500 text-xs font-medium">Verify opening cash to begin session.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Opening Cash (₹)</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-4 top-3.5 text-indigo-600" size={16} />
                                        <input 
                                            type="number"
                                            required
                                            value={openingCash}
                                            onChange={(e) => setOpeningCash(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3.5 pl-11 pr-4 text-lg font-black focus:ring-2 focus:ring-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => setShowOpenModal(false)}
                                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
                                    >
                                        Start Shift
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
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <form onSubmit={handleCloseShift} className="p-8 space-y-6">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-rose-600 rounded-xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-rose-500/20">
                                        <LogOut size={24} />
                                    </div>
                                    <h2 className="text-xl font-black uppercase tracking-tight">End Shift</h2>
                                    <p className="text-slate-500 text-xs font-medium">Reconcile total cash in drawer.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Closing Cash (₹)</label>
                                        <div className="relative">
                                            <Wallet className="absolute left-4 top-3.5 text-rose-600" size={16} />
                                            <input 
                                                type="number"
                                                required
                                                value={closingCash}
                                                onChange={(e) => setClosingCash(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3.5 pl-11 pr-4 text-lg font-black focus:ring-2 focus:ring-rose-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Notes (Optional)</label>
                                        <textarea 
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Shift summary..."
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-all h-20 resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => setShowCloseModal(false)}
                                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-500/20"
                                    >
                                        Finalize
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
