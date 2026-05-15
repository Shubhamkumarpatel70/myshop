import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, ShoppingCart, Trash2,
    User, Phone, CreditCard, Receipt,
    ChevronRight, Package, X, RefreshCcw,
    Undo2, ArrowRight, ArrowLeft, QrCode, Printer, Share2,
    Barcode, Scan, Notebook, Store, AlertTriangle, ShieldCheck, Zap, Layers, Globe, Calendar,
    Minus, ChevronLeft, Wallet
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
    const [posStep, setPosStep] = useState(1); // 1: Products, 2: Cart, 3: Customer, 4: Payment
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
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [openingCash, setOpeningCash] = useState('');

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
                toast.success("Inventory sync");
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
                fetchSales(page, false);
                setIsViewModalOpen(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Return Protocol Failed");
        }
    };

    const handleTransactionSearch = async (e) => {
        if (e) e.preventDefault();
        fetchSales(1, false);
    };

    const handleScanSuccess = (decodedText) => {
        setIsScannerOpen(false);
        setSearchTerm(decodedText);
        const foundProduct = products.find(p => p.barcode === decodedText);
        if (foundProduct) {
            addToCart(foundProduct);
        } else {
            toast.error("Unknown product identified");
        }
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.product === product._id);
        if (existingItem) {
            if (existingItem.quantity >= product.quantity) {
                toast.error("Database limit reached");
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
        toast.success((t) => (
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <ShoppingCart size={18} />
                </div>
                <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-white">{product.productName}</p>
                    <p className="text-[9px] font-bold text-indigo-200 uppercase">Added to cart</p>
                </div>
            </div>
        ), {
            style: { borderRadius: '20px', background: '#0f172a', padding: '12px 20px', border: '1px solid rgba(255,255,255,0.1)' },
            duration: 2000
        });
    };

    const updateCartQty = (productId, delta) => {
        setCart(cart.map(item => {
            if (item.product === productId) {
                const newQty = item.quantity + delta;
                if (newQty < 1) return item;
                // Check stock
                const product = products.find(p => p._id === productId);
                if (product && newQty > product.quantity) {
                    toast.error("Insufficient Stock");
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product !== productId));
        toast.error("Removed from cart");
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
                toast.success("Transaction Successfully Saved");
            }
            setCart([]);
            setCustomerInfo({ name: 'Guest', phone: '', paymentMethod: 'Cash' });
            setUtrNumber('');
            setIsSaleModalOpen(false);
            setIsQrModalOpen(false);
            setPosStep(1);

            const currentMonth = new Date().toISOString().slice(0, 7);
            if (monthFilter !== currentMonth) {
                setMonthFilter(currentMonth);
            } else {
                fetchSales(1, false);
            }
            fetchProducts();
        } catch (error) {
            if (error.response?.status === 403 && error.response?.data?.message?.toLowerCase().includes('shift')) {
                setIsShiftModalOpen(true);
                toast.error("Shift Required to committing transaction");
            } else {
                toast.error(error.response?.data?.message || "Protocol Failure");
            }
        }
    };

    const handleOpenShiftDirect = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/shifts/open', { openingCash: Number(openingCash) });
            if (res.data.success) {
                toast.success("Shift Opened! You can now commit the transaction.");
                setIsShiftModalOpen(false);
                setOpeningCash('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to initialize shift");
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
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                        @page { margin: 0; size: 80mm auto; }
                        body { font-family: 'Inter', sans-serif; color: #1e293b; margin: 0; padding: 10px; font-size: 8pt; line-height: 1.3; width: 80mm; box-sizing: border-box; }
                        .header { text-align: center; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px; margin-bottom: 10px; }
                        .shop-name { font-size: 14pt; font-weight: 900; text-transform: uppercase; margin: 0; color: #0f172a; }
                        .shop-details { font-size: 7pt; color: #64748b; margin-top: 3px; font-weight: 500; }
                        .invoice-title { background: #0f172a; color: white; display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 7pt; font-weight: 900; letter-spacing: 1px; margin-top: 5px; }
                        
                        .bill-info { margin-bottom: 15px; }
                        .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
                        .label { font-size: 6pt; font-weight: 900; color: #94a3b8; text-transform: uppercase; }
                        .value { font-size: 7.5pt; font-weight: 700; color: #1e293b; }
                        
                        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                        th { border-bottom: 1px solid #1e293b; padding: 6px 4px; text-align: left; font-size: 6pt; font-weight: 900; color: #0f172a; text-transform: uppercase; }
                        td { padding: 6px 4px; border-bottom: 1px dashed #f1f5f9; vertical-align: top; }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        
                        .summary { margin-top: 5px; }
                        .summary-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 8pt; }
                        .summary-row.total { border-top: 1px solid #0f172a; margin-top: 5px; padding-top: 5px; font-size: 12pt; font-weight: 900; color: #0f172a; }
                        
                        .footer { margin-top: 20px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 6.5pt; color: #94a3b8; }
                        .terms { font-weight: 700; color: #64748b; margin-bottom: 3px; text-transform: uppercase; font-size: 6pt; }
                        @media print { 
                            body { width: 80mm; } 
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body onload="window.print(); window.close();">
                    <div class="header">
                        <h1 class="shop-name">${shopInfo.shopName || 'RETAIL SAATHI'}</h1>
                        <div class="shop-details">
                            ${shopInfo.address || 'Business Address Not Set'}<br>
                            Ph: ${shopInfo.phone || 'N/A'}<br>
                            GSTIN: 27AAAAA0000A1Z5 (U)
                        </div>
                        <div class="invoice-title">TAX INVOICE</div>
                    </div>

                    <div class="bill-info">
                        <div class="info-row">
                            <span class="label">Billed To:</span>
                            <span class="value">${sale.customerName}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Contact:</span>
                            <span class="value">+91 ${sale.customerPhone || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Invoice No:</span>
                            <span class="value">#${sale.transactionId || sale._id.slice(-8).toUpperCase()}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Date/Time:</span>
                            <span class="value">${new Date(sale.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} | ${new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th width="30" class="text-center">Qty</th>
                                <th width="70" class="text-right">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sale.items.map((item) => `
                                <tr style="${item.isReturned ? 'text-decoration: line-through; opacity: 0.5;' : ''}">
                                    <td>
                                        <div style="font-weight: 700; color: #0f172a;">${item.product?.productName || item.productName}</div>
                                    </td>
                                    <td class="text-center">${item.quantity}</td>
                                    <td class="text-right">₹${(item.price * item.quantity).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="summary">
                        <div class="summary-row">
                            <span style="color: #64748b;">Sub-Total</span>
                            <span style="font-weight: 700;">₹${subtotal.toLocaleString()}</span>
                        </div>
                        <div class="summary-row">
                            <span style="color: #64748b;">GST (0%)</span>
                            <span style="font-weight: 700;">₹0.00</span>
                        </div>
                        <div class="summary-row total">
                            <span>TOTAL</span>
                            <span>₹${subtotal.toLocaleString()}</span>
                        </div>
                        <div style="font-size: 7pt; text-align: center; color: #64748b; margin-top: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                            Payment: ${sale.paymentMethod}
                        </div>
                    </div>

                    <div class="footer">
                        <div class="terms">Terms & Conditions</div>
                        <div>Goods once sold cannot be returned.</div>
                        <div style="margin-top: 5px; font-weight: 900; color: #1e293b; letter-spacing: 1px;">THANK YOU! VISIT AGAIN</div>
                        <div style="font-size: 5pt; margin-top: 10px;">Computer Generated Invoice</div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
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
                        className={`rounded-[1.25rem] border px-4 py-3 text-white shadow-lg sm:px-5 mb-4 ${!isOnline ? 'bg-rose-600 border-rose-500/30' : 'bg-indigo-600 border-indigo-500/30'}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/20">
                                    {!isOnline ? <Globe size={18} /> : <RefreshCcw size={18} className={isSyncing ? 'animate-spin' : ''} />}
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest">{!isOnline ? 'Offline Active' : 'Synchronization Pending'}</p>
                                    <p className="text-[10px] font-bold opacity-90 uppercase tracking-tight">{pendingSyncCount} transaction(s) queued in local registry.</p>
                                </div>
                            </div>
                            {isOnline && pendingSyncCount > 0 && (
                                <button onClick={syncOfflineSales} disabled={isSyncing} className="px-4 py-2 bg-white text-indigo-600 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50">
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
                            <div className="h-1 w-8 bg-indigo-400 rounded-[1.25rem]"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Checkout Terminal</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white uppercase">POS <span className="text-indigo-600">Terminal</span></h1>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">High-performance transaction engine for your retail ecosystem.</p>
                    </div>
                    <button onClick={() => { setPosStep(1); setIsSaleModalOpen(true); }} className="h-14 px-10 bg-indigo-600 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                        <Plus size={20} /> New Sale
                    </button>
                </div>
            </div>

            {/* Tactical Control Bar */}
            <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Registry Period</span>
                        <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600 group-focus-within:scale-110 transition-transform pointer-events-none" size={16} />
                            <input type="month" className="h-11 w-full sm:w-44 pl-11 pr-3 rounded-[1.25rem] border border-slate-300 bg-white text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-600 dark:bg-slate-950 dark:border-white/5 dark:text-white shadow-sm transition-all" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
                        </div>
                    </div>
                    <form onSubmit={handleTransactionSearch} className="flex gap-2 lg:w-80">
                        <div className="flex flex-col gap-1.5 flex-1">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Archive Search</span>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                                <input type="text" placeholder="ID, Name, or Mobile..." className="h-11 w-full rounded-[1.25rem] border border-slate-300 bg-white pl-11 pr-3 text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 shadow-sm" value={transactionSearch} onChange={(e) => setTransactionSearch(e.target.value)} />
                            </div>
                        </div>
                        <button type="submit" disabled={searching} className="h-11 rounded-[1.25rem] border border-slate-300 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 shadow-sm self-end">Find</button>
                    </form>
                </div>
            </div>

            {/* Sales Registry */}
            <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="min-w-[980px] w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Transaction ID</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Client</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Qty</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Settlement</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? [1, 2, 3, 4, 5].map(i => (
                                <tr key={i} className="animate-pulse"><td colSpan="6" className="px-4 py-6 h-16"></td></tr>
                            )) : sales.map((sale) => (
                                <tr key={sale._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="px-4 py-4">
                                        <p className="text-[11px] font-semibold uppercase text-indigo-600">{sale.transactionId || sale._id.slice(-8).toUpperCase()}</p>
                                        <p className="text-xs text-slate-500">{formatDate(sale.createdAt)}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{sale.customerName}</p>
                                        <p className="text-xs text-slate-500">{sale.customerPhone || 'Walk-in'}</p>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-[1.25rem] text-xs font-bold">{sale.items.length}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-sm font-semibold text-emerald-600">₹{sale.totalAmount.toLocaleString()}</p>
                                        <p className="text-xs text-slate-500">{sale.paymentMethod}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2.5 py-1 rounded-[1.25rem] text-xs font-bold ${sale.status === 'Returned' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{sale.status}</span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleShare(sale)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-[1.25rem]"><Share2 size={16} /></button>
                                            <button onClick={() => { setViewingSale(sale); setIsViewModalOpen(true); }} className="p-2 text-slate-600 hover:bg-slate-50 rounded-[1.25rem]"><Receipt size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* POS UI Modal - 4 Steps */}
            <Modal isOpen={isSaleModalOpen} onClose={() => { setIsSaleModalOpen(false); setPosStep(1); }} title="New Sale" className="max-w-4xl">
                <div className="space-y-6">
                    {/* Stepper */}
                    <div className="flex items-center justify-between px-4 pt-2">
                        {[1, 2, 3, 4].map(step => (
                            <div key={step} className="flex items-center flex-1 last:flex-none">
                                <div className={`w-10 h-10 rounded-[1.25rem] flex items-center justify-center text-xs font-black shadow-sm transition-all ${posStep >= step ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-slate-100 text-slate-400'}`}>
                                    {step === 1 ? <Package size={18} /> : step === 2 ? <ShoppingCart size={18} /> : step === 3 ? <User size={18} /> : <CreditCard size={18} />}
                                </div>
                                {step < 4 && <div className={`flex-1 h-1 mx-3 rounded-[1.25rem] transition-all ${posStep > step ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between px-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <span className={posStep === 1 ? 'text-indigo-600' : ''}>Catalog</span>
                        <span className={posStep === 2 ? 'text-indigo-600' : ''}>Cart Items</span>
                        <span className={posStep === 3 ? 'text-indigo-600' : ''}>Customer</span>
                        <span className={posStep === 4 ? 'text-indigo-600' : ''}>Settlement</span>
                    </div>

                    <AnimatePresence mode="wait">
                        {posStep === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="text" placeholder="Scan barcode or type product name..." className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-500 rounded-[1.25rem] text-sm font-bold outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
                                    </div>
                                    <button onClick={() => setIsScannerOpen(true)} className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.25rem] hover:bg-indigo-100 transition-colors"><Scan size={24} /></button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {filteredProducts.map(p => (
                                        <button key={p._id} onClick={() => addToCart(p)} className="p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[1.25rem] text-left flex justify-between items-center group hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                                            <div>
                                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{p.productName}</p>
                                                <p className="text-[11px] font-bold text-slate-500 mt-1">₹{p.price.toLocaleString()} <span className="mx-1 opacity-30">|</span> Stock: <span className={p.quantity <= 10 ? 'text-rose-500' : 'text-emerald-500'}>{p.quantity}</span></p>
                                            </div>
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-[1.25rem] flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                <Plus size={18} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-[1.25rem] flex items-center justify-center text-slate-500"><ShoppingCart size={18} /></div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">{cart.length} Items</p>
                                            <p className="text-[10px] font-bold text-slate-400">Total: ₹{calculateTotal().toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setPosStep(2)} disabled={cart.length === 0} className="h-14 px-10 bg-indigo-600 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] disabled:opacity-50 shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-2">View Cart <ChevronRight size={16} /></button>
                                </div>
                            </motion.div>
                        )}

                        {posStep === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {cart.length === 0 ? (
                                        <div className="py-20 text-center space-y-4">
                                            <div className="w-20 h-20 bg-slate-50 rounded-[1.25rem] flex items-center justify-center mx-auto text-slate-300"><ShoppingCart size={40} /></div>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Your cart is currently empty</p>
                                        </div>
                                    ) : cart.map(item => (
                                        <div key={item.product} className="p-5 bg-slate-50 dark:bg-slate-950 rounded-[1.25rem] flex items-center justify-between border border-transparent hover:border-indigo-100 transition-all">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">{item.productName}</p>
                                                <p className="text-xs text-indigo-600 font-black mt-1">₹{item.price.toLocaleString()} / unit</p>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center bg-white dark:bg-slate-900 rounded-[1.25rem] p-1.5 border border-slate-200 dark:border-slate-800 shadow-sm">
                                                    <button onClick={() => updateCartQty(item.product, -1)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-[1.25rem] transition-colors"><Minus size={14} /></button>
                                                    <span className="w-12 text-center text-sm font-black text-slate-900 dark:text-white">{item.quantity}</span>
                                                    <button onClick={() => updateCartQty(item.product, 1)} className="p-1.5 hover:bg-emerald-50 text-emerald-500 rounded-[1.25rem] transition-colors"><Plus size={14} /></button>
                                                </div>
                                                <div className="text-right min-w-[80px]">
                                                    <p className="text-sm font-black text-slate-900 dark:text-white">₹{(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                                <button onClick={() => removeFromCart(item.product)} className="text-slate-300 hover:text-rose-500 transition-colors p-2"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center p-6 bg-slate-900 rounded-[1.25rem] text-white">
                                    <span className="text-xs font-black uppercase tracking-widest opacity-60">Cart Subtotal</span>
                                    <span className="text-2xl font-black">₹{calculateTotal().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between gap-4 pt-4">
                                    <button onClick={() => setPosStep(1)} className="h-14 flex-1 bg-slate-100 dark:bg-slate-800 rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">Add More</button>
                                    <button onClick={() => setPosStep(3)} disabled={cart.length === 0} className="h-14 flex-[2] bg-indigo-600 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">Customer Details <ChevronRight size={16} /></button>
                                </div>
                            </motion.div>
                        )}

                        {posStep === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 py-4">
                                <div className="grid grid-cols-1 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Customer Mobile Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input type="tel" className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-500 rounded-[1.25rem] font-black text-lg outline-none transition-all dark:text-white" value={customerInfo.phone} onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })} placeholder="91XXXXXXXX" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Client Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input type="text" className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-500 rounded-[1.25rem] font-black text-lg outline-none transition-all dark:text-white" value={customerInfo.name} onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })} placeholder="Walk-in Guest" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Delivery/Billing Address (Optional)</label>
                                        <div className="relative">
                                            <Store className="absolute left-5 top-6 text-slate-300" size={18} />
                                            <textarea rows={3} className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-500 rounded-[1.25rem] font-bold text-sm outline-none transition-all dark:text-white resize-none" value={customerInfo.address} onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })} placeholder="Enter house no, landmark, city..." />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between gap-4 pt-8">
                                    <button onClick={() => setPosStep(2)} className="h-14 flex-1 bg-slate-100 rounded-[1.25rem] font-black uppercase tracking-widest text-[10px]">Back to Cart</button>
                                    <button onClick={() => setPosStep(4)} className="h-14 flex-[2] bg-indigo-600 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20">Payment Options <ChevronRight size={16} /></button>
                                </div>
                            </motion.div>
                        )}

                        {posStep === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <div className="p-8 bg-indigo-600 rounded-[1.25rem] text-white text-center space-y-3 shadow-2xl shadow-indigo-500/30">
                                    <p className="text-xs font-black uppercase tracking-[0.3em] opacity-60">Total Payable Amount</p>
                                    <h3 className="text-5xl font-black tabular-nums">₹{calculateTotal().toLocaleString()}</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {['Cash', 'UPI', 'Card', 'Scan & Pay'].map(method => (
                                        <button key={method} onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: method })} className={`p-6 rounded-[1.25rem] border-2 flex flex-col items-center gap-3 transition-all ${customerInfo.paymentMethod === method ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 shadow-lg shadow-indigo-500/5' : 'border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-200'}`}>
                                            <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center ${customerInfo.paymentMethod === method ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                {method === 'Cash' ? <Wallet size={20} /> : method === 'UPI' ? <Zap size={20} /> : method === 'Card' ? <CreditCard size={20} /> : <QrCode size={20} />}
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-widest">{method}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-between gap-4 pt-4">
                                    <button onClick={() => setPosStep(3)} className="h-14 flex-1 bg-slate-100 rounded-[1.25rem] font-black uppercase tracking-widest text-[10px]">Review Client</button>
                                    <button onClick={handleCheckout} className="h-14 flex-[2] bg-emerald-600 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">Complete Transaction <ShieldCheck size={18} /></button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Modal>

            {/* Existing View Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Registry Details" className="max-w-2xl">
                {viewingSale && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-indigo-600 uppercase tracking-tighter">#{viewingSale.transactionId || viewingSale._id.slice(-8).toUpperCase()}</h2>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <Calendar size={12} /> {new Date(viewingSale.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{viewingSale.customerName}</p>
                                <p className="text-xs font-bold text-slate-500">{viewingSale.customerPhone || 'Walk-in Guest'}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-100/50 dark:bg-slate-800/50">
                                        <th className="px-6 py-4 font-black uppercase text-[10px] text-slate-400 tracking-widest">Product</th>
                                        <th className="px-6 py-4 font-black uppercase text-[10px] text-slate-400 tracking-widest text-center">Qty</th>
                                        <th className="px-6 py-4 font-black uppercase text-[10px] text-slate-400 tracking-widest text-right">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {viewingSale.items.map((item, idx) => (
                                        <tr key={idx} className={item.isReturned ? 'bg-rose-50/50' : ''}>
                                            <td className="px-6 py-4">
                                                <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.product?.productName || item.productName}</p>
                                                {item.isReturned && <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Returned</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold">{item.quantity}</td>
                                            <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">₹{(item.price * item.quantity).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="text-center sm:text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Settlement Mode</p>
                                <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">{viewingSale.paymentMethod}</p>
                            </div>
                            <div className="text-center sm:text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Settlement</p>
                                <p className="text-3xl font-black text-slate-900 dark:text-white">₹{viewingSale.totalAmount.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <button onClick={() => handlePrintInvoice(viewingSale)} className="h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl"><Printer size={18} /> Physical Bill</button>
                            <button onClick={() => handleShare(viewingSale)} className="h-14 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl"><Share2 size={18} /> Digital Bill</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Return & Scanner Modals */}
            <Modal isOpen={isReturnModalOpen} onClose={() => setIsReturnModalOpen(false)} title="Registry Adjustment" className="max-w-md">
                <div className="py-6 space-y-8 text-center">
                    <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-rose-500/10"><Undo2 size={40} /></div>
                    <div className="space-y-2">
                        <h4 className="text-2xl font-black uppercase tracking-tight">Initiate Return?</h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">This will restock inventory and record a refund.</p>
                    </div>
                    <div className="space-y-3 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Reason for Return</label>
                        <textarea required placeholder="Damage, Expiry, Exchange..." className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-rose-500 outline-none h-32 resize-none font-bold dark:text-white transition-all" value={returnReasonInput} onChange={(e) => setReturnReasonInput(e.target.value)} />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button onClick={() => setIsReturnModalOpen(false)} className="h-14 flex-1 bg-slate-100 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-500">Abort</button>
                        <button onClick={handleReturn} className="h-14 flex-[2] bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-500/20">Process Return</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="Optical Scan Terminal" className="max-w-lg">
                <div className="p-4">
                    <BarcodeScanner isOpen={isScannerOpen} onScanSuccess={handleScanSuccess} onScanError={(err) => console.error(err)} />
                    <p className="mt-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Position barcode within the frame</p>
                </div>
            </Modal>

            {/* Shift Modal */}
            <AnimatePresence>
                {isShiftModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsShiftModalOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-white/5">
                            <form onSubmit={handleOpenShiftDirect} className="p-10 space-y-8 text-center">
                                <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-500/30"><Wallet size={40} /></div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Shift Required</h2>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Initialize your drawer to continue</p>
                                </div>
                                <div className="space-y-3 text-left">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Opening Cash Balance (₹)</label>
                                    <div className="relative">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-600 font-black text-xl">₹</div>
                                        <input type="number" required value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 dark:bg-slate-950 rounded-3xl py-6 pl-14 pr-6 text-3xl font-black outline-none border-2 border-transparent focus:border-indigo-500 transition-all dark:text-white tabular-nums" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4 pt-6">
                                    <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-2xl shadow-indigo-500/30 transition-all">Start Shift</button>
                                    <button type="button" onClick={() => setIsShiftModalOpen(false)} className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-[9px] hover:text-slate-600">Review Items</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Sales;
