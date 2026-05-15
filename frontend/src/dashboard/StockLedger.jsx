import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
    History, Filter, Search, Calendar, 
    ArrowUpCircle, ArrowDownCircle, RefreshCcw,
    FileText, Package, Database, Tag, Download,
    TrendingUp, TrendingDown, ClipboardCheck,
    RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const StockLedger = () => {
    const [logs, setLogs] = useState([]);
    const [summary, setSummary] = useState({ totalInValue: 0, totalOutValue: 0, count: 0 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        product: '',
        action: '',
        month: new Date().toISOString().slice(0, 7) // YYYY-MM
    });

    useEffect(() => {
        fetchLogs();
    }, [page, filters.action, filters.month]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page,
                limit: 20,
                ...filters
            }).toString();
            const res = await api.get(`/products/logs?${queryParams}`);
            setLogs(res.data.data);
            setSummary(res.data.summary || { totalInValue: 0, totalOutValue: 0, count: 0 });
            setTotalPages(res.data.pagination.pages);
        } catch (error) {
            toast.error("Failed to fetch stock ledger");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (logs.length === 0) {
            toast.error("No data available to export");
            return;
        }

        const headers = ["Date", "Product", "Barcode", "Action", "Batch", "Qty Change", "Balance", "Price", "Reason"];
        const csvData = logs.map(log => [
            new Date(log.createdAt).toLocaleString(),
            log.product?.productName || 'Deleted Product',
            log.product?.barcode || 'N/A',
            log.action,
            log.batchNumber || '---',
            (log.newQuantity - log.previousQuantity),
            log.newQuantity,
            log.price || 0,
            log.reason || '---'
        ]);

        const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `stock_ledger_${filters.month}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Audit Exported Successfully");
    };

    const getActionStyle = (action) => {
        switch (action) {
            case 'Sale': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
            case 'Restock': 
            case 'Add': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
            case 'Return': return 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
            case 'Adjustment': return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
            default: return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
        }
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'Return': return <RotateCcw size={14} />;
            case 'Sale': return <TrendingDown size={14} />;
            case 'Restock': return <TrendingUp size={14} />;
            default: return <Package size={14} />;
        }
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <History size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Stock Ledger</h1>
                        <p className="text-xs font-medium text-slate-500">Complete historical record of all product movements.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex-1 md:flex-none flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm">
                        <Calendar size={14} className="text-slate-400 mr-2" />
                        <input 
                            type="month" 
                            value={filters.month}
                            onChange={(e) => setFilters({...filters, month: e.target.value})}
                            className="bg-transparent text-xs font-bold outline-none dark:text-white w-full"
                        />
                    </div>
                    <select 
                        value={filters.action}
                        onChange={(e) => setFilters({...filters, action: e.target.value})}
                        className="flex-1 md:flex-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold outline-none shadow-sm dark:text-white"
                    >
                        <option value="">ALL ACTIONS</option>
                        <option value="Sale">SALES</option>
                        <option value="Return">RETURNS</option>
                        <option value="Restock">RESTOCKS</option>
                        <option value="Adjustment">ADJUSTMENTS</option>
                    </select>
                    <button 
                        onClick={handleExport}
                        className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* Summary Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Value Inward</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">₹{summary.totalInValue.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                        <TrendingDown size={20} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Value Outward</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">₹{summary.totalOutValue.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                        <ClipboardCheck size={20} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Log Entries</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{summary.count}</p>
                    </div>
                </div>
                <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-lg shadow-indigo-500/20 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Database size={20} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/70">Net Stock Value</p>
                        <p className="text-xl font-black">₹{(summary.totalInValue - summary.totalOutValue).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Time</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Product Entry</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Batch Info</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Qty Change</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Price @ Log</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-10"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-slate-500 font-medium">
                                        No log entries found for this period.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-5">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                {new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </p>
                                            <p className="text-[10px] font-medium text-slate-400">
                                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                                    {getActionIcon(log.action)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{log.product?.productName || 'Deleted Product'}</p>
                                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">{log.product?.barcode || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getActionStyle(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Tag size={10} className="text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                                                        Batch: {log.batchNumber || '---'}
                                                    </span>
                                                </div>
                                                {log.expiryDate && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar size={10} className="text-rose-400" />
                                                        <span className="text-[9px] font-black text-rose-500 uppercase">
                                                            Exp: {new Date(log.expiryDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-1.5">
                                                    {log.newQuantity > log.previousQuantity ? (
                                                        <ArrowUpCircle size={14} className="text-emerald-500" />
                                                    ) : (
                                                        <ArrowDownCircle size={14} className="text-rose-500" />
                                                    )}
                                                    <span className={`text-sm font-black ${log.newQuantity > log.previousQuantity ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {log.newQuantity > log.previousQuantity ? '+' : ''}{log.newQuantity - log.previousQuantity}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                    Bal: {log.newQuantity}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <p className="text-sm font-black text-slate-900 dark:text-white">₹{log.price?.toLocaleString() || '---'}</p>
                                            <p className="text-[10px] font-medium text-slate-400 italic">{log.reason || 'No details'}</p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-500">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold disabled:opacity-50 transition-all dark:text-white"
                        >
                            PREVIOUS
                        </button>
                        <button 
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-all"
                        >
                            NEXT
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockLedger;
