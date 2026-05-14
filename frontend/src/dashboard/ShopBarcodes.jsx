import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import {
    Tag, Search, Filter,
    Calendar, Box, RefreshCw,
    Download, Printer, Plus, Trash2
} from 'lucide-react';
import BarcodeImage from '../components/BarcodeImage';
import toast from 'react-hot-toast';

const ShopBarcodes = () => {
    const [barcodes, setBarcodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchBarcodes();
    }, []);

    const fetchBarcodes = async () => {
        try {
            const res = await api.get('/barcodes/shop');
            setBarcodes(res.data.data);
        } catch (error) {
            toast.error("Network Link Failure");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        try {
            const res = await api.post('/barcodes/generate');
            if (res.data.success) {
                toast.success("New Barcode Signal Generated");
                fetchBarcodes();
            }
        } catch (error) {
            toast.error("Generation Protocol Failure");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this barcode? This cannot be undone.")) return;
        try {
            const res = await api.delete(`/barcodes/${id}`);
            if (res.data.success) {
                toast.success("Identity Purged Successfully");
                setBarcodes(barcodes.filter(b => b._id !== id));
            }
        } catch (error) {
            toast.error("Deletion Protocol Failed");
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const filteredBarcodes = barcodes.filter(b => {
        const matchesSearch = b.barcode.includes(searchTerm) ||
            b.productName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' ? true : b.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handlePrint = (barcode) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Label - ${barcode.barcode}</title>
                    <style>
                        @page { size: auto; margin: 0; }
                        body { margin: 10mm; font-family: 'Inter', sans-serif; background: white; }
                        .barcode-card { 
                            width: 60mm; 
                            padding: 5mm; 
                            border: 1px solid #e2e8f0; 
                            border-radius: 4mm; 
                            text-align: center;
                            page-break-inside: avoid;
                        }
                        .barcode-svg { width: 100%; height: auto; max-height: 25mm; }
                        .barcode-num { margin-top: 2mm; font-size: 14pt; font-weight: 900; letter-spacing: 1mm; color: #000; }
                        .product-name { margin-top: 1mm; font-size: 10pt; font-weight: 700; color: #475569; text-transform: uppercase; }
                        .shop-tag { margin-top: 3mm; font-size: 7pt; font-weight: 900; color: #94a3b8; letter-spacing: 1pt; }
                    </style>
                </head>
                <body>
                    <div class="barcode-card">
                        <div id="barcode-target"></div>
                        <div class="barcode-num">${barcode.barcode}</div>
                        ${barcode.productName ? `<div class="product-name">${barcode.productName}</div>` : ''}
                        <div class="shop-tag">STOCKSAATHI RETAIL OS</div>
                    </div>
                    <script>
                        const svg = \`${document.querySelector(`[data-barcode="${barcode.barcode}"]`)?.innerHTML}\`;
                        document.getElementById('barcode-target').innerHTML = '<svg viewBox="0 0 94 50" class="barcode-svg">' + svg + '</svg>';
                        window.onload = () => { 
                            setTimeout(() => {
                                window.print(); 
                                window.close();
                            }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handlePrintAll = () => {
        const printWindow = window.open('', '_blank');
        const labelsHtml = filteredBarcodes.filter(b => b.status === 'Linked').map(barcode => `
            <div class="barcode-card">
                <div class="barcode-svg-container" data-bc="${barcode.barcode}">${document.querySelector(`[data-barcode="${barcode.barcode}"]`)?.innerHTML || ''}</div>
                <div class="barcode-num">${barcode.barcode}</div>
                ${barcode.productName ? `<div class="product-name">${barcode.productName}</div>` : ''}
                <div class="shop-tag">STOCKSAATHI RETAIL OS</div>
            </div>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Batch - ${new Date().toLocaleDateString()}</title>
                    <style>
                        @page { size: A4; margin: 10mm; }
                        body { margin: 0; font-family: 'Inter', sans-serif; background: white; }
                        .grid-container { 
                            display: grid; 
                            grid-template-columns: repeat(3, 1fr); 
                            gap: 5mm; 
                        }
                        .barcode-card { 
                            padding: 5mm; 
                            border: 1px solid #e2e8f0; 
                            border-radius: 4mm; 
                            text-align: center;
                            page-break-inside: avoid;
                        }
                        .barcode-svg-container svg { width: 100%; height: auto; max-height: 20mm; }
                        .barcode-num { margin-top: 2mm; font-size: 12pt; font-weight: 900; letter-spacing: 0.5mm; color: #000; }
                        .product-name { margin-top: 1mm; font-size: 8pt; font-weight: 700; color: #475569; text-transform: uppercase; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; }
                        .shop-tag { margin-top: 2mm; font-size: 6pt; font-weight: 900; color: #94a3b8; letter-spacing: 1pt; }
                    </style>
                </head>
                <body>
                    <div class="grid-container">
                        ${labelsHtml}
                    </div>
                    <script>
                        window.onload = () => { 
                            setTimeout(() => {
                                window.print(); 
                                window.close();
                            }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6 pb-10 font-jakarta">
            {/* Header Section */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600">
                        <Tag size={14} /> Identity Management
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Barcode <span className="text-indigo-600">Inventory</span>
                    </h1>
                    <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                        Manage your shop's unique identifiers and generate new barcodes for your stock.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleGenerate}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={18} /> Generate New
                    </button>
                </div>
            </div>

            {/* Tactical Control Bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search barcodes or product names..."
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
                            <option value="all">All Identifiers</option>
                            <option value="Linked">Linked Products</option>
                            <option value="Generated">Available (Unlinked)</option>
                        </select>
                        <button
                            onClick={handlePrintAll}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <Printer size={18} /> Print All
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid Layout for Barcodes */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {loading ? (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"></div>
                    ))
                ) : filteredBarcodes.length > 0 ? (
                    filteredBarcodes.map((b) => (
                        <motion.div
                            key={b._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div data-barcode={b.barcode}>
                                    <BarcodeImage value={b.barcode} className="w-32 h-16" />
                                </div>
                                <div className="text-right">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${b.status === 'Linked' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10'}`}>
                                        {b.status}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-lg font-black tracking-wider text-slate-900 dark:text-white">{b.barcode}</p>
                                <p className="text-sm font-medium text-slate-500 truncate">
                                    {b.productName || "No Product Linked"}
                                </p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    <Calendar size={12} /> {formatDate(b.createdAt)}
                                </span>
                                <div className="flex gap-2">
                                    {b.status === 'Linked' && (
                                        <button
                                            onClick={() => handlePrint(b)}
                                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors"
                                            title="Print Barcode"
                                        >
                                            <Printer size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(b._id)}
                                        className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                                        title="Delete Barcode"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <Tag size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-800" />
                        <p className="text-slate-500">No barcodes found. Generate your first one above!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopBarcodes;
