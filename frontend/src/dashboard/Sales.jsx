import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, ShoppingCart, Trash2,
    User, Phone, CreditCard, Receipt,
    ChevronRight, Package, X, RefreshCcw,
    Undo2, ArrowRight, ArrowLeft, QrCode, Printer, Share2,
    Barcode, Scan, Notebook, Store, AlertTriangle, ShieldCheck, Zap, Layers, Globe, Calendar
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
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });
    const [loadingMore, setLoadingMore] = useState(false);
    const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7)); // Default: Current Month

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
    const [pendingSyncCount, setPendingSyncCount] = useState(0);

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
        const offlineSales = await posStore.getOfflineSales();
        setPendingSyncCount(offlineSales.length);

        if (!navigator.onLine || isSyncing || offlineSales.length === 0) return;

        setIsSyncing(true);
        const toastId = toast.loading(`Uplinking ${offlineSales.length} cached transactions...`);
        for (const sale of offlineSales) {
            try {
                const { id, ...saleData } = sale;
                await api.post('/sales', saleData);
                await posStore.deleteOfflineSale(id);
                setPendingSyncCount(prev => prev - 1);
            } catch (error) {
                console.error("Sync failed for sale:", sale);
            }
        }
        toast.dismiss(toastId);
        toast.success("Ecosystem Synchronized");
        setIsSyncing(false);
        fetchSales();
    };

    const fetchPaymentConfig = async () => {
        try {
            const res = await api.get('/payments');
            setPaymentConfig(res.data.data);
        } catch (error) {
            console.error("Failed to fetch payment config");
        }
    };

    useEffect(() => {
        fetchSales(1, false);
    }, [monthFilter]);

    const fetchSales = async (pageNum = 1, append = false) => {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const res = await api.get(`/sales?page=${pageNum}&limit=10&month=${monthFilter}&search=${transactionSearch}`);
            const { data, pagination: pagData } = res.data;

            if (append) {
                setSales(prev => [...prev, ...data]);
            } else {
                setSales(data);
            }

            setPagination(pagData);
            setPage(pageNum);

            if (pageNum === 1) await posStore.cacheSales(data);
        } catch (error) {
            console.error("Failed to fetch sales, loading from cache...");
            const cachedSales = await posStore.getCachedSales();
            if (cachedSales.length > 0 && pageNum === 1) setSales(cachedSales);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = () => {
        if (page < pagination.pages) {
            fetchSales(page + 1, true);
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

    const handleReturn = async () => {
        if (!itemToReturn || !returnReasonInput) {
            toast.error("Protocol Error: Reason required");
            return;
        }

        try {
            const res = await api.post('/sales/return-product', {
                saleId: viewingSale._id,
                productId: itemToReturn.product?._id || itemToReturn.product,
                quantity: itemToReturn.quantity,
                returnReason: returnReasonInput
            });

            if (res.data.success) {
                toast.success("Registry Adjusted: Product Returned");
                setIsReturnModalOpen(false);
                setReturnReasonInput('');
                setItemToReturn(null);
                // Refresh data
                fetchSales(page, false);
                setIsViewModalOpen(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Return Protocol Failed");
        }
    };

    const handleTransactionSearch = async (e) => {
        if (e) e.preventDefault();
        // If searching, we temporarily clear the month filter to find the record across all time
        // but keep it as is if the user wants to search within the month. 
        // For better UX, we'll search globally if a specific term is entered.
        fetchSales(1, false);
    };

    const handleScanSuccess = (decodedText) => {
        setIsScannerOpen(false);
        setSearchTerm(decodedText);
        const foundProduct = products.find(p => p.barcode === decodedText);
        if (foundProduct) {
            addToCart(foundProduct);
            toast.success(`Product Scanned: ${foundProduct.productName} Added`);
        } else {
            toast.error("Unknown product identified");
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
                toast.error("Product out of stock");
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
                toast.success("Offline Active: Sale cached locally");
                syncOfflineSales();
            } else {
                await api.post('/sales', saleData);
                toast.success("Transaction committed to cloud");
            }
            setCart([]);
            setCustomerInfo({ name: 'Guest', phone: '', paymentMethod: 'Cash' });
            setUtrNumber('');
            setIsSaleModalOpen(false);
            setIsQrModalOpen(false);
            setIsQrModalOpen(false);

            // If new sale is in a different month, reset filter to current month to see it
            const currentMonth = new Date().toISOString().slice(0, 7);
            if (monthFilter !== currentMonth) {
                setMonthFilter(currentMonth);
            } else {
                fetchSales(1, false);
            }
            fetchProducts();
        } catch (error) {
            toast.error(error.response?.data?.message || "Protocol Failure");
        }
    };

    const filteredProducts = products.filter(p => {
        const searchLower = searchTerm.toLowerCase();
        return p.productName.toLowerCase().includes(searchLower) ||
            p.barcode?.toLowerCase().includes(searchLower) ||
            p.category?.name?.toLowerCase().includes(searchLower) ||
            p.batches?.some(b => b.batchNumber?.toLowerCase().includes(searchLower));
    });

    const handleShare = (sale) => {
        const url = `${window.location.origin}/invoice/${sale.transactionId || sale._id}`;
        const message = `Hi ${sale.customerName || 'Customer'}, here is your digital receipt from ${sale.user?.shopName || 'our shop'}: ${url}`;
        const whatsappUrl = `https://wa.me/${sale.customerPhone ? '91' + sale.customerPhone.replace(/\D/g, '') : ''}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        toast.success("Opening WhatsApp...");
    };

    const handlePrintInvoice = (sale) => {
        const printWindow = window.open('', '_blank');
        const shopInfo = sale.user || {};

        let subtotal = 0;
        let returnsTotal = 0;

        const itemsHtml = sale.items.map(item => {
            const itemTotal = item.price * item.quantity;
            if (item.isReturned) {
                returnsTotal += itemTotal;
            } else {
                subtotal += itemTotal;
            }

            return `
                <tr style="${item.isReturned ? 'background-color: #fff1f2; opacity: 0.7;' : ''}">
                    <td style="padding: 12px; border-bottom: 1px solid #f1f5f9;">
                        <div style="font-weight: 800; color: #1e293b; font-size: 10pt; text-transform: uppercase; ${item.isReturned ? 'text-decoration: line-through;' : ''}">
                            ${item.product?.productName || item.productName}
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;">
                            ${item.isReturned ? `<span style="font-size: 6pt; font-weight: 900; color: #e11d48; background: white; padding: 1px 4px; border: 1px solid #e11d48; border-radius: 4px;">RETURNED</span>` : ''}
                            ${item.batchNumber ? `<span style="font-size: 6pt; font-weight: 900; color: #6366f1; background: #eef2ff; padding: 1px 4px; border-radius: 4px;">BATCH: ${item.batchNumber}</span>` : ''}
                            ${item.expiryDate ? `<span style="font-size: 6pt; font-weight: 900; color: #f43f5e; background: #fff1f2; padding: 1px 4px; border-radius: 4px;">EXP: ${new Date(item.expiryDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase()}</span>` : ''}
                        </div>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: center; font-weight: 700; color: #475569; ${item.isReturned ? 'text-decoration: line-through;' : ''}">${item.quantity}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: #475569; ${item.isReturned ? 'text-decoration: line-through;' : ''}">₹${item.price.toLocaleString()}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 900; color: #1e293b; ${item.isReturned ? 'text-decoration: line-through;' : ''}">₹${itemTotal.toLocaleString()}</td>
                </tr>
            `;
        }).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice - ${sale.transactionId || sale._id.toUpperCase()}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
                        @page { size: A4; margin: 0; }
                        body { 
                            margin: 0; 
                            padding: 20mm; 
                            font-family: 'Inter', sans-serif; 
                            color: #1e293b; 
                            background: white; 
                        }
                        .invoice-container { max-width: 100%; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 4px solid #4f46e5; padding-bottom: 20px; }
                        .shop-details { flex: 1; }
                        .shop-name { font-size: 24pt; font-weight: 900; color: #4f46e5; letter-spacing: -1px; text-transform: uppercase; margin-bottom: 5px; }
                        .shop-sub { font-size: 9pt; color: #64748b; font-weight: 600; max-width: 300px; line-height: 1.4; }
                        .invoice-label { text-align: right; }
                        .label-text { font-size: 32pt; font-weight: 900; color: #f1f5f9; text-transform: uppercase; line-height: 1; }
                        .id-text { font-size: 10pt; font-weight: 800; color: #1e293b; margin-top: 10px; }
                        
                        .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; margin-bottom: 40px; }
                        .meta-box h4 { font-size: 8pt; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px; }
                        .meta-content { font-size: 10pt; font-weight: 700; color: #1e293b; }
                        .meta-content div { margin-bottom: 4px; }

                        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                        .items-table th { background: #f8fafc; padding: 12px; text-align: left; font-size: 8pt; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #e2e8f0; }
                        
                        .totals-container { display: flex; justify-content: flex-end; }
                        .totals-box { width: 320px; background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9; }
                        .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                        .total-row:last-child { margin-bottom: 0; padding-top: 12px; border-top: 2px solid #e2e8f0; }
                        
                        .footer { margin-top: 60px; text-align: center; font-size: 8pt; color: #94a3b8; font-weight: 600; border-top: 1px solid #f1f5f9; padding-top: 20px; }
                        .return-notice { font-size: 7pt; color: #e11d48; font-weight: 800; text-transform: uppercase; margin-top: 5px; }
                    </style>
                </head>
                <body>
                    <div class="invoice-container">
                        <div class="header">
                            <div class="shop-details">
                                <div class="shop-name">${shopInfo.shopName || 'RETAIL SAATHI'}</div>
                                <div class="shop-sub">
                                    ${shopInfo.address || 'Smart Retail Node 101, Business District'}<br>
                                    Ph: ${shopInfo.phone || 'N/A'} | Email: ${shopInfo.email || ''}
                                </div>
                            </div>
                            <div class="invoice-label">
                                <div class="label-text">INVOICE</div>
                                <div class="id-text">ID: #${sale.transactionId || sale._id.slice(-8).toUpperCase()}</div>
                                ${sale.status === 'Partial Return' || sale.status === 'Returned' ? `<div class="return-notice">ADJUSTED FOR RETURNS</div>` : ''}
                            </div>
                        </div>

                        <div class="meta-grid">
                            <div class="meta-box">
                                <h4>Billed To</h4>
                                <div class="meta-content">
                                    <div style="font-size: 12pt; color: #4f46e5;">${sale.customerName}</div>
                                    <div>Ph: ${sale.customerPhone || 'N/A'}</div>
                                </div>
                            </div>
                            <div class="meta-box" style="text-align: right;">
                                <h4>Payment Details</h4>
                                <div class="meta-content">
                                    <div>Date: ${formatDate(sale.createdAt)}</div>
                                    <div>Method: ${sale.paymentMethod}</div>
                                    ${sale.utrNumber ? `<div>UTR: ${sale.utrNumber}</div>` : ''}
                                </div>
                            </div>
                        </div>

                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th style="text-align: center;">Qty</th>
                                    <th style="text-align: right;">Rate</th>
                                    <th style="text-align: right;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>

                        <div class="totals-container">
                            <div class="totals-box">
                                <div class="total-row">
                                    <span style="font-size: 8pt; font-weight: 800; color: #64748b; text-transform: uppercase;">Gross Total</span>
                                    <span style="font-weight: 700; color: #64748b;">₹${(subtotal + returnsTotal).toLocaleString()}</span>
                                </div>
                                ${returnsTotal > 0 ? `
                                <div class="total-row">
                                    <span style="font-size: 8pt; font-weight: 800; color: #e11d48; text-transform: uppercase;">Returns Adjustment</span>
                                    <span style="font-weight: 700; color: #e11d48;">- ₹${returnsTotal.toLocaleString()}</span>
                                </div>
                                ` : ''}
                                <div class="total-row">
                                    <span style="font-size: 10pt; font-weight: 900; color: #1e293b; text-transform: uppercase;">Net Payable</span>
                                    <span style="font-size: 14pt; font-weight: 900; color: #4f46e5;">₹${subtotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div class="footer">
                            This is a digitally generated invoice by StockSaathi Retail OS.<br>
                            Thank you for your business!
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();

        // Trigger print after content is loaded
        const triggerPrint = () => {
            if (printWindow && !printWindow.closed) {
                printWindow.print();
                printWindow.close();
            }
        };

        printWindow.onload = () => setTimeout(triggerPrint, 500);
        setTimeout(triggerPrint, 1500);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    };

    return (
        <div className="space-y-6 pb-10 font-jakarta">
            {/* Status Indicators */}
            <AnimatePresence>
                {(!isOnline || pendingSyncCount > 0) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, y: -20 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -20 }}
                        className={`rounded-2xl border px-4 py-3 text-white shadow-lg sm:px-5 mb-4 ${!isOnline ? 'bg-rose-600 border-rose-500/30' : 'bg-indigo-600 border-indigo-500/30'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/20">
                                    {!isOnline ? <Globe size={18} /> : <RefreshCcw size={18} className={isSyncing ? 'animate-spin' : ''} />}
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest">
                                        {!isOnline ? 'Offline Active' : 'Synchronization Pending'}
                                    </p>
                                    <p className="text-[10px] font-bold opacity-90 uppercase tracking-tight">
                                        {pendingSyncCount} transaction(s) queued in local registry.
                                    </p>
                                </div>
                            </div>
                            {isOnline && pendingSyncCount > 0 && (
                                <button
                                    onClick={syncOfflineSales}
                                    disabled={isSyncing}
                                    className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
                                >
                                    {isSyncing ? 'Uplinking...' : 'Sync Now'}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Simplified Terminal Header */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-slate-100 dark:border-slate-800 shadow-sm mb-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="h-1 w-8 bg-indigo-400 rounded-full"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Terminal Node</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                            POS <span className="text-indigo-600">Terminal</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                            High-performance transaction engine for your retail ecosystem.
                        </p>
                    </div>
                    <div className="flex w-full sm:w-auto gap-3">
                        <button
                            onClick={() => setIsSaleModalOpen(true)}
                            className="flex-1 sm:flex-none h-14 px-10 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                        >
                            <Plus size={20} /> New Sale
                        </button>
                    </div>
                </div>
            </div>

            {/* Tactical Control Bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Registry Period</span>
                        <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600 group-focus-within:scale-110 transition-transform pointer-events-none" size={16} />
                            <input
                                type="month"
                                className="h-11 w-full sm:w-44 pl-11 pr-3 rounded-lg border border-slate-300 bg-white text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-600 dark:bg-slate-950 dark:border-white/5 dark:text-white shadow-sm transition-all"
                                value={monthFilter}
                                onChange={(e) => setMonthFilter(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row lg:items-end lg:w-auto flex-1 lg:justify-end">
                        <form onSubmit={handleTransactionSearch} className="flex gap-2 lg:w-80">
                            <div className="flex flex-col gap-1.5 flex-1">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Archive Search</span>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                                    <input
                                        type="text" placeholder="ID, Name, or Mobile..."
                                        className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-3 text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 shadow-sm"
                                        value={transactionSearch} onChange={(e) => setTransactionSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={searching} className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 shadow-sm self-end">
                                {searching ? '...' : 'Find'}
                            </button>
                        </form>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">New Entry</span>
                            <button onClick={() => setIsSaleModalOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                                <Plus size={20} /> New Sale
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sales Registry */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="min-w-[980px] w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Transaction ID</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Merchant Client</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Settlement</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
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
                                        <p className="mt-1 text-xs text-slate-500">{sale.customerPhone || 'Take from store'}</p>
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
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sale.status === 'Returned' || sale.status === 'Partial Return' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' :
                                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                            }`}>
                                            {sale.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleShare(sale)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900"
                                                title="Share via WhatsApp"
                                            >
                                                <Share2 size={16} />
                                            </button>
                                            <button onClick={() => { setViewingSale(sale); setIsViewModalOpen(true); }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                                <Receipt size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pagination.pages > page && (
                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="inline-flex h-11 items-center justify-center gap-2 px-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 shadow-sm"
                        >
                            {loadingMore ? (
                                <RefreshCcw size={14} className="animate-spin" />
                            ) : (
                                <ChevronRight size={14} className="rotate-90" />
                            )}
                            Load More Transactions
                        </button>
                    </div>
                )}
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
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Transaction Summary" className="max-w-2xl">
                {viewingSale && (
                    <div className="py-4 md:py-8 space-y-6 md:space-y-12">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-indigo-600 border border-indigo-100 dark:border-indigo-500/20 shadow-inner"><Receipt size={30} className="md:w-9 md:h-9" /></div>
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight dark:text-white leading-none">Receipt Registry</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">ID: {viewingSale.transactionId || viewingSale._id.toUpperCase()}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 dark:border-white/5 space-y-6 md:space-y-8">
                            <div className="flex justify-between items-start pb-6 md:pb-8 border-b border-slate-200 dark:border-white/10">
                                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Merchant Client</p><p className="font-black text-base md:text-lg dark:text-white leading-tight">{viewingSale.customerName}</p></div>
                                <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Date</p><p className="font-black text-base md:text-lg dark:text-white leading-tight">{formatDate(viewingSale.createdAt)}</p></div>
                            </div>
                            <div className="space-y-5 md:space-y-6">
                                {viewingSale.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center group">
                                        <div className="flex-1 pr-4">
                                            <div className="flex items-center gap-2">
                                                <p className={`font-black text-xs md:text-sm uppercase dark:text-white leading-tight ${item.isReturned ? 'line-through text-slate-400' : ''}`}>{item.product?.productName || item.productName}</p>
                                                {item.isReturned && <span className="text-[8px] px-1.5 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-md font-bold">RETURNED</span>}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 md:mt-2">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.quantity} Unit(s) @ ₹{item.price}</p>
                                                {item.batchNumber && (
                                                    <span className="text-[8px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-md font-bold">BATCH: {item.batchNumber}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className={`font-black text-sm md:text-base dark:text-white ${item.isReturned ? 'line-through text-slate-400' : ''}`}>₹{item.total || (item.price * item.quantity)}</p>
                                            {!item.isReturned && (
                                                <button
                                                    onClick={() => { setItemToReturn(item); setIsReturnModalOpen(true); }}
                                                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all"
                                                    title="Return Product"
                                                >
                                                    <Undo2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-6 md:pt-8 border-t border-slate-200 dark:border-white/10 space-y-4">
                                {viewingSale.items.some(i => i.isReturned) && (
                                    <>
                                        <div className="flex justify-between items-center opacity-60">
                                            <p className="text-[9px] font-black uppercase tracking-widest">Gross Total</p>
                                            <p className="font-bold">₹{viewingSale.items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()}</p>
                                        </div>
                                        <div className="flex justify-between items-center text-rose-500">
                                            <p className="text-[9px] font-black uppercase tracking-widest">Returns Deduction</p>
                                            <p className="font-bold">- ₹{viewingSale.items.reduce((acc, item) => item.isReturned ? acc + (item.price * item.quantity) : acc, 0).toLocaleString()}</p>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] md:tracking-[0.3em]">Net Settlement</p>
                                    <p className="text-2xl md:text-3xl font-black dark:text-white tracking-tighter">₹{viewingSale.items.reduce((acc, item) => item.isReturned ? acc : acc + (item.price * item.quantity), 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                            <button onClick={() => handlePrintInvoice(viewingSale)} className="h-14 md:h-20 flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl md:rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3"><Printer size={18} /> Print</button>
                            <button onClick={() => handleShare(viewingSale)} className="h-14 md:h-20 flex-1 bg-emerald-600 text-white rounded-xl md:rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3"><Share2 size={18} /> Share WhatsApp</button>
                            <button onClick={() => setIsViewModalOpen(false)} className="h-14 md:h-20 flex-1 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black uppercase text-[10px] tracking-widest">Acknowledge</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Return Reason Modal */}
            <Modal isOpen={isReturnModalOpen} onClose={() => setIsReturnModalOpen(false)} title="Return Protocol" className="max-w-md">
                <div className="py-6 space-y-8">
                    <div className="p-8 bg-rose-500 text-white rounded-[2.5rem] space-y-4 shadow-xl shadow-rose-500/20 rotate-1">
                        <Undo2 size={48} />
                        <div>
                            <h4 className="text-xl font-black uppercase tracking-tight">Initiate Return?</h4>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">This will restock the item and mark the transaction.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-4">Return Reason</label>
                        <textarea
                            required
                            placeholder="e.g. Expired, Damaged, Customer choice..."
                            className="w-full p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-white/5 outline-none focus:border-rose-500 h-32 resize-none font-bold dark:text-white"
                            value={returnReasonInput}
                            onChange={(e) => setReturnReasonInput(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setIsReturnModalOpen(false)} className="h-14 flex-1 bg-slate-50 dark:bg-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-500">Abort</button>
                        <button onClick={handleReturn} className="h-14 flex-[2] bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-all">Confirm Return</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="Optical Uplink" className="max-w-lg">
                <BarcodeScanner isOpen={isScannerOpen} onScanSuccess={handleScanSuccess} onScanError={(err) => console.error(err)} />
            </Modal>
        </div>
    );
};

export default Sales;
