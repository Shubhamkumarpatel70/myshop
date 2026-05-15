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
import Modal from '../components/Modal';

const AdminBarcodes = () => {
    const [barcodes, setBarcodes] = useState([]);
    const [shopStats, setShopStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState('summary');
    const [selectedBarcode, setSelectedBarcode] = useState(null);
    const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [barcodeRes, statsRes] = await Promise.all([
                api.get('/barcodes/admin'),
                api.get('/barcodes/admin/stats')
            ]);
            setBarcodes(barcodeRes.data.data);
            setShopStats(statsRes.data.data);
        } catch (error) {
            toast.error("Critical Failure: Data Link Broken");
        } finally {
            setLoading(false);
        }
    };

    const fetchBarcodes = () => fetchAllData();

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

    const filteredStats = shopStats.filter(s => 
        s.shopName.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <div className="flex gap-2">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mr-2">
                        <button 
                            onClick={() => setViewMode('summary')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'summary' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            Summary
                        </button>
                        <button 
                            onClick={() => setViewMode('all')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'all' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            All Data
                        </button>
                    </div>
                    <button 
                        onClick={fetchBarcodes}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} /> Refresh Data
                    </button>
                </div>
            </div>

            {/* tactical Control Bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={viewMode === 'summary' ? "Search by shop name..." : "Search by barcode, shop, or product name..."}
                            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {viewMode === 'all' && (
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
                    )}
                </div>
            </div>

            {viewMode === 'summary' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-48 rounded-[1.25rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-pulse"></div>
                        ))
                    ) : filteredStats.length > 0 ? (
                        filteredStats.map((shop) => (
                            <motion.div
                                key={shop._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-900 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm group hover:border-indigo-500/30 transition-all"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">{shop.shopName}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black uppercase tracking-widest text-slate-500">{shop.subscriptionPlan}</span>
                                            {shop.hasBarcodeAddon && (
                                                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-[9px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800 flex items-center gap-1">
                                                    <Zap size={10} /> Booster
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                        <Store size={20} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Active</p>
                                        <p className="text-xl font-black text-slate-900 dark:text-white">{shop.totalUsed}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Unlinked</p>
                                        <p className="text-xl font-black text-amber-600">{shop.unlinkedCount}</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => {
                                        setSearchTerm(shop.shopName);
                                        setViewMode('all');
                                    }}
                                    className="w-full h-11 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100 dark:border-slate-800 hover:border-indigo-200"
                                >
                                    View Full Protocol
                                </button>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <Tag size={40} className="mx-auto text-slate-200 mb-2" />
                            <p className="text-sm text-slate-500">No shop records found.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    {/* Table Section */}
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
                                            <button 
                                                onClick={() => {
                                                    setSelectedBarcode(b);
                                                    setIsBarcodeModalOpen(true);
                                                }}
                                                className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                                            >
                                                <BarcodeImage value={b.barcode} className="w-20 h-10 border border-slate-100" />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{b.barcode}</p>
                                                    <p className="text-[11px] font-medium text-slate-500">ID: {b._id.slice(-8).toUpperCase()}</p>
                                                </div>
                                            </button>
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
            )}

            {/* Identity Details Modal */}
            <Modal
                isOpen={isBarcodeModalOpen}
                onClose={() => setIsBarcodeModalOpen(false)}
                title="Identity Specification"
                className="max-w-xl"
            >
                {selectedBarcode && (
                    <div className="py-6 space-y-8">
                        <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-10 border border-slate-100 dark:border-slate-800 shadow-inner">
                            <BarcodeImage value={selectedBarcode.barcode} className="w-64 h-32 mb-6" />
                            <h3 className="text-3xl font-black tracking-widest text-slate-900 dark:text-white">{selectedBarcode.barcode}</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2">Global System Identifier</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Record ID</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">#{selectedBarcode._id.toUpperCase()}</p>
                            </div>
                            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Generation Time</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{formatDate(selectedBarcode.createdAt)}</p>
                            </div>
                        </div>

                        <div className="p-6 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Store size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Originating Shop</p>
                                    <p className="text-lg font-black">{selectedBarcode.shopName}</p>
                                </div>
                            </div>
                        </div>

                        {selectedBarcode.productName ? (
                            <div className="p-6 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600">
                                        <Box size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 opacity-80">Linked Asset</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white">{selectedBarcode.productName}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
                                <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No metadata linked to this identifier</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminBarcodes;
