import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import {
    Download, Printer, Plus, Trash2, CreditCard,
    ShieldCheck, Upload, Zap, QrCode, ExternalLink,
    AlertCircle, CheckCircle2, Tag, Search, Calendar
} from 'lucide-react';
import BarcodeImage from '../components/BarcodeImage';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const ShopBarcodes = () => {
    const { user } = useAuth();
    const [barcodes, setBarcodes] = useState([]);
    const [usage, setUsage] = useState({ used: 0, limit: 30, isUnlimited: false });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [booster, setBooster] = useState({ status: 'None', rejectReason: '' });

    // Booster Modal States
    const [isBoosterModalOpen, setIsBoosterModalOpen] = useState(false);
    const [screenshot, setScreenshot] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        fetchBarcodes();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            setSettings(res.data.data);
        } catch (error) {
            console.error('Failed to load settings', error);
        }
    };

    const fetchBarcodes = async () => {
        try {
            const res = await api.get('/barcodes/shop');
            setBarcodes(res.data.data);
            if (res.data.usage) setUsage(res.data.usage);
            if (res.data.booster) setBooster(res.data.booster);
        } catch (error) {
            toast.error("Network Link Failure");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!usage.isUnlimited && usage.used >= usage.limit) {
            toast.error("Limit Quota Limit is Over");
            return;
        }
        try {
            const res = await api.post('/barcodes/generate');
            if (res.data.success) {
                toast.success("New Barcode Signal Generated");
                fetchBarcodes();
            }
        } catch (error) {
            toast.error("Limit Quota Limit is Over");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this barcode? This cannot be undone.")) return;
        try {
            const res = await api.delete(`/barcodes/${id}`);
            if (res.data.success) {
                toast.success("Barcode Deleted Successfully");
                fetchBarcodes(); // Refresh both list and usage count
            }
        } catch (error) {
            toast.error("Deletion Protocol Failed");
        }
    };

    const handleScreenshotUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('/products/upload', formData);
            setScreenshot(res.data.url);
            toast.success('Payment screenshot uploaded');
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmitBooster = async () => {
        if (!screenshot) {
            toast.error('Please upload payment screenshot');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/subscriptions/request-addon', {
                addon: 'Barcode Booster',
                screenshot,
            });

            if (res.data.success) {
                toast.success('Booster request submitted for audit');
                setIsBoosterModalOpen(false);
                setScreenshot(null);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to submit request');
        } finally {
            setSubmitting(false);
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
        const barcodeElement = document.querySelector(`[data-barcode="${barcode.barcode}"]`);
        const svgContent = barcodeElement ? barcodeElement.querySelector('svg')?.innerHTML : '';

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
                        <svg viewBox="0 0 95 50" class="barcode-svg">${svgContent}</svg>
                        <div class="barcode-num">${barcode.barcode}</div>
                        ${barcode.productName ? `<div class="product-name">${barcode.productName}</div>` : ''}
                        <div class="shop-tag">STOCKSAATHI RETAIL OS</div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();

        // CSP compliant print trigger
        const triggerPrint = () => {
            if (printWindow && !printWindow.closed) {
                printWindow.print();
                printWindow.close();
            }
        };

        printWindow.onload = () => setTimeout(triggerPrint, 500);
        setTimeout(triggerPrint, 1500);
    };

    const handlePrintAll = () => {
        const printWindow = window.open('', '_blank');
        const labelsHtml = filteredBarcodes.filter(b => b.status === 'Linked').map(barcode => {
            const barcodeElement = document.querySelector(`[data-barcode="${barcode.barcode}"]`);
            const svgContent = barcodeElement ? barcodeElement.querySelector('svg')?.innerHTML : '';
            return `
                <div class="barcode-card">
                    <svg viewBox="0 0 95 50" style="width: 100%; height: auto; max-height: 20mm;">${svgContent}</svg>
                    <div class="barcode-num">${barcode.barcode}</div>
                    ${barcode.productName ? `<div class="product-name">${barcode.productName}</div>` : ''}
                    <div class="shop-tag">STOCKSAATHI RETAIL OS</div>
                </div>
            `;
        }).join('');

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
                        .barcode-num { margin-top: 2mm; font-size: 12pt; font-weight: 900; letter-spacing: 0.5mm; color: #000; }
                        .product-name { margin-top: 1mm; font-size: 8pt; font-weight: 700; color: #475569; text-transform: uppercase; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; }
                        .shop-tag { margin-top: 2mm; font-size: 6pt; font-weight: 900; color: #94a3b8; letter-spacing: 1pt; }
                    </style>
                </head>
                <body>
                    <div class="grid-container">
                        ${labelsHtml}
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();

        // CSP compliant print trigger
        const triggerPrint = () => {
            if (printWindow && !printWindow.closed) {
                printWindow.print();
                printWindow.close();
            }
        };

        printWindow.onload = () => setTimeout(triggerPrint, 500);
        setTimeout(triggerPrint, 1500);
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
                        disabled={!usage.isUnlimited && usage.used >= usage.limit}
                        className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white shadow-lg transition-all ${(!usage.isUnlimited && usage.used >= usage.limit) ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'}`}
                    >
                        <Plus size={18} /> Generate Identifier
                    </button>
                    {!usage.isUnlimited && usage.used >= usage.limit && (
                        <button
                            onClick={() => setIsBoosterModalOpen(true)}
                            disabled={booster.status === 'Pending'}
                            className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white shadow-lg transition-all ${booster.status === 'Pending' ? 'bg-amber-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'}`}
                        >
                            <CreditCard size={18} /> {booster.status === 'Pending' ? 'Booster Pending...' : 'Add Barcode Booster'}
                        </button>
                    )}
                </div>

            {/* Booster Protocol Status Section */}
            {(booster.status === 'Pending' || booster.status === 'Rejected' || usage.isUnlimited) && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 gap-4"
                >
                    {booster.status === 'Pending' && (
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-6 flex items-center gap-6 shadow-sm">
                            <div className="w-12 h-12 bg-amber-200 dark:bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0 animate-pulse">
                                <Zap size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Booster Synchronization In Progress</h4>
                                <p className="text-sm font-bold text-amber-600 dark:text-amber-500/80 mt-1">
                                    Our administrative team is verifying your identity signal. Unlimited access will be granted shortly.
                                </p>
                            </div>
                        </div>
                    )}

                    {booster.status === 'Rejected' && (
                        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-6 flex items-center gap-6 shadow-sm">
                            <div className="w-12 h-12 bg-rose-200 dark:bg-rose-500/20 rounded-xl flex items-center justify-center text-rose-700 dark:text-rose-400 shrink-0">
                                <AlertCircle size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black uppercase tracking-widest text-rose-700 dark:text-rose-400">Booster Identity Rejected</h4>
                                <p className="text-sm font-bold text-rose-600 dark:text-rose-500/80 mt-1">
                                    Reason: <span className="italic font-black text-rose-700 dark:text-rose-300">"{booster.rejectReason || 'Invalid proof provided.'}"</span>
                                </p>
                                <button 
                                    onClick={() => setIsBoosterModalOpen(true)}
                                    className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-2 font-bold"
                                >
                                    Resubmit Payment Screenshot <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {usage.isUnlimited && (
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 flex items-center gap-6 shadow-sm">
                            <div className="w-12 h-12 bg-emerald-200 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                                <ShieldCheck size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Unlimited Barcode Protocol Active</h4>
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-500/80 mt-1 font-bold">
                                    Identity generation limits have been removed. Use unlimited barcodes for your shop's inventory ecosystem.
                                </p>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
            </div>

            {/* Quota Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Capacity</p>
                    <h3 className="text-2xl font-black">{usage.isUnlimited ? '∞ Unlimited' : usage.limit}</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Identities Used</p>
                    <h3 className="text-2xl font-black text-indigo-600">{usage.used}</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Available Slots</p>
                    <h3 className={`text-2xl font-black ${(!usage.isUnlimited && usage.limit - usage.used <= 5) ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {usage.isUnlimited ? '∞' : Math.max(0, usage.limit - usage.used)}
                    </h3>
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

            {/* Barcode Booster Modal */}
            <Modal 
                isOpen={isBoosterModalOpen} 
                onClose={() => setIsBoosterModalOpen(false)} 
                title="Activate Barcode Booster" 
                className="max-w-4xl"
            >
                <div className="py-6 space-y-10">
                    <div className="rounded-3xl border-2 border-emerald-100 bg-emerald-50/50 p-6 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                        <div className="flex items-center gap-4 text-emerald-700 dark:text-emerald-300">
                            <ShieldCheck size={24} />
                            <div>
                                <p className="text-lg font-black uppercase tracking-tight leading-tight">Barcode Booster Activation</p>
                                <p className="text-xs font-bold opacity-80 mt-1">
                                    Need more identifiers without upgrading your entire plan? Get unlimited barcode generation for your shop with our standalone booster.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Left Side: Payment Details */}
                        <div className="space-y-8">
                            <div className="rounded-[2.5rem] bg-indigo-600 p-8 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">One-time Activation Fee</p>
                                <h3 className="mt-2 font-outfit text-6xl font-black tracking-tighter">₹499</h3>
                                <div className="mt-8 p-4 bg-white/10 backdrop-blur-md rounded-[1.25rem] border border-white/10 flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Merchant ID</p>
                                        <p className="font-bold text-sm">{settings?.upiId || 'stocksaathi@upi'}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(settings?.upiId || 'stocksaathi@upi');
                                            toast.success('Merchant ID Copied');
                                        }}
                                        className="p-2.5 bg-white text-indigo-600 rounded-[1.25rem] hover:scale-110 transition-all shadow-lg"
                                    >
                                        <ExternalLink size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] ml-4">Payment Proof</label>
                                <div className="relative group rounded-[1.25rem] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden min-h-[220px] transition-all hover:border-indigo-500">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="absolute inset-0 cursor-pointer opacity-0 z-10" 
                                        onChange={handleScreenshotUpload} 
                                        disabled={uploading} 
                                    />
                                    {screenshot ? (
                                        <img src={screenshot} alt="Payment proof" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-[1.25rem] flex items-center justify-center mb-4 shadow-sm">
                                                <Upload size={28} />
                                            </div>
                                            <p className="text-xs font-bold uppercase tracking-widest">Upload Screenshot</p>
                                        </div>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-sm dark:bg-slate-900/70 z-20">
                                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Side: QR Code & Steps */}
                        <div className="space-y-8">
                            <div className="bg-slate-950 rounded-[3rem] p-8 flex flex-col items-center text-white relative shadow-2xl">
                                <div className="w-full aspect-square max-w-[200px] bg-white rounded-[2rem] p-4 flex items-center justify-center mb-6 shadow-2xl">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${settings?.upiId || 'stocksaathi@upi'}&pn=StockSaathi&am=499&cu=INR`)}`} 
                                        alt="Payment QR" 
                                        className="w-full h-full object-contain" 
                                    />
                                </div>
                                <h4 className="text-lg font-black uppercase tracking-tight">Scan to Pay</h4>
                            </div>

                            <button
                                onClick={handleSubmitBooster}
                                disabled={submitting || !screenshot}
                                className="w-full h-18 bg-indigo-600 text-white rounded-[1.25rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                            >
                                {submitting ? 'Processing...' : <><Zap size={20} /> Request Booster</>}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ShopBarcodes;
