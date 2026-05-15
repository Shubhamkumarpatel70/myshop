import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
    Clock, Plus, LogOut, CheckCircle2, 
    AlertCircle, IndianRupee, History, 
    User, Calendar, ArrowRight, Wallet,
    ChevronDown, ChevronUp, Filter, CheckCircle,
    ArrowUpCircle, ArrowDownCircle, Banknote, ShieldCheck,
    TrendingUp, TrendingDown, ClipboardList
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
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    const fetchData = async () => {
        try {
            const [shiftsRes, currentRes] = await Promise.all([
                api.get(`/shifts?month=${selectedMonth}`),
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

    const getReconciliationStatus = (shift) => {
        if (!shift.closingCash || !shift.expectedCash) return { label: 'Pending', color: 'text-slate-400', diff: 0 };
        const diff = shift.closingCash - shift.expectedCash;
        if (Math.abs(diff) < 1) return { label: 'Balanced', color: 'text-emerald-500', icon: CheckCircle, diff: 0 };
        if (diff > 0) return { label: `+₹${diff.toLocaleString()}`, color: 'text-amber-500', icon: ArrowUpCircle, diff };
        return { label: `-₹${Math.abs(diff).toLocaleString()}`, color: 'text-rose-500', icon: ArrowDownCircle, diff };
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing Sessions...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                        <ClipboardList size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">Shift Control</h1>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Daily Cash Registry & Audit</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.25rem] px-4 py-2 shadow-sm">
                        <Calendar size={14} className="text-indigo-600 mr-2" />
                        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent text-xs font-bold outline-none dark:text-white" />
                    </div>
                    {!currentShift && (
                        <button onClick={() => setShowOpenModal(true)} className="bg-indigo-600 text-white px-6 py-3.5 rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
                            <Plus size={16} /> Open Drawer
                        </button>
                    )}
                </div>
            </div>

            {/* Current Active Shift */}
            {currentShift && (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-indigo-100 dark:border-indigo-500/20 shadow-2xl shadow-indigo-500/5 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-12">
                        <div className="lg:col-span-8 p-8 md:p-12 space-y-10">
                            <div className="flex items-center gap-3">
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                <span className="font-black uppercase tracking-widest text-xs text-slate-900 dark:text-white">Active Session Terminal</span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Opening Cash</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">₹{currentShift.openingCash.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">POS Sales</p>
                                    <p className="text-2xl font-black text-indigo-600">₹{currentShift.currentRevenue?.toLocaleString() || '0'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Expected Cash</p>
                                    <p className="text-2xl font-black text-emerald-600">₹{currentShift.expectedCash?.toLocaleString() || '---'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Drawer Health</p>
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 size={18} className="text-emerald-500" />
                                        <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Stable</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 pt-4">
                                <div className="flex items-center gap-2.5 px-5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <User size={14} className="text-indigo-500" />
                                    <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">Staff: {currentShift.user?.ownerName || 'Merchant'}</span>
                                </div>
                                <div className="flex items-center gap-2.5 px-5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <Clock size={14} className="text-indigo-500" />
                                    <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">Login: {new Date(currentShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 bg-indigo-600 p-8 md:p-12 text-white flex flex-col justify-center items-center text-center space-y-8">
                            <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-sm">
                                <Banknote size={40} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight">Reconcile Now</h3>
                                <p className="text-xs font-bold text-indigo-100 opacity-80 mt-2 uppercase tracking-widest leading-relaxed">Verify physical drawer contents to finalize session audit.</p>
                            </div>
                            <button onClick={() => setShowCloseModal(true)} className="w-full py-5 bg-white text-indigo-600 rounded-[1.25rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-all shadow-2xl shadow-black/10 active:scale-95">
                                Close & Finalize Shift
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reconciliation History Archive */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="px-8 py-7 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                        <History size={20} className="text-indigo-600" />
                        <h3 className="text-sm font-black uppercase tracking-widest">Registry Reconciliation Audit</h3>
                    </div>
                    <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600">{shifts.length} Sessions Logged</span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Session Info</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Opening</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Closing</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Net Settlement</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Net Profit/Loss</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {shifts.map((shift) => {
                                const reco = getReconciliationStatus(shift);
                                const RecoIcon = reco.icon || CheckCircle;
                                return (
                                    <tr key={shift._id} className="hover:bg-slate-50/30 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"><User size={18} /></div>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">{shift.user?.ownerName || 'User'}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                                        {new Date(shift.startTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} · 
                                                        {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → 
                                                        {shift.endTime ? new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="text-emerald-500">ACTIVE</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">₹{shift.openingCash.toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <p className="text-xs font-black text-slate-900 dark:text-white">₹{shift.closingCash?.toLocaleString() || '---'}</p>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <p className="text-sm font-black text-emerald-600">₹{shift.totalSales?.toLocaleString() || '0'}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Total Revenue</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="inline-flex flex-col items-end">
                                                <div className={`flex items-center gap-1.5 ${reco.color}`}>
                                                    <RecoIcon size={14} />
                                                    <span className="text-[11px] font-black uppercase tracking-widest">{reco.label}</span>
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Audit: {shift.status === 'Closed' ? 'Verified' : 'In-Progress'}</p>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showOpenModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOpenModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-white/5">
                            <form onSubmit={handleOpenShift} className="p-12 space-y-10">
                                <div className="text-center">
                                    <div className="w-24 h-24 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-indigo-500/30"><Wallet size={40} /></div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight">Open Drawer</h2>
                                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">Set your starting cash balance</p>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Physical Opening Cash (₹)</label>
                                    <div className="relative">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-600 font-black text-2xl">₹</div>
                                        <input type="number" required value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-[1.25rem] py-6 pl-14 pr-8 text-3xl font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all tabular-nums" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4 pt-4">
                                    <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-2xl shadow-indigo-500/30 transition-all active:scale-95">Initialize Shift Registry</button>
                                    <button type="button" onClick={() => setShowOpenModal(false)} className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-[9px] hover:text-slate-600 transition-colors">Discard & Close</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showCloseModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCloseModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-white/5">
                            <form onSubmit={handleCloseShift} className="p-12 space-y-10">
                                <div className="text-center">
                                    <div className="w-24 h-24 bg-rose-600 rounded-[1.25rem] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-rose-500/30"><Banknote size={40} /></div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Audit Drawer</h2>
                                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">Verify total physical cash present</p>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Actual Cash In Hand (₹)</label>
                                        <div className="relative">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-rose-600 font-black text-2xl">₹</div>
                                            <input type="number" required value={closingCash} onChange={(e) => setClosingCash(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-[1.25rem] py-6 pl-14 pr-8 text-3xl font-black outline-none focus:ring-2 focus:ring-rose-500 transition-all tabular-nums dark:text-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Audit Notes (Optional)</label>
                                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any discrepancies or reasons for shortage/excess?" className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[1.25rem] text-sm font-bold resize-none h-32 outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-all dark:text-white" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4 pt-4">
                                    <button type="submit" className="w-full py-6 bg-rose-600 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-xs hover:bg-rose-700 shadow-2xl shadow-rose-500/30 transition-all active:scale-95">Finalize Audit & Close</button>
                                    <button type="button" onClick={() => setShowCloseModal(false)} className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-[9px] hover:text-slate-600 transition-colors">Abort & Return</button>
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
