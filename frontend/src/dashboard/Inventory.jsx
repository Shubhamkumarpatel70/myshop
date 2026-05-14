import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api, { BASE_URL } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Filter, MoreVertical,
    Edit, Trash2, Package, AlertCircle,
    ArrowUpDown, Download, CreditCard,
    Image as ImageIcon, Upload, Camera, Scan, ShieldCheck, Box, Tag, Layers
} from 'lucide-react';
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
            const [prodRes, catRes] = await Promise.all([
                api.get('/products'),
                api.get('/categories')
            ]);
            setProducts(prodRes.data.data);
            setCategories(catRes.data.data);
        } catch (error) {
            toast.error("Network synchronization failed");
        } finally {
            setLoading(false);
        }
    };

    const handleScanSuccess = (decodedText) => {
        setIsScannerOpen(false);
        setFormData(prev => ({ ...prev, barcode: decodedText }));
        toast.success("Uplink Successful: Barcode Synced");
    };

    const handleOpenModal = (product = null) => {
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
                toast.success("New Asset Initialized");
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600">
                        <Layers size={14} /> Asset Surveillance
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Master <span className="text-indigo-600">Inventory</span>
                    </h1>
                    <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                        Global oversight and lifecycle management of your merchant stock inventory.
                    </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                    <button onClick={handleExport} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                        <Download size={18} /> Export CSV
                    </button>
                    <button onClick={() => handleOpenModal()} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700">
                        <Plus size={20} /> Add Product
                    </button>
                </div>
            </div>

            {/* Tactical Control Bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Filter by product name, category or barcode..."
                            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-[360px]">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select className="h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold uppercase tracking-wide text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                                <option value="all">Status: All</option>
                                <option value="low">Alert: Low</option>
                                <option value="out">Alert: Out</option>
                            </select>
                        </div>
                        <div className="relative">
                            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select className="h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold uppercase tracking-wide text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" onChange={(e) => handleSort(e.target.value)}>
                                <option value="">Sort: None</option>
                                <option value="productName">Name</option>
                                <option value="quantity">Stock</option>
                                <option value="price">Price</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Grid Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="min-w-[980px] w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Inventory</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Price</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? [1, 2, 3, 4, 5].map(i => (
                                <tr key={i} className="animate-pulse"><td colSpan="6" className="px-4 py-6 h-16 bg-slate-50/20 dark:bg-slate-800/10"></td></tr>
                            )) : filteredProducts.length > 0 ? filteredProducts.map((product) => (
                                <tr key={product._id} className="group transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-indigo-600 shadow-inner transition-transform duration-300 group-hover:scale-105 dark:border-slate-700 dark:bg-slate-800">
                                                {product.productImage ? (
                                                    <img src={product.productImage.startsWith('http') ? product.productImage : `${BASE_URL}${product.productImage}`} alt={product.productName} className="w-full h-full object-cover" />
                                                ) : <Box size={28} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold leading-none text-slate-900 dark:text-white">{product.productName}</p>
                                                <div className="mt-2 flex gap-2">
                                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">ID: {product.barcode || 'N/A'}</span>
                                                    {product.batches?.length > 1 && (
                                                        <button onClick={() => { setSelectedProductBatches(product); setIsBatchModalOpen(true); }} className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-600 transition-all hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300">{product.batches.length} Batches</button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            {product.category?.name || 'GENERIC'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-sm font-semibold leading-none text-slate-900 dark:text-white">{product.quantity} <span className="ml-1 text-xs font-medium text-slate-500">Units</span></p>
                                        {product.expiryDate && (
                                            <p className={`mt-1 text-xs font-medium ${new Date(product.expiryDate) < new Date() ? 'text-rose-500' : 'text-slate-500'}`}>
                                                EXP: {formatDate(product.expiryDate)}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-sm font-semibold leading-none text-indigo-600">₹{product.price}</p>
                                        <p className="mt-1 text-xs font-medium text-slate-500">Cost: ₹{product.purchasePrice || 0}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        {product.quantity <= product.lowStockThreshold ? (
                                            <div className="flex items-center gap-2 text-rose-500">
                                                <AlertCircle size={14} />
                                                <span className="text-xs font-semibold">Low Stock</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-emerald-500">
                                                <ShieldCheck size={14} />
                                                <span className="text-xs font-semibold">Healthy</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(product)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(product._id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" className="px-4 py-20 text-center text-sm text-slate-500">No products found.</td></tr>
                            )}
                        </tbody>
                    </table>
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
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Barcode</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input type="text" className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-8 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder="Manual entry" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
                                    <Tag className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                </div>
                                <button type="button" onClick={() => setIsScannerOpen(true)} className="inline-flex h-11 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
                                    <Scan size={16} />
                                </button>
                            </div>
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
