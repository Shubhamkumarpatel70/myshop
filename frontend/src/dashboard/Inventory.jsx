import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api, { BASE_URL } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Filter, MoreVertical,
    Edit, Trash2, Package, AlertCircle,
    ArrowUpDown, Download, CreditCard,
    Image as ImageIcon, Upload, Camera, Scan, ShieldCheck, Box, Tag, Layers, RefreshCw, Zap,
    Clock, Calendar, ChevronRight
} from 'lucide-react';
import BarcodeImage from '../components/BarcodeImage';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import BarcodeScanner from '../components/BarcodeScanner';
import LimitModal from '../components/LimitModal';

const Inventory = () => {
    const { searchQuery } = useOutletContext() || { searchQuery: '' };
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (searchQuery !== undefined) {
            setSearchTerm(searchQuery);
        }
    }, [searchQuery]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [limitMetadata, setLimitMetadata] = useState({ type: 'product', isTrialUsed: false });
    const [editingProduct, setEditingProduct] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [unlinkedBarcodes, setUnlinkedBarcodes] = useState([]);
    const [showBarcodePicker, setShowBarcodePicker] = useState(false);
    const [formData, setFormData] = useState({
        productName: '',
        category: '',
        quantity: 0,
        price: 0,
        barcode: '',
        supplier: '',
        expiryDate: '',
        lowStockThreshold: 10,
        description: '',
        batchNumber: '',
        productImage: '',
        purchasePrice: 0
    });

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formDataUpload = new FormData();
        formDataUpload.append('image', file);
        setUploading(true);
        try {
            const res = await api.post('/products/upload', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, productImage: res.data.url }));
            toast.success("Asset Sync Successful");
        } catch (error) {
            toast.error("Handshake failed");
        } finally {
            setUploading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [prodRes, catRes, barcodeRes] = await Promise.all([
                api.get('/products'),
                api.get('/categories'),
                api.get('/barcodes/shop')
            ]);
            setProducts(prodRes.data.data);
            setCategories(catRes.data.data);
            setUnlinkedBarcodes(barcodeRes.data.data.filter(b => b.status === 'Generated'));
        } catch (error) {
            toast.error("Network sync failed");
        } finally {
            setLoading(false);
        }
    };

    const handleBarcodeLookup = async (barcode) => {
        if (!barcode || barcode.length < 5) return;
        try {
            const res = await api.get(`/barcodes/lookup/${barcode}`);
            if (res.data.success && res.data.data) {
                const { productName, productImage } = res.data.data;
                setFormData(prev => ({
                    ...prev,
                    productName: productName || prev.productName,
                    productImage: productImage || prev.productImage
                }));
                toast.success("Identity Detected: Details Pre-filled");
            }
        } catch (error) {
        }
    };

    const handleScanSuccess = (decodedText) => {
        setIsScannerOpen(false);
        setFormData(prev => ({ ...prev, barcode: decodedText }));
        handleBarcodeLookup(decodedText);
        toast.success("Uplink Successful: Barcode Synced");
    };

    const handleOpenModal = async (product = null) => {
        try {
            const res = await api.get('/barcodes/shop');
            setUnlinkedBarcodes(res.data.data.filter(b => b.status === 'Generated'));
        } catch (error) {
            console.error("Barcode sync failure");
        }

        if (product) {
            setEditingProduct(product);
            setFormData({
                productName: product.productName,
                category: product.category._id || product.category,
                quantity: product.quantity,
                price: product.price,
                barcode: product.barcode || '',
                supplier: product.supplier || '',
                expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
                lowStockThreshold: product.lowStockThreshold,
                description: product.description || '',
                batchNumber: '',
                productImage: product.productImage || '',
                purchasePrice: product.purchasePrice || 0
            });
        } else {
            setEditingProduct(null);
            setFormData({
                productName: '',
                category: categories[0]?._id || '',
                quantity: 0,
                price: 0,
                barcode: '',
                supplier: '',
                expiryDate: '',
                lowStockThreshold: 10,
                description: '',
                batchNumber: '',
                productImage: '',
                purchasePrice: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct._id}`, formData);
                toast.success("Inventory List Updated");
            } else {
                await api.post('/products', formData);
                toast.success("New Product Registered");
            }
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            if (error.response?.data?.errorCode === 'LIMIT_REACHED') {
                setLimitMetadata({ type: 'product', isTrialUsed: error.response.data.isTrialUsed });
                setIsLimitModalOpen(true);
            } else {
                toast.error(error.response?.data?.message || "Protocol Failure");
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Confirm decommissioning of this asset?")) {
            try {
                await api.delete(`/products/${id}`);
                toast.success("Asset Decommissioned");
                fetchData();
            } catch (error) {
                toast.error("Decommissioning failed");
            }
        }
    };

    const handleExport = () => {
        const headers = ["Product Name", "Category", "Quantity", "Selling Price", "Purchase Price", "Barcode", "Expiry Date"];
        const csvRows = [
            headers.join(','),
            ...products.map(p => [
                `"${p.productName}"`,
                `"${p.category?.name || 'N/A'}"`,
                p.quantity,
                p.price,
                p.purchasePrice || 0,
                `"${p.barcode || 'N/A'}"`,
                p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : 'N/A'
            ].join(','))
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [stockFilter, setStockFilter] = useState('all');

    const filteredProducts = products
        .filter(p => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = p.productName.toLowerCase().includes(searchLower) || 
                                 p.category?.name?.toLowerCase().includes(searchLower) || 
                                 p.barcode?.toLowerCase().includes(searchLower);

            const matchesStock = stockFilter === 'all' ? true :
                stockFilter === 'low' ? p.quantity <= p.lowStockThreshold :
                    stockFilter === 'out' ? p.quantity === 0 : true;
            return matchesSearch && matchesStock;
        })
        .sort((a, b) => {
            if (!sortConfig.key) return 0;
            const aVal = sortConfig.key === 'category' ? (a.category?.name || '') : a[sortConfig.key];
            const bVal = sortConfig.key === 'category' ? (b.category?.name || '') : b[sortConfig.key];
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    return (
        <div className="space-y-8 pb-10 font-jakarta px-1">
            {/* Warehouse Intelligence Header */}
            <div className="bg-white dark:bg-slate-900 rounded-[1.25rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Real-time Warehouse Intelligence</p>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                            Stock <span className="text-indigo-600">Inventory</span>
                        </h1>
                        <p className="text-slate-500 text-sm font-medium max-w-2xl leading-relaxed">
                            Complete catalog oversight with real-time health metrics, expiry tracking, and procurement automation.
                        </p>
                    </div>
                    <div className="flex w-full sm:w-auto gap-3">
                        <button
                            onClick={handleExport}
                            className="h-14 px-6 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] border border-slate-100 dark:border-slate-800 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                        >
                            <Download size={18} /> Export
                        </button>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex-1 sm:flex-none h-14 px-8 bg-indigo-600 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={20} /> New Product
                        </button>
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Identify product by name, category or identifier..."
                            className="w-full h-14 pl-16 pr-6 rounded-[1.25rem] bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                className="h-14 w-full sm:w-56 appearance-none rounded-[1.25rem] bg-slate-50 dark:bg-slate-800 border-none pl-12 pr-10 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none cursor-pointer focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                value={stockFilter}
                                onChange={(e) => setStockFilter(e.target.value)}
                            >
                                <option value="all">Metric: All Items</option>
                                <option value="low">Metric: Low Stock</option>
                                <option value="out">Metric: Depleted</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Asset Grid */}
            <div className="space-y-6">
                {/* Desktop Professional Ledger */}
                <div className="hidden lg:block overflow-hidden rounded-[1.25rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Product Specification</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Metric</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Expiry Tracking</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Price Points</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Health Status</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading ? [1, 2, 3, 4, 5].map(i => (
                                <tr key={i} className="animate-pulse"><td colSpan="7" className="px-8 py-10 bg-slate-50/5"></td></tr>
                            )) : filteredProducts.map((product) => (
                                <tr key={product._id} className="group transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 overflow-hidden rounded-[1.25rem] border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-105 transition-transform">
                                                {product.productImage ? (
                                                    <img src={product.productImage.startsWith('http') ? product.productImage : `${BASE_URL}${product.productImage}`} alt={product.productName} className="w-full h-full object-cover" />
                                                ) : <Box size={22} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[200px]">{product.productName}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{product.barcode || 'NO IDENTIFIER'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">{product.category?.name || 'GENERIC'}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{product.quantity}</p>
                                        <p className="mt-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">Units in Bin</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        {product.expiryDate ? (
                                            <div className="space-y-1">
                                                <p className={`text-sm font-black leading-none ${new Date(product.expiryDate) < new Date() ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                                                    {formatDate(product.expiryDate)}
                                                </p>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Expiration</p>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-black text-slate-300 uppercase italic">Lifetime Asset</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-black text-indigo-600 leading-none privacy-blur">₹{product.price}</p>
                                        <p className="mt-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">Margin Focus</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        {product.quantity <= product.lowStockThreshold ? (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-full border border-rose-100 w-fit">
                                                <AlertCircle size={12} />
                                                <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Stock Alert</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full border border-emerald-100 w-fit">
                                                <ShieldCheck size={12} />
                                                <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Optimal</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenModal(product)} className="w-10 h-10 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-[1.25rem] flex items-center justify-center transition-all border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 shadow-sm">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(product._id)} className="w-10 h-10 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 rounded-[1.25rem] flex items-center justify-center transition-all border border-slate-100 dark:border-slate-800 hover:border-rose-500/30 shadow-sm">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Agile View */}
                <div className="lg:hidden grid grid-cols-1 gap-5">
                    {loading ? [1, 2, 3].map(i => (
                        <div key={i} className="h-52 bg-white dark:bg-slate-900 rounded-[1.25rem] animate-pulse" />
                    )) : filteredProducts.map(product => (
                        <div key={product._id} className="bg-white dark:bg-slate-900 p-8 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 shadow-sm relative group">
                            <div className="flex gap-6 mb-6">
                                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-[1.25rem] border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-indigo-600 shadow-sm">
                                    {product.productImage ? (
                                        <img src={product.productImage.startsWith('http') ? product.productImage : `${BASE_URL}${product.productImage}`} alt={product.productName} className="w-full h-full object-cover" />
                                    ) : <Box size={28} />}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex justify-between items-start">
                                        <p className="text-base font-black text-slate-900 dark:text-white truncate pr-4 uppercase">{product.productName}</p>
                                        <p className="text-base font-black text-indigo-600 privacy-blur">₹{product.price}</p>
                                    </div>
                                    <span className="inline-block mt-3 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 dark:bg-slate-800 px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-800 w-fit">{product.category?.name || 'GENERIC'}</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-50 dark:border-slate-800">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">{product.quantity}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Expiry</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">{product.expiryDate ? formatDate(product.expiryDate) : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <span className={`text-[10px] font-black uppercase ${product.quantity <= product.lowStockThreshold ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {product.quantity <= product.lowStockThreshold ? 'Critical' : 'Healthy'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: {product.barcode || 'N/A'}</p>
                                <div className="flex gap-3">
                                    <button onClick={() => handleOpenModal(product)} className="w-11 h-11 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-[1.25rem] flex items-center justify-center border border-slate-100 shadow-sm"><Edit size={18} /></button>
                                    <button onClick={() => handleDelete(product._id)} className="w-11 h-11 bg-rose-50 text-rose-600 rounded-[1.25rem] flex items-center justify-center border border-rose-100 shadow-sm"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Product Configuration Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Modify Asset' : 'Register Asset'} className="max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-8 py-4">
                    <div className="grid grid-cols-1 gap-8 rounded-[1.25rem] border border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-800/40 sm:grid-cols-[200px_1fr]">
                        <div className="relative mx-auto">
                            <div className="relative h-48 w-48 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                {formData.productImage ? (
                                    <img src={formData.productImage.startsWith('http') ? formData.productImage : `${BASE_URL}${formData.productImage}`} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="grid h-full place-items-center text-slate-200"><ImageIcon size={48} /></div>
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 grid place-items-center bg-white/80 backdrop-blur-sm">
                                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 absolute -bottom-4 left-1/2 -translate-x-1/2">
                                <label className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-[1.25rem] bg-white border border-slate-200 text-indigo-600 shadow-lg hover:bg-slate-50 transition-all">
                                    <Upload size={18} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                                <label className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-[1.25rem] bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all">
                                    <Camera size={18} />
                                    <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
                                </label>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center space-y-3">
                            <h4 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Asset Identity</h4>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">Assign a visual identifier to this product. High-quality imagery improves catalog navigation and cashier efficiency.</p>
                            <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                                <Zap size={14} /> AI Recognition Active
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Designation</label>
                            <input type="text" required placeholder="e.g. Premium Cotton Shirt" className="h-14 w-full rounded-[1.25rem] border border-slate-200 bg-white px-5 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-white" value={formData.productName} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Logical Category</label>
                            <div className="relative">
                                <select required className="h-14 w-full rounded-[1.25rem] border border-slate-200 bg-white px-5 text-sm font-bold outline-none focus:border-indigo-500 appearance-none dark:border-slate-800 dark:bg-slate-900 dark:text-white" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="">Select Domain</option>
                                    {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                </select>
                                <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={18} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bin Quantity</label>
                            <input type="number" required className="h-14 w-full rounded-[1.25rem] border border-slate-200 bg-white px-5 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-white" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Threshold Alert</label>
                            <input type="number" required className="h-14 w-full rounded-[1.25rem] border border-slate-200 bg-white px-5 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-white" value={formData.lowStockThreshold} onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sale Valuation (₹)</label>
                            <input type="number" required className="h-14 w-full rounded-[1.25rem] border border-slate-200 bg-white px-5 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-white" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Procurement Cost (₹)</label>
                            <input type="number" required className="h-14 w-full rounded-[1.25rem] border border-slate-200 bg-white px-5 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-white" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })} />
                        </div>
                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Global Identifier (Barcode)</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Scan or Type"
                                        className="h-14 w-full rounded-[1.25rem] border border-slate-200 bg-white px-5 pr-12 text-sm font-bold outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        value={formData.barcode}
                                        onChange={(e) => {
                                            setFormData({ ...formData, barcode: e.target.value });
                                            if (e.target.value.length >= 10) handleBarcodeLookup(e.target.value);
                                        }}
                                    />
                                    <Tag className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                </div>
                                <button type="button" onClick={() => setShowBarcodePicker(!showBarcodePicker)} className="h-14 w-14 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-[1.25rem] border border-slate-100 dark:border-slate-700 text-indigo-600 shadow-sm" title="Vault">
                                    <Layers size={20} />
                                </button>
                                <button type="button" onClick={() => setIsScannerOpen(true)} className="h-14 w-14 flex items-center justify-center bg-indigo-600 rounded-[1.25rem] text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700" title="Vision">
                                    <Scan size={20} />
                                </button>
                            </div>

                            <AnimatePresence>
                                {showBarcodePicker && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute z-50 mt-4 w-full max-h-64 overflow-y-auto rounded-[1.25rem] border border-slate-100 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                                    >
                                        <div className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 mb-2">Identifier Vault</div>
                                        {unlinkedBarcodes.length > 0 ? (
                                            unlinkedBarcodes.map(bc => (
                                                <button
                                                    key={bc._id}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, barcode: bc.barcode });
                                                        setShowBarcodePicker(false);
                                                    }}
                                                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-indigo-500/10 transition-colors"
                                                >
                                                    <span>{bc.barcode}</span>
                                                    <span className="text-[8px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">Ready</span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="py-10 text-center space-y-2">
                                                <AlertCircle size={24} className="mx-auto text-slate-200" />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Vault is Empty</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asset Expiration</label>
                            <div className="relative">
                                <input type="date" className="h-14 w-full rounded-[1.25rem] border border-slate-200 bg-white px-5 text-sm font-bold outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
                                <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="h-14 rounded-[1.25rem] border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Cancel Operation</button>
                        <button type="submit" className="h-14 rounded-[1.25rem] bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all">{editingProduct ? 'Commit Changes' : 'Confirm Entry'}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="Vision Uplink" className="max-w-lg">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 mb-6">
                    <p className="text-xs font-medium text-slate-500 text-center leading-relaxed">Position the barcode within the viewport for synchronization.</p>
                </div>
                <BarcodeScanner isOpen={isScannerOpen} onScanSuccess={handleScanSuccess} onScanError={(err) => console.error(err)} />
            </Modal>

            <LimitModal isOpen={isLimitModalOpen} onClose={() => setIsLimitModalOpen(false)} limitType={limitMetadata.type} isTrialUsed={limitMetadata.isTrialUsed} />
        </div>
    );
};

export default Inventory;
