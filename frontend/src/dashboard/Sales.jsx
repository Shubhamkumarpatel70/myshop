import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, ShoppingCart, Trash2,
    User, Phone, CreditCard, Receipt,
    ChevronRight, Package, X, RefreshCcw,
    Undo2, ArrowRight, ArrowLeft, QrCode, Printer,
    Barcode, Scan, Notebook, Store, AlertTriangle, ShieldCheck, Zap, Layers, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import BarcodeScanner from '../components/BarcodeScanner';
import { posStore } from '../utils/posStore';
import Skeleton from '../components/Skeleton';

const Sales = () => {
    const { searchQuery } = useOutletContext() || { searchQuery: '' };
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [posStep, setPosStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (searchQuery !== undefined) {
            setSearchTerm(searchQuery);
        }
    }, [searchQuery]);

    const [paymentConfig, setPaymentConfig] = useState(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [utrNumber, setUtrNumber] = useState('');
    const [cart, setCart] = useState([]);
    const [customerInfo, setCustomerInfo] = useState({ name: 'Guest', phone: '', address: '', paymentMethod: 'Cash' });
    const [transactionSearch, setTransactionSearch] = useState('');
    const [searching, setSearching] = useState(false);
    const [viewingSale, setViewingSale] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [returnReasonInput, setReturnReasonInput] = useState('');
    const [itemToReturn, setItemToReturn] = useState(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncOfflineSales();
        };
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        fetchSales();
        fetchProducts();
        fetchPaymentConfig();
        syncOfflineSales();
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const syncOfflineSales = async () => {
        if (!navigator.onLine || isSyncing) return;
        const offlineSales = await posStore.getOfflineSales();
        if (offlineSales.length > 0) {
            setIsSyncing(true);
            const toastId = toast.loading(`Syncing ${offlineSales.length} offline inventory...`);
            for (const sale of offlineSales) {
                try {
                    const { id, ...saleData } = sale;
                    await api.post('/sales', saleData);
                    await posStore.deleteOfflineSale(id);
                } catch (error) {
                    console.error("Sync failed for sale:", sale);
                }
            }
            toast.dismiss(toastId);
            toast.success("Ecosystem Synchronized");
            setIsSyncing(false);
            fetchSales();
        }
    };

    const fetchPaymentConfig = async () => {
        try {
            const res = await api.get('/payments');
            setPaymentConfig(res.data.data);
        } catch (error) {
            console.error("Failed to fetch payment config");
        }
    };

    const fetchSales = async () => {
        try {
            const res = await api.get('/sales');
            const salesData = res.data.data;
            setSales(salesData);
            await posStore.cacheSales(salesData);
        } catch (error) {
            console.error("Failed to fetch sales, loading from cache...");
            const cachedSales = await posStore.getCachedSales();
            if (cachedSales.length > 0) setSales(cachedSales);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            const productData = res.data.data;
            setProducts(productData);
            await posStore.cacheProducts(productData);
        } catch (error) {
            console.error("Failed to fetch products, loading from cache...");
            const cachedProducts = await posStore.getCachedProducts();
            if (cachedProducts.length > 0) {
                setProducts(cachedProducts);
                toast.success("Inventory synchronized from local node");
            } else {
                toast.error("Cloud connection required for initialization");
            }
        }
    };

    const handleTransactionSearch = async (e) => {
        if (e) e.preventDefault();
        if (!transactionSearch || transactionSearch.length < 5) return;
        setSearching(true);
        try {
            const res = await api.get(`/sales/${transactionSearch}`);
            setViewingSale(res.data.data);
            setIsViewModalOpen(true);
            setTransactionSearch('');
        } catch (error) {
            toast.error(error.response?.data?.message || "Node not found in registry");
        } finally {
            setSearching(false);
        }
    };

    const handleScanSuccess = (decodedText) => {
        setIsScannerOpen(false);
        setSearchTerm(decodedText);
        const foundProduct = products.find(p => p.barcode === decodedText);
        if (foundProduct) {
            addToCart(foundProduct);
            toast.success(`Uplink: ${foundProduct.productName} Added`);
        } else {
            toast.error("Unknown asset identified");
        }
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.product === product._id);
        if (existingItem) {
            if (existingItem.quantity >= product.quantity) {
                toast.error("Node capacity reached");
                return;
            }
            setCart(cart.map(item => item.product === product._id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            if (product.quantity <= 0) {
                toast.error("Asset out of stock");
                return;
            }
            setCart([...cart, {
                product: product._id,
                productName: product.productName,
                price: product.price,
                quantity: 1,
                mrp: product.price,
                discount: 0
            }]);
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product !== productId));
    };

    const calculateTotal = () => {
        return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error("Cart node empty");
            return;
        }
        if (customerInfo.paymentMethod === 'Scan & Pay' && !utrNumber) {
            toast.error("Security ID (UTR) Required");
            return;
        }
        try {
            const saleData = {
                items: cart,
                customerName: customerInfo.name,
                customerPhone: customerInfo.phone,
                paymentMethod: customerInfo.paymentMethod,
                utrNumber: utrNumber
            };
            if (!navigator.onLine) {
                await posStore.saveOfflineSale(saleData);
                toast.success("Offline Node Active: Sale cached locally");
            } else {
                await api.post('/sales', saleData);
                toast.success("Transaction committed to cloud");
            }
            setCart([]);
            setCustomerInfo({ name: 'Guest', phone: '', paymentMethod: 'Cash' });
            setUtrNumber('');
            setIsSaleModalOpen(false);
            setIsQrModalOpen(false);
            fetchSales();
            fetchProducts();
        } catch (error) {
            toast.error(error.response?.data?.message || "Protocol Failure");
        }
    };

    const filteredProducts = products.filter(p =>
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm))
    );

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase();
    };

    return (
        <div className="space-y-6 pb-10 font-jakarta">
            {/* Status Indicators */}
            <AnimatePresence>
                {!isOnline && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="rounded-2xl border border-rose-500/30 bg-rose-600 px-4 py-3 text-white shadow-lg sm:px-5">
                        <div className="flex items-center gap-4">
                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/20"><Globe size={18} /></div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide">Offline Node Active</p>
                                <p className="text-xs opacity-90">Cloud sync paused. Sales are cached locally.</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header with High-Fidelity Typography */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600">
                        <Zap size={14} /> Terminal Alpha-01
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        POS <span className="text-indigo-600">Terminal</span>
                    </h1>
                    <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                        High-performance transaction engine for your retail ecosystem.
                    </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                    <form onSubmit={handleTransactionSearch} className="flex flex-1 gap-2 lg:w-80">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                            <input
                                type="text" placeholder="Transaction ID..."
                                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-xs font-semibold uppercase tracking-wide text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                value={transactionSearch} onChange={(e) => setTransactionSearch(e.target.value)}
                            />
                        </div>
                        <button type="submit" disabled={searching} className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                            {searching ? '...' : 'Find'}
                        </button>
                    </form>
                    <button onClick={() => setIsSaleModalOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-indigo-700">
                        <Plus size={20} /> New Sale
                    </button>
                </div>
            </div>

            {/* Sales Registry */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="min-w-[980px] w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Transaction Node</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Merchant Client</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Payload</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Settlement</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Protocol</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? [1, 2, 3, 4, 5].map(i => (
                                <tr key={i} className="animate-pulse"><td colSpan="6" className="px-4 py-6 h-16 bg-slate-50/20 dark:bg-slate-800/10"></td></tr>
                            )) : sales.map((sale) => (
                                <tr key={sale._id} className="group transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                    <td className="px-4 py-4">
                                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">{sale.transactionId || sale._id.slice(-8).toUpperCase()}</p>
                                        <p className="text-xs font-medium text-slate-500">{formatDate(sale.createdAt)}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-sm font-semibold leading-none text-slate-900 dark:text-white">{sale.customerName}</p>
                                        <p className="mt-1 text-xs text-slate-500">{sale.customerPhone || 'WALK-IN NODE'}</p>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            {sale.items.length}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-sm font-semibold leading-none text-emerald-600">₹{sale.totalAmount.toLocaleString()}</p>
                                        <p className="mt-1 text-xs text-slate-500">{sale.paymentMethod}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sale.status === 'Returned' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' :
                                                'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                            }`}>
                                            {sale.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <button onClick={() => { setViewingSale(sale); setIsViewModalOpen(true); }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                            <Receipt size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* POS UI Modal */}
            <Modal isOpen={isSaleModalOpen} onClose={() => { setIsSaleModalOpen(false); setPosStep(1); }} title="New Sale" className="max-w-6xl">
                <div className="flex flex-col gap-6 py-2 sm:py-4">
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {[1, 2, 3].map((step) => (
                            <div
                                key={step}
                                className={`rounded-xl border px-3 py-2 text-center text-xs font-semibold transition-colors ${posStep >= step
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-500/15 dark:text-indigo-200'
                                        : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                                    }`}
                            >
                                {step === 1 ? 'Products' : step === 2 ? 'Customer' : 'Payment'}
                            </div>
                        ))}
                    </div>

                    {posStep === 1 && (
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                            <div className="space-y-4 xl:col-span-7">
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search product name or barcode"
                                            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        onClick={() => setIsScannerOpen(true)}
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                                    >
                                        <Scan size={16} /> Scan
                                    </button>
                                </div>

                                <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
                                    {filteredProducts.map((product) => (
                                        <button
                                            key={product._id}
                                            onClick={() => addToCart(product)}
                                            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{product.productName}</p>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">₹{product.price} · Stock {product.quantity}</p>
                                            </div>
                                            <span className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                                                <Plus size={15} />
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl bg-slate-950 p-4 text-white xl:col-span-5 sm:p-5">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold">Cart</h3>
                                        <p className="text-xs text-slate-400">{cart.length} item(s)</p>
                                    </div>
                                    {cart.length > 0 && (
                                        <button onClick={() => setCart([])} className="inline-flex h-9 items-center justify-center rounded-lg bg-white/10 px-3 text-xs font-semibold hover:bg-rose-500/20">
                                            Clear
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-[30vh] space-y-2 overflow-y-auto pr-1">
                                    {cart.map((item) => (
                                        <div key={item.product} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                                            <div className="min-w-0 pr-3">
                                                <p className="truncate text-sm font-semibold">{item.productName}</p>
                                                <p className="text-xs text-slate-400">₹{item.price} × {item.quantity}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <p className="text-sm font-semibold">₹{item.price * item.quantity}</p>
                                                <button onClick={() => removeFromCart(item.product)} className="text-slate-400 hover:text-rose-400">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 border-t border-white/10 pt-4">
                                    <div className="mb-3 flex items-end justify-between">
                                        <p className="text-sm text-slate-300">Total</p>
                                        <p className="text-2xl font-bold">₹{calculateTotal().toLocaleString()}</p>
                                    </div>
                                    <button
                                        disabled={cart.length === 0}
                                        onClick={() => setPosStep(2)}
                                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                                    >
                                        Continue <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {posStep === 2 && (
                        <div className="mx-auto w-full max-w-3xl space-y-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Customer Details</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add customer details for this transaction.</p>

                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Name</label>
                                        <input
                                            type="text"
                                            value={customerInfo.name}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Phone</label>
                                        <input
                                            type="tel"
                                            value={customerInfo.phone}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Address (optional)</label>
                                        <textarea
                                            rows={3}
                                            value={customerInfo.address}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setPosStep(1)} className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                                    Back
                                </button>
                                <button onClick={() => setPosStep(3)} className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700">
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {posStep === 3 && (
                        <div className="mx-auto w-full max-w-2xl space-y-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Payment Method</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose how the customer is paying.</p>

                                <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                                    {['Cash', 'UPI', 'Scan & Pay', 'Udhar'].map((method) => (
                                        <button
                                            key={method}
                                            onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: method })}
                                            className={`rounded-lg border px-3 py-3 text-sm font-semibold transition-colors ${customerInfo.paymentMethod === method
                                                    ? 'border-indigo-500 bg-indigo-600 text-white'
                                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-5 rounded-xl bg-slate-950 p-4 text-white">
                                    <p className="text-sm text-slate-300">Amount Payable</p>
                                    <p className="mt-1 text-3xl font-bold">₹{calculateTotal().toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setPosStep(2)} className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                                    Back
                                </button>
                                <button onClick={handleCheckout} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700">
                                    Finalize Sale <Zap size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* View Details Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Transaction Manifest" className="max-w-2xl">
                {viewingSale && (
                    <div className="py-8 space-y-12">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-[2rem] flex items-center justify-center text-indigo-600 border border-indigo-100 dark:border-indigo-500/20 shadow-inner"><Receipt size={36} /></div>
                            <div>
                                <h3 className="text-3xl font-black uppercase tracking-tight dark:text-white leading-none">Receipt Registry</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">ID: {viewingSale.transactionId || viewingSale._id.toUpperCase()}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 space-y-8">
                            <div className="flex justify-between items-start pb-8 border-b border-slate-200 dark:border-white/10">
                                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Merchant Client</p><p className="font-black text-lg dark:text-white">{viewingSale.customerName}</p></div>
                                <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Timestamp</p><p className="font-black text-lg dark:text-white">{formatDate(viewingSale.createdAt)}</p></div>
                            </div>
                            <div className="space-y-6">
                                {viewingSale.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center group">
                                        <div><p className="font-black text-sm uppercase dark:text-white leading-none">{item.productName}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">{item.quantity} Unit(s) @ ₹{item.price}</p></div>
                                        <p className="font-black text-base dark:text-white">₹{item.price * item.quantity}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Total Settlement</p>
                                <p className="text-3xl font-black dark:text-white tracking-tighter">₹{viewingSale.totalAmount.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => window.print()} className="h-20 flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3"><Printer size={20} /> Print Receipt</button>
                            <button onClick={() => setIsViewModalOpen(false)} className="h-20 flex-1 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Acknowledge</button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="Optical Uplink" className="max-w-lg">
                <BarcodeScanner isOpen={isScannerOpen} onScanSuccess={handleScanSuccess} onScanError={(err) => console.error(err)} />
            </Modal>
        </div>
    );
};

export default Sales;
