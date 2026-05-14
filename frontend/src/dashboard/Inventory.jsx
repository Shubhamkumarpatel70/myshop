import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api, { BASE_URL } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Filter, MoreVertical,
    Edit, Trash2, Package, AlertCircle,
    ArrowUpDown, Download, CreditCard,
    Image as ImageIcon, Upload, Camera, Scan, ShieldCheck, Box, Tag, Layers, RefreshCw, Zap
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
            toast.success("Digital Asset Synchronized");
        } catch (error) {
            toast.error("Handshake failed during upload");
        } finally {
            setUploading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
    };

    const [selectedProductBatches, setSelectedProductBatches] = useState(null);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

    const sortedBatches = selectedProductBatches?.batches ? [...selectedProductBatches.batches].sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate) - new Date(b.expiryDate);
    }) : [];

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
            toast.error("Network synchronization failed");
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
                toast.success("Identity Found: Details Auto-filled");
            }
        } catch (error) {
            // Silently fail if not found, it's a new product
        }
    };

    const handleGenerateBarcode = async () => {
        try {
            const res = await api.post('/barcodes/generate');
            if (res.data.success) {
                setFormData(prev => ({ ...prev, barcode: res.data.barcode }));
                toast.success("Signal Generated: New Barcode Assigned");
            }
        } catch (error) {
            toast.error("Signal failure during generation");
        }
    };

    const handleScanSuccess = (decodedText) => {
        setIsScannerOpen(false);
        setFormData(prev => ({ ...prev, barcode: decodedText }));
        handleBarcodeLookup(decodedText);
        toast.success("Uplink Successful: Barcode Synced");
    };

    const handleOpenModal = async (product = null) => {
        // Refresh available barcodes
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
                toast.success("Asset Manifest Updated");
            } else {
                await api.post('/products', formData);
                toast.success("New Product Added");
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
        a.setAttribute('download', `inventory_manifest_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const [stockFilter, setStockFilter] = useState('all');

    const filteredProducts = products
        .filter(p => {
            const searchLower = searchTerm.toLowerCase();
            const matchesName = p.productName.toLowerCase().includes(searchLower);
            const matchesCategory = p.category?.name?.toLowerCase().includes(searchLower);
            const matchesBarcode = p.barcode?.toLowerCase().includes(searchLower);
            const matchesBatch = p.batches?.some(b => b.batchNumber?.toLowerCase().includes(searchLower));

            const matchesSearch = matchesName || matchesCategory || matchesBarcode || matchesBatch;

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
        <div className="space-y-6 pb-10 font-jakarta">
            {/* Header with High-Contrast Typography */}
            {/* Inventory Command Center */}
            {/* Simplified Inventory Header */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-slate-100 dark:border-slate-800 shadow-sm mb-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                            Stock <span className="text-indigo-600">Inventory</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                            Real-time Warehouse Intelligence
                        </p>
                    </div>
                    <div className="flex w-full sm:w-auto gap-3">
                        <button
                            onClick={handleExport}
                            className="h-14 px-6 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-slate-100 dark:border-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                        >
                            <Download size={18} /> Export
                        </button>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex-1 sm:flex-none h-14 px-8 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={20} /> Add Product
                        </button>
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, category or barcode..."
                            className="w-full h-14 md:h-16 pl-16 pr-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm md:text-base outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 sm:flex-none">
                            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                className="h-14 md:h-16 w-full sm:w-52 appearance-none rounded-2xl bg-slate-50 dark:bg-slate-800 border-none pl-12 pr-10 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                value={stockFilter}
                                onChange={(e) => setStockFilter(e.target.value)}
                            >
                                <option value="all">Status: All Stock</option>
                                <option value="low">Status: Low Stock</option>
                                <option value="out">Status: Out of Stock</option>
                            </select>
                        </div>
                        <div className="relative flex-1 sm:flex-none">
                            <ArrowUpDown className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                className="h-14 md:h-16 w-full sm:w-52 appearance-none rounded-2xl bg-slate-50 dark:bg-slate-800 border-none pl-12 pr-10 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                onChange={(e) => handleSort(e.target.value)}
                            >
                                <option value="">Sort: Default</option>
                                <option value="productName">Sort: Name</option>
                                <option value="quantity">Sort: Stock</option>
                                <option value="price">Sort: Price</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Table/Cards */}
            <div className="space-y-4">
                {/* Desktop/Tablet Table View */}
                <div className="hidden md:block overflow-x-auto rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Product Specification</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Metric</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Price Points</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Health Status</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? [1, 2, 3, 4, 5].map(i => (
                                <tr key={i} className="animate-pulse"><td colSpan="6" className="px-8 py-10 h-24 bg-slate-50/20 dark:bg-slate-800/10"></td></tr>
                            )) : filteredProducts.map((product) => (
                                <tr key={product._id} className="group transition-all hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-indigo-600 transition-all group-hover:border-indigo-500/30">
                                                {product.productImage ? (
                                                    <img src={product.productImage.startsWith('http') ? product.productImage : `${BASE_URL}${product.productImage}`} alt={product.productName} className="w-full h-full object-cover" />
                                                ) : <Box size={24} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black dark:text-white truncate max-w-[200px]">{product.productName}</p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: {product.barcode || 'N/A'}</span>
                                                    {product.batches?.length > 1 && (
                                                        <button onClick={() => { setSelectedProductBatches(product); setIsBatchModalOpen(true); }} className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded text-[8px] font-black uppercase tracking-widest">Multiple Batches</button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">{product.category?.name || 'GENERIC'}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-black dark:text-white leading-none">{product.quantity}</p>
                                        <p className="mt-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Units In Stock</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-black text-indigo-600 leading-none">₹{product.price}</p>
                                        <p className="mt-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Cost: ₹{product.purchasePrice || 0}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        {product.quantity <= product.lowStockThreshold ? (
                                            <div className="flex items-center gap-2 text-rose-500">
                                                <AlertCircle size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Critical Low</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-emerald-500">
                                                <ShieldCheck size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Nominal</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(product)} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-xl flex items-center justify-center transition-all border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(product._id)} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 rounded-xl flex items-center justify-center transition-all border border-slate-100 dark:border-slate-800 hover:border-rose-500/30">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden grid grid-cols-1 gap-4">
                    {loading ? [1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-white dark:bg-slate-900 rounded-3xl animate-pulse" />
                    )) : filteredProducts.map(product => (
                        <div key={product._id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                            <div className="flex gap-4">
                                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-indigo-600">
                                    {product.productImage ? (
                                        <img src={product.productImage.startsWith('http') ? product.productImage : `${BASE_URL}${product.productImage}`} alt={product.productName} className="w-full h-full object-cover" />
                                    ) : <Box size={24} />}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-black dark:text-white truncate pr-2">{product.productName}</p>
                                            <p className="text-sm font-black text-indigo-600">₹{product.price}</p>
                                        </div>
                                        <span className="inline-block mt-1 text-[8px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">{product.category?.name || 'GENERIC'}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Units</p>
                                                <p className="text-xs font-black dark:text-white">{product.quantity}</p>
                                            </div>
                                            <div className="h-4 w-px bg-slate-100 dark:bg-slate-800"></div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Status</p>
                                                <span className={`text-[8px] font-black uppercase ${product.quantity <= product.lowStockThreshold ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    {product.quantity <= product.lowStockThreshold ? 'Low' : 'Healthy'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-1.5">
                                            <button onClick={() => handleOpenModal(product)} className="w-9 h-9 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all"><Edit size={14} /></button>
                                            <button onClick={() => handleDelete(product._id)} className="w-9 h-9 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Initialization Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Update Product' : 'Add Product'} className="max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-6 py-2 sm:py-4">
                    <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40 sm:grid-cols-[170px_1fr] sm:p-5">
                        <div className="relative mx-auto">
                            <div className="relative h-40 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                {formData.productImage ? (
                                    <img src={formData.productImage.startsWith('http') ? formData.productImage : `${BASE_URL}${formData.productImage}`} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="grid h-full place-items-center text-slate-400"><ImageIcon size={38} /></div>
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 grid place-items-center bg-white/70 dark:bg-black/60">
                                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 absolute -bottom-3 left-1/2 -translate-x-1/2">
                                <label className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white border border-slate-200 text-indigo-600 shadow-sm hover:bg-slate-50 transition-colors">
                                    <Upload size={16} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                                <label className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all">
                                    <Camera size={16} />
                                    <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
                                </label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Product Image</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Upload a clear product image for better inventory visibility.</p>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">
                                <Upload size={14} /> PNG / JPG supported
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Product Name</label>
                            <input type="text" required className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" value={formData.productName} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
                            <select required className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                <option value="">Select category</option>
                                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Quantity</label>
                            <input type="number" required className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Low Stock Threshold</label>
                            <input type="number" required className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" value={formData.lowStockThreshold} onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) })} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Sale Price</label>
                            <input type="number" required className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Purchase Price</label>
                            <input type="number" required className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })} />
                        </div>
                        <div className="relative">
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Barcode</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-8 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        placeholder="Manual entry"
                                        value={formData.barcode}
                                        onChange={(e) => {
                                            setFormData({ ...formData, barcode: e.target.value });
                                            if (e.target.value.length >= 10) handleBarcodeLookup(e.target.value);
                                        }}
                                    />
                                    <Tag className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                </div>
                                <button type="button" onClick={() => setShowBarcodePicker(!showBarcodePicker)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200" title="Pick Available">
                                    <Layers size={16} />
                                </button>
                                <button type="button" onClick={() => setIsScannerOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200" title="Scan Barcode">
                                    <Scan size={16} />
                                </button>
                            </div>

                            <AnimatePresence>
                                {showBarcodePicker && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-50 mt-2 w-full max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800"
                                    >
                                        <div className="mb-2 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Available Identifiers</div>
                                        {unlinkedBarcodes.length > 0 ? (
                                            unlinkedBarcodes.map(bc => (
                                                <button
                                                    key={bc._id}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, barcode: bc.barcode });
                                                        setShowBarcodePicker(false);
                                                    }}
                                                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-indigo-500/20"
                                                >
                                                    <span>{bc.barcode}</span>
                                                    <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded uppercase">Unlinked</span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-3 py-4 text-center text-xs text-slate-500">
                                                No unlinked barcodes. Generate more in the Barcode section.
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {formData.barcode && formData.barcode.length === 13 && (
                                <div className="mt-2 flex justify-center p-2 rounded-lg bg-white border border-slate-100 dark:bg-slate-950 dark:border-slate-800">
                                    <BarcodeImage value={formData.barcode} className="w-48 h-16" />
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Expiry Date</label>
                            <input type="date" className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
                        <button type="submit" className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700">{editingProduct ? 'Update Product' : 'Add Product'}</button>
                    </div>
                </form>
            </Modal>

            {/* Batch Analysis Modal */}
            <Modal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} title="Batch Details Summary" className="max-w-3xl">
                {selectedProductBatches && (
                    <div className="space-y-6 py-2">
                        <div className="flex items-center gap-5 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-700">
                            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20"><Box size={28} /></div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{selectedProductBatches.productName}</h3>
                                <p className="text-sm font-medium text-slate-500 mt-1">Total Stock in inventory: <span className="text-indigo-600 font-bold">{selectedProductBatches.quantity} Units</span></p>
                            </div>
                        </div>
                        <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Serial / Batch</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Expiry Date</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Units</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {sortedBatches.map((batch, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">{batch.batchNumber || 'NA'}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{formatDate(batch.expiryDate)}</td>
                                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{batch.quantity}</td>
                                            <td className="px-6 py-4 text-right font-bold text-indigo-600">₹{batch.price}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="Barcode Scanner" className="max-w-lg">
                <BarcodeScanner isOpen={isScannerOpen} onScanSuccess={handleScanSuccess} onScanError={(err) => console.error(err)} />
            </Modal>

            <LimitModal isOpen={isLimitModalOpen} onClose={() => setIsLimitModalOpen(false)} limitType={limitMetadata.type} isTrialUsed={limitMetadata.isTrialUsed} />
        </div>
    );
};

export default Inventory;
