import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { 
    Tag, Search, Filter, ArrowUpDown, 
    Calendar, Store, User, Box, 
    RefreshCcw, AlertCircle, CheckCircle2 
} from 'lucide-react';
import BarcodeImage from '../components/BarcodeImage';
import toast from 'react-hot-toast';

const AdminBarcodes = () => {
    const [barcodes, setBarcodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchBarcodes();
    }, []);

    const fetchBarcodes = async () => {
        try {
            const res = await api.get('/barcodes/admin');
            setBarcodes(res.data.data);
        } catch (error) {
            toast.error("Critical Failure: Data Link Broken");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredBarcodes = barcodes.filter(b => {
        const matchesSearch = 
            b.barcode.includes(searchTerm) || 
            b.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.productName?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filterStatus === 'all' ? true : b.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 pb-10 font-jakarta">
            {/* Header Section */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600">
                        <Tag size={14} /> Global Identification Registry
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Barcode <span className="text-indigo-600">Protocol</span>
                    </h1>
                    <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                        Centralized tracking of all product identifiers and global metadata generated across the platform.
                    </p>
                </div>
                <button 
                    onClick={fetchBarcodes}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} /> Refresh Data
                </button>
            </div>

            {/* tactical Control Bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by barcode, shop, or product name..."
                            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select 
                            className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="Generated">Generated</option>
                            <option value="Linked">Linked</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Identity Details</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Origin / Shop</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Metadata</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Generated On</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-8 h-16 bg-slate-50/20 dark:bg-slate-800/10"></td>
                                    </tr>
                                ))
                            ) : filteredBarcodes.length > 0 ? (
                                filteredBarcodes.map((b) => (
                                    <tr key={b._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <BarcodeImage value={b.barcode} className="w-20 h-10 border border-slate-100" />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{b.barcode}</p>
                                                    <p className="text-[11px] font-medium text-slate-500">ID: {b._id.slice(-8).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                    <Store size={14} className="text-slate-400" /> {b.shopName}
                                                </p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                                    <User size={14} className="text-slate-400" /> {b.user?.ownerName || 'Unknown'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {b.productName ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100">
                                                        {b.productImage ? (
                                                            <img src={b.productImage} alt="" className="h-full w-full object-cover" />
                                                        ) : <Box size={14} className="m-auto mt-2 text-slate-400" />}
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                                                        {b.productName}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs italic text-slate-400">No metadata linked</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {b.status === 'Linked' ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                    <CheckCircle2 size={12} /> Linked
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                                                    <AlertCircle size={12} /> Generated
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                                <Calendar size={14} className="text-slate-400" /> {formatDate(b.createdAt)}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Tag size={40} className="text-slate-200 dark:text-slate-800" />
                                            <p className="text-sm text-slate-500">No barcode records found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminBarcodes;
