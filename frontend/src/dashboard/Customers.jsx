import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Search, Filter, Download, 
    TrendingUp, Calendar, Phone, Mail, 
    ArrowRight, ChevronRight, X, Heart,
    Zap, ShoppingBag, MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSales, setCustomerSales] = useState([]);
    const [fetchingDetails, setFetchingDetails] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers');
            setCustomers(res.data.data);
        } catch (error) {
            toast.error("Failed to load customers");
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerDetails = async (phone) => {
        setFetchingDetails(true);
        try {
            const res = await api.get(`/customers/${phone}`);
            setCustomerSales(res.data.data);
        } catch (error) {
            toast.error("Failed to load purchase history");
        } finally {
            setFetchingDetails(false);
        }
    };

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c._id.includes(searchTerm)
    );

    const handleSendWhatsApp = (phone, name) => {
        const message = `Hello ${name}! Thank you for shopping with us at StockSaathi. We have some special offers for you!`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 font-black uppercase text-[10px] tracking-[0.3em]">
                        <Users size={14} /> Relationship Manager
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                        Customer <span className="text-indigo-600">Registry</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl text-lg leading-relaxed">
                        Track lifetime spending, identify VIP customers, and drive repeat business with personalized loyalty.
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-80 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by name or phone..." 
                            className="input-field pl-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Customer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-[2.5rem] animate-pulse border border-slate-100 dark:border-slate-800"></div>
                    ))
                ) : filteredCustomers.map((customer, i) => (
                    <motion.div 
                        key={customer._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all cursor-default"
                    >
                        {/* VIP Badge */}
                        {customer.totalSpent > 1000 && (
                            <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-full text-[9px] font-black uppercase border border-amber-100 dark:border-amber-500/20">
                                <Zap size={10} fill="currentColor" /> VIP Tier
                            </div>
                        )}

                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl shadow-inner">
                                {customer.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">{customer.name}</h3>
                                <div className="flex items-center gap-2 text-slate-400 mt-1">
                                    <Phone size={12} />
                                    <span className="text-xs font-bold">{customer._id}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Lifetime</p>
                                <p className="text-xl font-black text-emerald-600">₹{customer.totalSpent.toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Orders</p>
                                <p className="text-xl font-black text-indigo-600">{customer.orderCount}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => {
                                    setSelectedCustomer(customer);
                                    fetchCustomerDetails(customer._id);
                                }}
                                className="flex-1 h-12 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                            >
                                <ShoppingBag size={14} /> History
                            </button>
                            <button 
                                onClick={() => handleSendWhatsApp(customer._id, customer.name)}
                                className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                title="Send WhatsApp Discount"
                            >
                                <MessageCircle size={18} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* History Modal */}
            <AnimatePresence>
                {selectedCustomer && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCustomer(null)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-3xl bg-white dark:bg-slate-950 rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 lg:p-12 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-3xl font-black tracking-tighter uppercase">{selectedCustomer.name}</h2>
                                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">Customer ID: {selectedCustomer._id}</span>
                                    </div>
                                    <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest">Full Purchase History & Behavior Audit</p>
                                </div>
                                <button onClick={() => setSelectedCustomer(null)} className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-sm">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 lg:p-12 max-h-[60vh] overflow-y-auto space-y-6 custom-scrollbar">
                                {fetchingDetails ? (
                                    <div className="space-y-4 py-10 text-center">
                                        <TrendingUp className="mx-auto text-indigo-600 animate-bounce" size={40} />
                                        <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Analyzing Transactions...</p>
                                    </div>
                                ) : customerSales.length === 0 ? (
                                    <p className="text-center text-slate-400 py-10">No transactions found.</p>
                                ) : customerSales.map((sale) => (
                                    <div key={sale._id} className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Order Date</p>
                                                <p className="font-bold text-sm">{new Date(sale.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Paid</p>
                                                <p className="text-xl font-black text-indigo-600">₹{sale.totalAmount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {sale.items.map((item, idx) => (
                                                <span key={idx} className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-100 dark:border-slate-700">
                                                    {item.product?.productName || 'Product'} × {item.quantity}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 lg:p-10 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-center sm:text-left">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Last Interaction</p>
                                    <p className="text-sm font-bold">{new Date(selectedCustomer.lastPurchase).toLocaleDateString()}</p>
                                </div>
                                <button 
                                    onClick={() => handleSendWhatsApp(selectedCustomer._id, selectedCustomer.name)}
                                    className="w-full sm:w-auto h-16 px-10 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                                >
                                    <MessageCircle size={18} /> Send Loyalty Bonus
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Customers;
