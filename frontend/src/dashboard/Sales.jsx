import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Search, ShoppingCart, Trash2, 
    User, Phone, CreditCard, Receipt,
    ChevronRight, Package, X, RefreshCcw,
    Undo2, ArrowRight, ArrowLeft, QrCode, Printer,
    Barcode, Scan, Notebook, Store
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import BarcodeScanner from '../components/BarcodeScanner';
import { posStore } from '../utils/posStore';
import Skeleton from '../components/Skeleton';

const Sales = () => {
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [posStep, setPosStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentConfig, setPaymentConfig] = useState(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [utrNumber, setUtrNumber] = useState('');
    
    // New Sale State
    const [cart, setCart] = useState([]);
    const [customerInfo, setCustomerInfo] = useState({ name: 'Guest', phone: '', address: '', paymentMethod: 'Cash' });

    // Transaction Search & Detail State
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
            const toastId = toast.loading(`Syncing ${offlineSales.length} offline sales...`);
            for (const sale of offlineSales) {
                try {
                    // Remove the temporary ID before sending to server
                    const { id, ...saleData } = sale;
                    await api.post('/sales', saleData);
                    await posStore.deleteOfflineSale(id);
                } catch (error) {
                    console.error("Sync failed for sale:", sale);
                }
            }
            toast.dismiss(toastId);
            toast.success("All offline sales synced!");
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
            // Cache sales for offline viewing
            await posStore.cacheSales(salesData);
        } catch (error) {
            console.error("Failed to fetch sales, loading from cache...");
            const cachedSales = await posStore.getCachedSales();
            if (cachedSales.length > 0) {
                setSales(cachedSales);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            const productData = res.data.data;
            setProducts(productData);
            // Cache products for offline use
            await posStore.cacheProducts(productData);
        } catch (error) {
            console.error("Failed to fetch products, loading from cache...");
            const cachedProducts = await posStore.getCachedProducts();
            if (cachedProducts.length > 0) {
                setProducts(cachedProducts);
                toast.success("Loaded inventory from local cache");
            } else {
                toast.error("No cached inventory found. Connect to internet.");
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
            toast.error(error.response?.data?.message || "Transaction not found");
        } finally {
            setSearching(false);
        }
    };

    const handleReturnItem = (productId, quantity) => {
        setItemToReturn({ productId, quantity });
        setReturnReasonInput('');
        setIsReturnModalOpen(true);
    };

    const confirmReturn = async () => {
        if (!returnReasonInput.trim()) {
            toast.error("Please enter a reason for return");
            return;
        }
        
        try {
            await api.post('/sales/return-product', {
                saleId: viewingSale._id,
                productId: itemToReturn.productId,
                quantity: itemToReturn.quantity,
                returnReason: returnReasonInput
            });
            toast.success("Product returned successfully");
            setIsReturnModalOpen(false);
            // Refresh details
            const res = await api.get(`/sales/${viewingSale._id}`);
            setViewingSale(res.data.data);
            fetchSales(); // Refresh list
        } catch (error) {
            toast.error("Return failed");
        }
    };

    const handleScanSuccess = (decodedText) => {
        setIsScannerOpen(false);
        setSearchTerm(decodedText);
        
        // Try to find the product immediately by barcode
        const foundProduct = products.find(p => p.barcode === decodedText);
        if (foundProduct) {
            addToCart(foundProduct);
            toast.success(`Added ${foundProduct.productName} to cart`);
        } else {
            toast.error("Product not found in inventory");
        }
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.product === product._id);
        if (existingItem) {
            if (existingItem.quantity >= product.quantity) {
                toast.error("Not enough stock");
                return;
            }
            setCart(cart.map(item => 
                item.product === product._id 
                ? { ...item, quantity: item.quantity + 1 } 
                : item
            ));
        } else {
            if (product.quantity <= 0) {
                toast.error("Out of stock");
                return;
            }
            setCart([...cart, {
                product: product._id,
                productName: product.productName,
                price: product.price,
                quantity: 1,
                mrp: product.price, // Default MRP to price
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
            toast.error("Cart is empty");
            return;
        }

        if (customerInfo.paymentMethod === 'Scan & Pay' && !utrNumber) {
            toast.error("Please enter UTR number");
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
                toast.success("Offline Mode: Sale saved locally. Will sync when online.");
            } else {
                await api.post('/sales', saleData);
                toast.success("Sale completed successfully");
            }

            setCart([]);
            setCustomerInfo({ name: 'Guest', phone: '', paymentMethod: 'Cash' });
            setUtrNumber('');
            setIsSaleModalOpen(false);
            setIsQrModalOpen(false);
            fetchSales();
            fetchProducts();
        } catch (error) {
            toast.error(error.response?.data?.message || "Checkout failed");
        }
    };

    const filteredProducts = products.filter(p => 
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm))
    );

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = String(date.getFullYear()).slice(-2);
        return `${d}-${m}-${y}`;
    };

    return (
        <div className="space-y-6">
            {!isOnline && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="bg-amber-500 text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-lg shadow-amber-500/20"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center animate-pulse">
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-tight">Offline Mode Active</p>
                            <p className="text-[10px] font-bold opacity-90">Your internet is disconnected. Sales will be saved locally and synced automatically when you reconnect.</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {isSyncing && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-lg shadow-indigo-600/20"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <RefreshCcw size={18} className="animate-spin" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-tight">Synchronizing Data</p>
                            <p className="text-[10px] font-bold opacity-90">Please do not close the window while we sync your offline transactions with the cloud.</p>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="w-full">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">Sales & Billing</h1>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                            isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
                            {isOnline ? 'Online' : 'Offline'}
                        </div>
                    </div>
                    <p className="text-secondary-500 font-medium mt-1">Record new sales and manage transaction history.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                    <form onSubmit={handleTransactionSearch} className="flex-1 sm:w-64 relative">
                        <input 
                            type="text" 
                            placeholder="Transaction ID..." 
                            className="input-field pr-10 text-sm h-14 rounded-xl"
                            value={transactionSearch}
                            onChange={(e) => setTransactionSearch(e.target.value)}
                        />
                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-secondary-100 rounded-lg">
                            <Search size={18} className={searching ? 'animate-spin' : ''} />
                        </button>
                    </form>
                    <button 
                        onClick={() => setIsSaleModalOpen(true)}
                        className="btn btn-primary h-14 px-8 rounded-xl whitespace-nowrap justify-center"
                    >
                        <Plus size={20} /> New Sale
                    </button>
                </div>
            </div>

            {/* Sales History Table */}
            <div className="bg-white dark:bg-secondary-900 rounded-[2.5rem] shadow-xl border border-secondary-100 dark:border-secondary-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-secondary-50 dark:bg-secondary-800/50">
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">ID</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">Customer</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500 text-center">Items</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">Total</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">Status</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="h-20">
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-32" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-8 mx-auto" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                        <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : sales.map((sale) => (
                                <tr key={sale._id} className="hover:bg-secondary-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="text-[10px] font-mono font-bold text-secondary-400">{sale.transactionId || sale._id.toUpperCase()}</p>
                                        <p className="text-[10px] text-secondary-500">{formatDate(sale.createdAt)}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold">{sale.customerName}</p>
                                        <p className="text-[10px] text-secondary-500">{sale.customerPhone || 'Walk-in'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary-100 text-secondary-600 text-[10px] font-black">
                                            {sale.items.length}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-black text-emerald-600">₹{sale.totalAmount.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border w-fit ${
                                                sale.status === 'Returned' ? 'bg-red-50 text-red-600 border-red-100' :
                                                sale.status === 'Partial Return' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                                {sale.status}
                                            </span>
                                            {sale.paymentMethod === 'Udhar' && (
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-100 text-red-700 border border-red-200 w-fit animate-pulse">
                                                    Udhar (Pending)
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => { setViewingSale(sale); setIsViewModalOpen(true); }}
                                            className="p-2 hover:bg-secondary-100 rounded-lg text-secondary-400 group-hover:text-primary-600 transition-colors"
                                        >
                                            <Receipt size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Sale Modal (POS) */}
            <Modal 
                isOpen={isSaleModalOpen} 
                onClose={() => {
                    setIsSaleModalOpen(false);
                    setPosStep(1);
                }} 
                title={posStep === 1 ? "New Sale - Add Products" : posStep === 2 ? "Customer Information" : "Payment & Checkout"}
                className="max-w-6xl"
            >
                <div className="flex flex-col w-full">
                    {/* Modern Step Progress Bar */}
                    <div className="flex items-center justify-between px-4 md:px-10 mb-6 md:mb-10 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-1 bg-secondary-100 dark:bg-secondary-800 z-0 hidden sm:block">
                            <div 
                                className="h-full bg-primary-600 transition-all duration-500 ease-in-out" 
                                style={{ width: `${(posStep - 1) * 50}%` }}
                            ></div>
                        </div>
                        {[
                            { step: 1, label: 'Selection', icon: <ShoppingCart size={14} /> },
                            { step: 2, label: 'Customer', icon: <User size={14} /> },
                            { step: 3, label: 'Checkout', icon: <CreditCard size={14} /> }
                        ].map((item) => (
                            <div key={item.step} className="relative z-10 flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                    posStep >= item.step 
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' 
                                    : 'bg-white dark:bg-secondary-800 text-secondary-400 border border-secondary-100 dark:border-secondary-700'
                                }`}>
                                    {posStep > item.step ? <Plus className="rotate-45" size={18} /> : item.icon}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                    posStep >= item.step ? 'text-primary-600' : 'text-secondary-400'
                                }`}>
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1">
                        {posStep === 1 && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Product Search & List */}
                                <div className="lg:col-span-7 flex flex-col gap-6 bg-white dark:bg-secondary-900/50 p-4 md:p-8 rounded-[2.5rem] border border-secondary-100 dark:border-secondary-800">
                                    <div className="relative group">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                                        <input 
                                            type="text" 
                                            placeholder="Scan barcode or type product name..." 
                                            className="input-field pl-16 pr-32 h-16 rounded-[1.5rem] bg-secondary-50 dark:bg-secondary-800 border-2 border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-secondary-900 shadow-sm transition-all text-lg font-medium"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <button 
                                                onClick={() => setIsScannerOpen(true)}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-500/20 hover:bg-primary-500 transition-all group/btn"
                                            >
                                                <Scan size={14} className="group-hover/btn:scale-110 transition-transform" /> Scan
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                        {filteredProducts.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-secondary-400 opacity-60">
                                                <Package size={48} strokeWidth={1} />
                                                <p className="mt-4 font-bold">No products found</p>
                                            </div>
                                        ) : filteredProducts.map((product) => (
                                            <motion.div 
                                                layout
                                                key={product._id} 
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                className="flex items-center justify-between p-3 lg:p-5 bg-white dark:bg-secondary-800 rounded-2xl lg:rounded-3xl border border-secondary-100 dark:border-secondary-700 hover:border-primary-500/30 transition-all group cursor-pointer"
                                                onClick={() => addToCart(product)}
                                            >
                                                <div className="flex items-center gap-3 lg:gap-5">
                                                    <div className="w-10 h-10 lg:w-16 lg:h-16 bg-secondary-50 dark:bg-secondary-700 rounded-xl lg:rounded-2xl flex items-center justify-center text-primary-600 font-black text-lg lg:text-2xl shadow-inner">
                                                        {product.productName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-base lg:text-lg text-slate-800 dark:text-white leading-tight">{product.productName}</p>
                                                        <div className="flex items-center gap-3 lg:gap-4 mt-1">
                                                            <p className="text-base lg:text-xl font-black text-primary-600">₹{product.price}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                                    product.quantity > 10 ? 'bg-emerald-500' : 
                                                                    product.quantity > 0 ? 'bg-amber-500' : 'bg-rose-500'
                                                                }`}></span>
                                                                <span className="text-[8px] lg:text-[10px] font-black uppercase text-secondary-400 tracking-widest">
                                                                    {product.quantity > 0 ? `${product.quantity} Avl` : 'Out'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl lg:rounded-2xl flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                                                    <Plus size={20} lg:size={24} />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Enhanced Cart Area */}
                                <div className="lg:col-span-5 flex flex-col bg-slate-900 text-white rounded-[2.5rem] p-6 md:p-10 shadow-2xl shadow-slate-900/40 relative">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                                    
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-6 lg:mb-10">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className="w-10 h-10 lg:w-14 lg:h-14 bg-white/10 backdrop-blur-md rounded-[1rem] lg:rounded-[1.25rem] flex items-center justify-center border border-white/10 shadow-xl">
                                                    <ShoppingCart size={20} className="text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-lg lg:text-2xl tracking-tight">Active Cart</h3>
                                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{cart.length} Items Selected</p>
                                                </div>
                                            </div>
                                            {cart.length > 0 && (
                                                <button 
                                                    onClick={() => setCart([])} 
                                                    className="p-2 lg:p-3 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl lg:rounded-2xl transition-all"
                                                    title="Clear Cart"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-[200px] lg:h-[calc(75vh-400px)] overflow-y-auto space-y-2 lg:space-y-4 pr-3 custom-scrollbar-light">
                                            <AnimatePresence mode='popLayout'>
                                                {cart.length === 0 ? (
                                                    <motion.div 
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="h-full flex flex-col items-center justify-center text-slate-500 text-center space-y-4 lg:space-y-6 py-6 lg:py-10"
                                                    >
                                                        <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white/5 rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-center border border-white/5 shadow-inner">
                                                            <Package size={32} lg:size={48} strokeWidth={1} className="opacity-20" />
                                                        </div>
                                                        <div>
                                                            <p className="text-base lg:text-lg font-black text-slate-400">Cart is Empty</p>
                                                            <p className="text-[10px] lg:text-xs font-medium text-slate-500 mt-1">Add items from the list to start</p>
                                                        </div>
                                                    </motion.div>
                                                ) : cart.map((item) => (
                                                    <motion.div 
                                                        layout
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        key={item.product} 
                                                        className="flex items-center justify-between p-3 lg:p-5 bg-white/5 backdrop-blur-sm rounded-[1rem] lg:rounded-[1.5rem] border border-white/10 hover:border-white/20 transition-all group"
                                                    >
                                                        <div className="flex-1 min-w-0 pr-2 lg:pr-4">
                                                            <p className="font-black text-sm lg:text-base truncate">{item.productName}</p>
                                                            <div className="flex items-center gap-2 lg:gap-3 mt-1">
                                                                <span className="text-[9px] lg:text-[10px] font-black text-primary-400 uppercase tracking-widest">₹{item.price}</span>
                                                                <span className="text-[9px] lg:text-[10px] text-slate-500 font-bold">× {item.quantity}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 lg:gap-5">
                                                            <p className="font-black text-lg lg:text-xl">₹{item.price * item.quantity}</p>
                                                            <button 
                                                                onClick={() => removeFromCart(item.product)}
                                                                className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center text-rose-400 hover:bg-rose-500/20 rounded-lg lg:rounded-xl transition-all"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>

                                        <div className="mt-6 lg:mt-8 pt-6 lg:pt-8 border-t border-white/10">
                                            <div className="flex justify-between items-end mb-6 lg:mb-8">
                                                <div>
                                                    <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] lg:tracking-[0.3em] mb-1">Total Payable</p>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xs lg:text-sm font-black text-slate-400">INR</span>
                                                        <span className="text-3xl lg:text-5xl font-black text-white tracking-tighter">
                                                            {calculateTotal().toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                {cart.length > 0 && (
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Saving ₹{(calculateTotal() * 0.05).toFixed(0)} today</p>
                                                    </div>
                                                )}
                                            </div>
                                            <button 
                                                disabled={cart.length === 0}
                                                onClick={() => setPosStep(2)}
                                                className="w-full h-14 lg:h-20 bg-primary-600 text-white rounded-[1rem] lg:rounded-[1.5rem] font-black text-xs lg:text-sm uppercase tracking-[0.2em] lg:tracking-[0.3em] shadow-2xl shadow-primary-600/30 hover:bg-primary-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 lg:gap-4 group"
                                            >
                                                Continue Checkout <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {posStep === 2 && (
                            <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-10 py-2 md:py-10 px-1 md:px-6">
                                <div className="text-center space-y-1 md:space-y-3">
                                    <div className="w-12 h-12 md:w-20 md:h-20 bg-primary-50 text-primary-600 rounded-[1rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-1 md:mb-6 shadow-xl shadow-primary-500/10">
                                        <User size={24} className="md:w-9 md:h-9" />
                                    </div>
                                    <h3 className="text-xl md:text-4xl font-black tracking-tighter uppercase leading-none">Customer Details</h3>
                                    <p className="text-secondary-500 text-[10px] md:text-base font-medium max-w-md mx-auto">Associate this sale with a customer profile for digital records.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 bg-white dark:bg-secondary-900 p-6 lg:p-10 rounded-[1.5rem] lg:rounded-[3rem] border border-secondary-100 dark:border-secondary-800 shadow-2xl">
                                    <div className="space-y-3 lg:space-y-4">
                                        <label className="text-[9px] lg:text-[10px] font-black uppercase text-secondary-400 ml-2 tracking-[0.2em]">Full Name / Alias</label>
                                        <div className="relative group">
                                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="e.g. John Doe"
                                                className="input-field pl-14 h-14 lg:h-18 rounded-xl lg:rounded-2xl bg-secondary-50 dark:bg-secondary-800 border-2 border-transparent focus:border-primary-500/20 focus:bg-white font-bold text-base lg:text-lg" 
                                                value={customerInfo.name}
                                                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3 lg:space-y-4">
                                        <label className="text-[9px] lg:text-[10px] font-black uppercase text-secondary-400 ml-2 tracking-[0.2em]">Contact Number</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                                            <input 
                                                type="tel" 
                                                required
                                                placeholder="e.g. 9876543210"
                                                className="input-field pl-14 h-14 lg:h-18 rounded-xl lg:rounded-2xl bg-secondary-50 dark:bg-secondary-800 border-2 border-transparent focus:border-primary-500/20 focus:bg-white font-bold text-base lg:text-lg" 
                                                value={customerInfo.phone}
                                                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3 lg:space-y-4 md:col-span-2">
                                        <label className="text-[9px] lg:text-[10px] font-black uppercase text-secondary-400 ml-2 tracking-[0.2em]">Physical Address (Optional)</label>
                                        <div className="relative group">
                                            <Package className="absolute left-5 top-4 lg:top-6 text-secondary-400 group-focus-within:text-primary-600 transition-colors" size={16} />
                                            <textarea 
                                                className="input-field pl-14 pt-4 lg:pt-6 h-20 lg:h-32 rounded-xl lg:rounded-2xl bg-secondary-50 dark:bg-secondary-800 border-2 border-transparent focus:border-primary-500/20 focus:bg-white font-medium resize-none text-sm lg:text-lg" 
                                                placeholder="Enter full address for home delivery..."
                                                value={customerInfo.address}
                                                onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 md:gap-5 pt-4 md:pt-10">
                                    <button onClick={() => setPosStep(1)} className="h-14 md:h-20 px-10 rounded-[1rem] md:rounded-[1.5rem] bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-300 font-black uppercase text-[10px] md:text-xs tracking-[0.2em] hover:bg-secondary-200 transition-all flex items-center justify-center gap-3">
                                        <ArrowLeft size={18} /> Back
                                    </button>
                                    <button 
                                        disabled={!customerInfo.name || !customerInfo.phone}
                                        onClick={() => setPosStep(3)} 
                                        className="flex-1 h-14 md:h-20 rounded-[1rem] md:rounded-[1.5rem] bg-primary-600 text-white font-black uppercase text-[10px] md:text-xs tracking-[0.3em] shadow-2xl shadow-primary-600/30 hover:bg-primary-500 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-30 flex items-center justify-center gap-4 group"
                                    >
                                        Next Step <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {posStep === 3 && (
                            <div className="w-full max-w-2xl mx-auto space-y-4 md:space-y-10 py-4 md:py-10 px-4 md:px-6 text-center">
                                <div className="space-y-1 lg:space-y-3">
                                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-emerald-50 text-emerald-600 rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-center mx-auto mb-4 lg:mb-6 shadow-xl shadow-emerald-500/10">
                                        <CreditCard size={28} lg:size={36} />
                                    </div>
                                    <h3 className="text-2xl lg:text-4xl font-black tracking-tighter uppercase">Settlement</h3>
                                    <p className="text-secondary-500 text-xs lg:text-base font-medium">Finalize the transaction by selecting a preferred payment gateway.</p>
                                </div>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-5">
                                    {[
                                        { id: 'Cash', icon: <Receipt size={20} /> },
                                        { id: 'UPI', icon: <CreditCard size={20} /> },
                                        { id: 'Scan & Pay', icon: <QrCode size={20} /> },
                                        { id: 'Udhar', icon: <Notebook size={20} /> }
                                    ].map(method => (
                                        <button 
                                            key={method.id}
                                            onClick={() => setCustomerInfo({...customerInfo, paymentMethod: method.id})}
                                            className={`p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-2 lg:gap-4 group ${
                                                customerInfo.paymentMethod === method.id 
                                                ? 'bg-primary-50 border-primary-600 text-primary-600 shadow-xl shadow-primary-500/5' 
                                                : 'bg-white dark:bg-secondary-900 border-secondary-100 dark:border-secondary-800 text-secondary-400 hover:border-primary-200'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                                                customerInfo.paymentMethod === method.id 
                                                ? 'bg-primary-600 text-white rotate-6' 
                                                : 'bg-secondary-50 dark:bg-secondary-800 text-secondary-400 group-hover:bg-secondary-100'
                                            }`}>
                                                {method.icon}
                                            </div>
                                            <span className="font-black text-[9px] lg:text-xs uppercase tracking-widest">{method.id}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6 md:p-10 bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary-600/20 transition-all duration-700"></div>
                                    
                                    <div className="relative z-10">
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] mb-4">Final Settlement Amount</p>
                                        <div className="flex items-center justify-center gap-2 mb-6 md:mb-10">
                                            <span className="text-lg md:text-xl font-black text-slate-400">₹</span>
                                            <h4 className="text-5xl md:text-7xl font-black tracking-tighter">{calculateTotal().toLocaleString()}</h4>
                                        </div>
                                        
                                        {customerInfo.paymentMethod === 'Scan & Pay' ? (
                                            paymentConfig ? (
                                                <button 
                                                    onClick={() => setIsQrModalOpen(true)}
                                                    className="w-full h-20 bg-white text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-3"
                                                >
                                                    Generate QR Code <QrCode size={24} />
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => navigate('/dashboard/payment-settings')}
                                                    className="w-full h-20 bg-amber-400 text-secondary-900 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3"
                                                >
                                                    Configure UPI Gateway <ArrowRight size={20} />
                                                </button>
                                            )
                                        ) : (
                                            <button 
                                                onClick={handleCheckout}
                                                className="w-full h-20 bg-primary-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-primary-500 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-4 group"
                                            >
                                                Finalize & Print Receipt <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <button onClick={() => setPosStep(2)} className="flex items-center justify-center gap-2 mx-auto text-secondary-400 font-black hover:text-primary-600 transition-colors uppercase text-[10px] tracking-widest">
                                    <ArrowLeft size={14} /> Edit Customer Info
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
 
            {/* QR Code Modal for Scan & Pay */}
            <Modal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} title="Scan & Pay" className="max-w-md">
                {paymentConfig && (
                    <div className="flex flex-col items-center p-4 space-y-6">
                        <div className="text-center">
                            <p className="text-sm font-bold text-secondary-500 uppercase tracking-widest mb-1">Pay To</p>
                            <p className="text-xl font-black text-secondary-900">{paymentConfig.merchantName}</p>
                        </div>
                        
                        <div className="p-4 bg-white rounded-3xl border-4 border-primary-100 shadow-inner">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${paymentConfig.upiId}&pn=${paymentConfig.merchantName}&am=${calculateTotal()}&cu=INR`)}`}
                                alt="Payment QR"
                                className="w-64 h-64"
                            />
                        </div>

                        <div className="w-full space-y-4">
                            <div className="space-y-1 text-center">
                                <p className="text-[10px] font-black uppercase text-secondary-400">Grand Total</p>
                                <p className="text-3xl font-black text-primary-600">₹{calculateTotal().toLocaleString()}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-secondary-400 ml-1">Enter UTR / Transaction ID</label>
                                <input 
                                    type="text" 
                                    placeholder="12 digit UTR number"
                                    className="input-field text-center font-bold tracking-widest h-14"
                                    value={utrNumber}
                                    onChange={(e) => setUtrNumber(e.target.value)}
                                />
                            </div>

                            <button 
                                onClick={handleCheckout}
                                className="w-full h-16 bg-primary-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-primary-500/20 hover:bg-primary-500 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-30 flex items-center justify-center gap-3 group"
                            >
                                Confirm Payment & Checkout
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Transaction Detail Modal with Return Feature */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Transaction Summary" className="max-w-3xl">
                {viewingSale && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-start border-b border-secondary-100 dark:border-secondary-800 pb-6">
                            <div>
                                <h2 className="text-2xl font-black">{viewingSale.transactionId || viewingSale._id.toUpperCase()}</h2>
                                <p className="text-sm text-secondary-500 mt-1">{formatDate(viewingSale.createdAt)} {new Date(viewingSale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handlePrint}
                                    className="p-2 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors flex items-center gap-2 px-4 font-black text-[10px] uppercase tracking-widest"
                                >
                                    <Printer size={16} /> Print Receipt
                                </button>
                                <div className={`px-4 py-2 rounded-2xl text-sm font-black uppercase border ${
                                    viewingSale.status === 'Returned' ? 'bg-red-50 text-red-600 border-red-100' :
                                    viewingSale.status === 'Partial Return' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                                    {viewingSale.status}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-white dark:bg-secondary-900 rounded-[2rem] border border-secondary-100 dark:border-secondary-800 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                    <User size={80} />
                                </div>
                                <p className="text-[10px] font-black uppercase text-secondary-400 mb-4 tracking-[0.2em]">Customer Information</p>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-2xl flex items-center justify-center">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black leading-none">{viewingSale.customerName}</p>
                                            <p className="text-sm font-medium text-secondary-500 mt-1">{viewingSale.customerPhone || 'Walk-in Customer'}</p>
                                        </div>
                                    </div>
                                    {viewingSale.customerAddress && (
                                        <div className="flex items-start gap-4 pt-2 border-t border-secondary-50 dark:border-secondary-800">
                                            <div className="w-12 h-12 bg-secondary-50 dark:bg-secondary-800 text-secondary-400 rounded-2xl flex items-center justify-center shrink-0">
                                                <Package size={20} />
                                            </div>
                                            <p className="text-xs font-medium text-secondary-500 italic leading-relaxed">{viewingSale.customerAddress}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 bg-secondary-900 text-white rounded-[2rem] shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                    <Store size={80} />
                                </div>
                                <p className="text-[10px] font-black uppercase text-secondary-400 mb-4 tracking-[0.2em]">Shop & Settlement</p>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center backdrop-blur-md">
                                            <Store size={20} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black leading-none">{viewingSale.user?.shopName}</p>
                                            <p className="text-xs font-black text-secondary-400 uppercase tracking-widest mt-1">Platform Member</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                                        <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center backdrop-blur-md">
                                            <CreditCard size={20} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black leading-none">{viewingSale.paymentMethod}</p>
                                            {viewingSale.utrNumber && (
                                                <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mt-1">Ref ID: {viewingSale.utrNumber}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-black uppercase text-secondary-400 tracking-widest ml-1">Purchased Items</h4>
                            <div className="space-y-3">
                                {viewingSale.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-5 bg-white dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800 rounded-[2rem] group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-secondary-50 rounded-2xl flex items-center justify-center text-secondary-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                                <Package size={24} />
                                            </div>
                                            <div>
                                                <p className="font-black">{item.product?.productName || 'Deleted Product'}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <p className="text-xs text-secondary-500">₹{item.price} x {item.quantity}</p>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">Batch: {item.batchNumber || 'N/A'}</span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">Exp: {formatDate(item.expiryDate)}</span>
                                                </div>
                                                {item.isReturned && (
                                                    <div className="mt-1">
                                                        <span className="text-[10px] font-black uppercase text-red-500 bg-red-50 px-2 py-0.5 rounded-full inline-block">Returned</span>
                                                        <p className="text-[10px] text-red-400 mt-1 italic font-medium">Reason: {item.returnReason || 'No reason provided'}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-lg font-black text-secondary-700">₹{item.total.toLocaleString()}</p>
                                                <p className="text-[10px] text-secondary-400 uppercase font-black">Subtotal</p>
                                            </div>
                                            {!item.isReturned && (
                                                <button 
                                                    onClick={() => handleReturnItem(item.product?._id, item.quantity)}
                                                    className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors"
                                                    title="Mark as Returned"
                                                >
                                                    <Undo2 size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-secondary-100 dark:border-secondary-800 flex justify-between items-center px-4">
                            <p className="text-xl font-black uppercase text-secondary-400 tracking-[0.2em]">Total Paid</p>
                            <p className="text-5xl font-black text-primary-600">₹{viewingSale.totalAmount.toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Return Reason Modal */}
            <Modal isOpen={isReturnModalOpen} onClose={() => setIsReturnModalOpen(false)} title="Return Item" className="max-w-md">
                <div className="space-y-6">
                    <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-[2rem] border border-red-100 dark:border-red-800/30 flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                            <Undo2 size={24} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-red-900 dark:text-red-100">Return Confirmation</p>
                            <p className="text-xs text-red-600 dark:text-red-400">Inventory will be restocked automatically.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-secondary-400 ml-1">Reason for Return</label>
                        <textarea 
                            className="input-field pt-4 h-32 text-sm" 
                            placeholder="Please explain why the customer is returning this item..."
                            value={returnReasonInput}
                            onChange={(e) => setReturnReasonInput(e.target.value)}
                            autoFocus
                        ></textarea>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setIsReturnModalOpen(false)} className="flex-1 h-16 rounded-2xl bg-secondary-100 text-secondary-600 font-black uppercase text-xs tracking-[0.2em] hover:bg-secondary-200 transition-all">Cancel</button>
                        <button 
                            onClick={confirmReturn}
                            className="flex-[2] h-16 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-xl shadow-red-500/20 hover:bg-red-500 transition-all flex items-center justify-center gap-3"
                        >
                            Confirm Return <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Hidden Professional Printable Tax Invoice */}
            <div id="printable-receipt" className="hidden print:block p-12 bg-white text-black min-h-screen font-sans">
                {viewingSale && (
                    <div className="max-w-[800px] mx-auto">
                        {/* Print Styles */}
                        <style dangerouslySetInnerHTML={{ __html: `
                            @media print {
                                body * { visibility: hidden; }
                                #printable-receipt, #printable-receipt * { visibility: visible; }
                                #printable-receipt { 
                                    position: absolute; 
                                    left: 0; 
                                    top: 0; 
                                    width: 100%; 
                                    padding: 40px !important;
                                }
                                @page { size: auto; margin: 0; }
                                .no-print { display: none !important; }
                            }
                        `}} />

                        {/* Invoice Header */}
                        <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
                            <div className="flex gap-6">
                                <div className="w-20 h-20 bg-black text-white rounded-2xl flex items-center justify-center text-4xl font-black">
                                    {viewingSale.user?.shopName?.charAt(0) || 'M'}
                                </div>
                                <div>
                                    <h1 className="text-5xl font-black tracking-tighter uppercase mb-2 leading-none">{viewingSale.user?.shopName || 'StockSaathi'}</h1>
                                    <div className="flex items-center gap-3">
                                        <p className="text-sm font-black uppercase tracking-[0.2em] text-secondary-500">Retail Partner</p>
                                        <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                            ID: {viewingSale.user?.shopId || 'MS-GEN-00-000000'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-4xl font-black uppercase tracking-widest text-primary-600">Tax Invoice</h2>
                                <p className="text-sm font-bold text-secondary-400 mt-1 uppercase">Original for Recipient</p>
                            </div>
                        </div>

                        {/* Business Details Grid */}
                        <div className="grid grid-cols-2 gap-12 mb-12">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase text-secondary-400 mb-2 tracking-widest border-b border-secondary-100 pb-1">Sold By</h4>
                                    <p className="text-lg font-black uppercase">{viewingSale.user?.shopName}</p>
                                    <p className="text-sm font-medium leading-relaxed mt-1">{viewingSale.user?.address || 'Business Address, Street Name, City, State'}</p>
                                    <p className="text-sm font-black mt-2">GSTIN: <span className="font-mono">{viewingSale.user?.gstNumber || '27AAACG1234A1Z1'}</span></p>
                                    <p className="text-sm font-black">Contact: {viewingSale.user?.phone || '+91 98765 43210'}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-secondary-50 p-6 rounded-3xl border border-secondary-100">
                                    <h4 className="text-[10px] font-black uppercase text-secondary-400 mb-2 tracking-widest border-b border-secondary-200 pb-1">Bill To</h4>
                                    <p className="text-lg font-black uppercase">{viewingSale.customerName}</p>
                                    <p className="text-sm font-bold mt-1 text-primary-600">{viewingSale.customerPhone}</p>
                                    <p className="text-sm font-medium mt-1 italic">{viewingSale.customerAddress || 'Customer Address not provided'}</p>
                                </div>
                                <div className="flex justify-between px-2">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-secondary-400">Invoice ID</p>
                                        <p className="font-mono font-black text-sm">{viewingSale.transactionId || viewingSale._id.toUpperCase()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-secondary-400">Date of Sale</p>
                                        <p className="font-black text-sm">{formatDate(viewingSale.createdAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-12">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-black text-white">
                                        <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-left">#</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-left">Description of Goods</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-left">Batch/Expiry</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-center">Qty</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-right">Unit Price</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-black border-b-2 border-black">
                                    {viewingSale.items.map((item, idx) => (
                                        <tr key={idx} className={item.isReturned ? 'bg-red-50' : ''}>
                                            <td className="py-5 px-4 text-sm font-black text-secondary-400">{String(idx + 1).padStart(2, '0')}</td>
                                            <td className="py-5 px-4">
                                                <p className="font-black uppercase text-sm">{item.product?.productName || 'RETAIL ITEM'}</p>
                                                {item.isReturned && <p className="text-[9px] font-black text-red-500 uppercase mt-1">Returned: {item.returnReason}</p>}
                                            </td>
                                            <td className="py-5 px-4">
                                                <p className="text-xs font-bold font-mono">{item.batchNumber || 'N/A'}</p>
                                                <p className="text-[10px] text-secondary-500 font-bold uppercase">{formatDate(item.expiryDate)}</p>
                                            </td>
                                            <td className="py-5 px-4 text-center font-black">{item.quantity}</td>
                                            <td className="py-5 px-4 text-right font-bold text-sm">₹{item.price.toLocaleString()}</td>
                                            <td className="py-5 px-4 text-right font-black text-sm">₹{item.total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary & Totals */}
                        <div className="grid grid-cols-2 gap-12 items-end">
                            <div>
                                <div className="border-2 border-black p-6 rounded-3xl space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 border-b border-black pb-2">Payment Summary</h4>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-secondary-500">Method</span>
                                        <span className="font-black uppercase">{viewingSale.paymentMethod}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-secondary-500">Status</span>
                                        <span className={`font-black uppercase ${viewingSale.paymentMethod === 'Udhar' ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {viewingSale.paymentMethod === 'Udhar' ? 'UNPAID / UDHAR' : 'Paid / Confirmed'}
                                        </span>
                                    </div>
                                    {viewingSale.utrNumber && (
                                        <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-black">
                                            <span className="font-bold text-secondary-500">Ref ID/UTR</span>
                                            <span className="font-mono font-black">{viewingSale.utrNumber}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm px-2">
                                    <span className="font-black uppercase tracking-widest text-secondary-400">Net Amount</span>
                                    <span className="font-black">₹{viewingSale.totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm px-2">
                                    <span className="font-black uppercase tracking-widest text-secondary-400">Total Tax (GST 0%)</span>
                                    <span className="font-black">₹0.00</span>
                                </div>
                                <div className="bg-black text-white p-6 rounded-[2rem] flex justify-between items-center shadow-xl shadow-black/10">
                                    <span className="text-xl font-black uppercase tracking-tighter">Grand Total</span>
                                    <span className="text-4xl font-black">₹{viewingSale.totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Formal Footer */}
                        <div className="mt-20">
                            <div className="grid grid-cols-2 gap-24 mb-12">
                                <div className="text-center pt-8 border-t border-black">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Customer Signature</p>
                                    <p className="text-[9px] text-secondary-400">I accept the terms and goods received in good condition.</p>
                                </div>
                                <div className="text-center pt-8 border-t border-black relative">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-4">
                                        <p className="text-[8px] font-black uppercase text-secondary-300 transform -rotate-12">AUTHORIZED SIGNATORY</p>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">For {viewingSale.user?.shopName}</p>
                                    <p className="text-[9px] text-secondary-400">Authorized Signatory</p>
                                </div>
                            </div>

                            <div className="text-center space-y-2 pt-12 border-t-2 border-dashed border-secondary-200">
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-secondary-400">Terms & Conditions</p>
                                <p className="text-[9px] text-secondary-500 max-w-lg mx-auto leading-relaxed">
                                    1. Goods once sold will not be taken back. 2. Any discrepancies should be reported within 24 hours. 3. This is a computer generated invoice and does not require a physical signature for authentication.
                                </p>
                                <p className="text-sm font-black mt-4 uppercase tracking-tighter">*** Thank You for Shopping with {viewingSale.user?.shopName} ***</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="Live Barcode Scanner" className="max-w-lg">
                <BarcodeScanner 
                    isOpen={isScannerOpen}
                    onScanSuccess={handleScanSuccess}
                    onScanError={(err) => console.error(err)}
                />
            </Modal>
        </div>
    );
};

export default Sales;
