import React, { useState, useEffect } from 'react';
import api, { BASE_URL } from '../utils/api';
import { motion } from 'framer-motion';
import { 
    Plus, Search, Filter, MoreVertical, 
    Edit, Trash2, Package, AlertCircle,
    ArrowUpDown, Download, CreditCard,
    Image as ImageIcon, Upload, Camera, Scan
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import BarcodeScanner from '../components/BarcodeScanner';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
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
            toast.success("Image uploaded successfully");
        } catch (error) {
            toast.error("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = String(date.getFullYear()).slice(-2);
        return `${d}-${m}-${y}`;
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
            toast.error("Failed to fetch inventory");
        } finally {
            setLoading(false);
        }
    };

    const handleScanSuccess = (decodedText) => {
        setIsScannerOpen(false);
        setFormData(prev => ({ ...prev, barcode: decodedText }));
        toast.success("Barcode scanned successfully");
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
                toast.success("Product updated");
            } else {
                await api.post('/products', formData);
                toast.success("Product added");
            }
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await api.delete(`/products/${id}`);
                toast.success("Product deleted");
                fetchData();
            } catch (error) {
                toast.error("Failed to delete product");
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
        a.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const [stockFilter, setStockFilter] = useState('all'); // all, low, out

    const filteredProducts = products
        .filter(p => {
            const matchesSearch = p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
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
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="w-full">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">Master Inventory</h1>
                    <p className="text-secondary-500 font-medium mt-1">Surveillance and management of global stock assets.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <button 
                        onClick={handleExport}
                        className="btn bg-white dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-800 h-14 px-6 rounded-2xl flex-1 justify-center md:justify-start"
                    >
                        <Download size={20} /> <span className="sm:hidden">Export CSV</span> <span className="hidden sm:inline">Export CSV</span>
                    </button>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="btn btn-primary h-14 px-8 rounded-2xl shadow-xl shadow-primary-500/20 flex-1 justify-center md:justify-start"
                    >
                        <Plus size={20} /> <span className="sm:hidden">Add Product</span> <span className="hidden sm:inline">Add Product</span>
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center bg-white dark:bg-secondary-900 p-4 rounded-[2rem] border border-secondary-100 dark:border-secondary-800 shadow-sm">
                <div className="relative lg:col-span-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search assets..." 
                        className="input-field pl-12 h-14 rounded-xl bg-secondary-50 border-none text-sm md:text-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="lg:col-span-3">
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                        <select 
                            className="input-field pl-12 h-14 rounded-xl bg-secondary-50 border-none appearance-none text-sm md:text-base w-full"
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                        >
                            <option value="all">All Stock Status</option>
                            <option value="low">Low Stock Alert</option>
                            <option value="out">Out of Stock</option>
                        </select>
                    </div>
                </div>
                <div className="lg:col-span-3">
                    <div className="relative">
                        <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                        <select 
                            className="input-field pl-12 h-14 rounded-xl bg-secondary-50 border-none appearance-none text-sm md:text-base w-full"
                            onChange={(e) => handleSort(e.target.value)}
                        >
                            <option value="">Sort Assets By</option>
                            <option value="productName">Product Name</option>
                            <option value="quantity">Stock Quantity</option>
                            <option value="price">Selling Price</option>
                            <option value="category">Category</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="card overflow-hidden p-0 border-secondary-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-secondary-50 dark:bg-secondary-800/50 border-b border-secondary-200 dark:border-secondary-800">
                            <tr>
                                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider">Product</th>
                                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider">Selling Price</th>
                                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider">Cost Price</th>
                                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-6 h-16 bg-secondary-50/50 dark:bg-secondary-900/50"></td>
                                    </tr>
                                ))
                            ) : filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <tr key={product._id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center text-primary-600 overflow-hidden border border-secondary-200 dark:border-secondary-700">
                                                    {product.productImage ? (
                                                        <img 
                                                            src={product.productImage.startsWith('http') ? product.productImage : `${BASE_URL}${product.productImage}`} 
                                                            alt={product.productName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Package size={24} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm uppercase tracking-tight">{product.productName}</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        <p className="text-[10px] text-secondary-500 bg-secondary-100 px-1 rounded">BC: {product.barcode || 'N/A'}</p>
                                                        {product.batches?.length > 1 && (
                                                            <button 
                                                                onClick={() => {
                                                                    setSelectedProductBatches(product);
                                                                    setIsBatchModalOpen(true);
                                                                }}
                                                                className="text-[10px] text-primary-600 bg-primary-50 px-1 rounded font-bold hover:bg-primary-100 transition-colors"
                                                            >
                                                                {product.batches.length} Batches
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 text-xs font-medium">
                                                {product.category?.name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold">{product.quantity}</p>
                                            {product.expiryDate && (
                                                <p className={`text-[10px] font-bold ${new Date(product.expiryDate) < new Date() ? 'text-red-500' : 'text-secondary-400'}`}>
                                                    Exp: {formatDate(product.expiryDate)}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold">₹{product.price}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-secondary-500">₹{product.purchasePrice || 0}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {product.quantity <= product.lowStockThreshold ? (
                                                <span className="flex items-center gap-1 text-red-500 text-xs font-bold uppercase">
                                                    <AlertCircle size={14} /> Low Stock
                                                </span>
                                            ) : (
                                                <span className="text-emerald-500 text-xs font-bold uppercase">In Stock</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleOpenModal(product)}
                                                    className="p-2 hover:bg-primary-50 text-primary-600 rounded-lg transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(product._id)}
                                                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-secondary-500">
                                        No products found. Start by adding one!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingProduct ? 'Edit Product' : 'Add New Product'}
                className="max-w-2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Upload Section */}
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-secondary-200 dark:border-secondary-800 rounded-[2rem] bg-secondary-50/50 dark:bg-secondary-900/30">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-[2rem] bg-white dark:bg-secondary-800 flex items-center justify-center text-secondary-400 overflow-hidden border-2 border-white shadow-xl">
                                {formData.productImage ? (
                                    <img 
                                        src={formData.productImage.startsWith('http') ? formData.productImage : `${BASE_URL}${formData.productImage}`} 
                                        alt="Preview" 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <ImageIcon size={40} />
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                                    </div>
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 p-3 bg-primary-600 text-white rounded-2xl shadow-lg cursor-pointer hover:bg-primary-700 transition-all hover:scale-110">
                                <Camera size={18} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-sm font-bold text-secondary-600">Product Image</p>
                            <p className="text-[10px] text-secondary-400 uppercase tracking-widest mt-1">PNG, JPG up to 5MB</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold mb-2">Product Name</label>
                            <input 
                                type="text" 
                                required
                                className="input-field" 
                                value={formData.productName}
                                onChange={(e) => setFormData({...formData, productName: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">Category</label>
                            <select 
                                required
                                className="input-field"
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold ml-1">Batch Number</label>
                            <input 
                                type="text" 
                                placeholder="e.g. B-102"
                                className="input-field" 
                                value={formData.batchNumber}
                                onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">Quantity</label>
                            <input 
                                type="number" 
                                required
                                className="input-field" 
                                value={formData.quantity}
                                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">Selling Price (₹)</label>
                            <input 
                                type="number" 
                                required
                                className="input-field" 
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">Purchase Price (Cost) (₹)</label>
                            <input 
                                type="number" 
                                required
                                className="input-field" 
                                value={formData.purchasePrice}
                                onChange={(e) => setFormData({...formData, purchasePrice: parseFloat(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">Barcode</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        type="text" 
                                        className="input-field pr-10" 
                                        placeholder="Enter manually..."
                                        value={formData.barcode}
                                        onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                                    />
                                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setIsScannerOpen(true)}
                                    className="p-3 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-all group shadow-sm border border-primary-100"
                                    title="Scan Barcode"
                                >
                                    <Scan size={20} className="group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">Expiry Date</label>
                            <input 
                                type="date" 
                                className="input-field" 
                                value={formData.expiryDate}
                                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Description</label>
                        <textarea 
                            className="input-field h-24"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary px-8">
                            {editingProduct ? 'Save Changes' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </Modal>
            {/* Batch Details Modal */}
            <Modal
                isOpen={isBatchModalOpen}
                onClose={() => setIsBatchModalOpen(false)}
                title="Product Batch Details"
            >
                {selectedProductBatches && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-secondary-50 dark:bg-secondary-800 rounded-2xl">
                            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
                                <Package size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black">{selectedProductBatches.productName}</h3>
                                <p className="text-xs text-secondary-500">Total Stock: {selectedProductBatches.quantity}</p>
                            </div>
                        </div>

                        <div className="overflow-hidden border border-secondary-100 dark:border-secondary-800 rounded-2xl">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-secondary-50 dark:bg-secondary-800/50 text-xs font-black uppercase tracking-widest text-secondary-500">
                                    <tr>
                                        <th className="px-4 py-3">Batch No</th>
                                        <th className="px-4 py-3">Expiry Date</th>
                                        <th className="px-4 py-3">Quantity</th>
                                        <th className="px-4 py-3">Cost Price</th>
                                        <th className="px-4 py-3 text-right">Selling Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                                    {sortedBatches.map((batch, idx) => (
                                        <tr key={idx} className="hover:bg-secondary-50/50">
                                            <td className="px-4 py-3 font-bold text-secondary-600">
                                                {batch.batchNumber || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {formatDate(batch.expiryDate)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-bold">{batch.quantity}</span>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-secondary-500">
                                                ₹{batch.purchasePrice || 0}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-primary-600">
                                                ₹{batch.price}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Modal>
            <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="Quick Scan" className="max-w-lg">
                <BarcodeScanner 
                    isOpen={isScannerOpen}
                    onScanSuccess={handleScanSuccess}
                    onScanError={(err) => console.error(err)}
                />
            </Modal>
        </div>
    );
};

export default Inventory;
