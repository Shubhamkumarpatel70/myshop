import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Search, Filter, Download, 
    TrendingUp, Calendar, Phone, Mail, 
    ArrowRight, ChevronRight, X, Heart,
    Zap, ShoppingBag, MessageCircle, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
    const [submitting, setSubmitting] = useState(false);
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

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/customers', newCustomer);
            toast.success("Customer registered successfully!");
            setShowAddModal(false);
            setNewCustomer({ name: '', phone: '', email: '', address: '' });
            fetchCustomers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Registration failed");
        } finally {
            setSubmitting(false);
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

    const [filterTier, setFilterTier] = useState('All');

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
        
        if (filterTier === 'VIP') return matchesSearch && c.totalSpent > 1000;
        if (filterTier === 'Dormant') return matchesSearch && c.totalSpent < 100;
        return matchesSearch;
    });

    const handleSendWhatsApp = (phone, name) => {
        const message = `Hello ${name}! Thank you for shopping with us at StockSaathi. We have some special offers for you!`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Header & Meta */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 font-black uppercase text-[10px] tracking-[0.3em]">
                    <Users size={14} /> Relationship Manager
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                    Customer <span className="text-indigo-600">Registry</span>
                </h1>
                <p className="text-slate-500 font-medium max-w-2xl text-sm md:text-lg leading-relaxed">
                    Track lifetime spending, identify VIP customers, and drive repeat business with personalized loyalty.
                </p>
            </div>

            {/* Loyalty Analytics Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: 'Total Customers', value: customers.length, icon: Users, color: 'bg-indigo-50 text-indigo-600' },
                    { label: 'Lifetime Sales', value: `₹${customers.reduce((acc, c) => acc + c.totalSpent, 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'VIP Nodes', value: customers.filter(c => c.totalSpent > 1000).length, icon: Zap, color: 'bg-amber-50 text-amber-600' },
                    { label: 'Avg spending', value: `₹${Math.round(customers.reduce((acc, c) => acc + c.totalSpent, 0) / (customers.length || 1)).toLocaleString()}`, icon: Heart, color: 'bg-rose-50 text-rose-600' },
                ].map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label} 
                        className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm"
                    >
                        <div className={`w-10 h-10 md:w-12 md:h-12 ${stat.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-4`}>
                            <stat.icon size={20} className="md:w-6 md:h-6" />
                        </div>
                        <p className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{stat.label}</p>
                        <p className="text-lg md:text-2xl font-black mt-1.5">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Search & Tactical Filters */}
            <div className="flex flex-col xl:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search Registry (Name or Phone)..." 
                        className="w-full h-14 md:h-16 pl-16 pr-6 rounded-2xl md:rounded-[2rem] bg-white dark:bg-slate-900 border-none shadow-lg shadow-slate-200/50 dark:shadow-none font-bold text-base md:text-lg focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2 p-1.5 md:p-2 bg-white dark:bg-slate-900 rounded-2xl md:rounded-[2rem] shadow-lg shadow-slate-200/50 dark:shadow-none">
                    <button 
                        onClick={() => setFilterTier('All')}
                        className={`px-5 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterTier === 'All' ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        All Records
                    </button>
                    <button 
                        onClick={() => setFilterTier('VIP')}
                        className={`px-5 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterTier === 'VIP' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        VIP Tier
                    </button>
                    <button 
                        onClick={() => setFilterTier('Dormant')}
                        className={`px-5 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterTier === 'Dormant' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        Dormant
                    </button>
                    <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1 hidden md:block" />
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="h-10 md:h-12 px-5 md:px-8 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                        <Plus size={14} /> New Customer
                    </button>
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
                                    <span className="text-xs font-bold">{customer.phone}</span>
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
                                            fetchCustomerDetails(customer.phone);
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

            <AnimatePresence>
                {selectedCustomer && (
                    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto no-scrollbar py-6 sm:py-10">
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
                            <div className="p-6 md:p-10 border-b border-slate-100 dark:border-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                                        <h2 className="text-xl md:text-3xl font-black tracking-tighter uppercase truncate max-w-full">{selectedCustomer.name}</h2>
                                        <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest break-all">ID: {selectedCustomer._id}</span>
                                    </div>
                                    <p className="text-slate-500 font-medium mt-1 uppercase text-[8px] md:text-[10px] tracking-widest">Full Purchase History & Behavior Audit</p>
                                </div>
                                <button onClick={() => setSelectedCustomer(null)} className="absolute top-6 right-6 md:static p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-sm">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 md:p-10 max-h-[60vh] overflow-y-auto space-y-6 custom-scrollbar">
                                {fetchingDetails ? (
                                    <div className="space-y-4 py-10 text-center">
                                        <TrendingUp className="mx-auto text-indigo-600 animate-bounce" size={40} />
                                        <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Analyzing Transactions...</p>
                                    </div>
                                ) : customerSales.length === 0 ? (
                                    <p className="text-center text-slate-400 py-10">No transactions found.</p>
                                ) : customerSales.map((sale) => (
                                    <div key={sale._id} className="p-5 md:p-6 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                        <div className="flex flex-col sm:flex-row justify-between items-start mb-4 md:mb-6 gap-2">
                                            <div>
                                                <p className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Order Date</p>
                                                <p className="font-bold text-xs md:text-sm">{new Date(sale.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            </div>
                                            <div className="sm:text-right">
                                                <p className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Paid</p>
                                                <p className="text-lg md:text-xl font-black text-indigo-600">₹{sale.totalAmount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                                            {sale.items.map((item, idx) => (
                                                <span key={idx} className="px-2 md:px-3 py-1 md:py-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold border border-slate-100 dark:border-slate-700">
                                                    {item.product?.productName || 'Product'} × {item.quantity}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 md:p-10 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-center sm:text-left">
                                    <p className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Last Interaction</p>
                                    <p className="text-xs md:text-sm font-bold">{new Date(selectedCustomer.lastPurchase).toLocaleDateString()}</p>
                                </div>
                                <button 
                                    onClick={() => handleSendWhatsApp(selectedCustomer._id, selectedCustomer.name)}
                                    className="w-full sm:w-auto h-14 md:h-16 px-6 md:px-10 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                                >
                                    <MessageCircle size={18} /> Send Loyalty Bonus
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* New Customer Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto no-scrollbar py-6 sm:py-10">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <form onSubmit={handleAddCustomer} className="p-10 space-y-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Register Customer</h2>
                                    <button type="button" onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                                        <input 
                                            required
                                            type="text" 
                                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                            placeholder="John Doe"
                                            value={newCustomer.name}
                                            onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone Number</label>
                                        <input 
                                            required
                                            type="tel" 
                                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                            placeholder="+91 00000 00000"
                                            value={newCustomer.phone}
                                            onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email (Optional)</label>
                                        <input 
                                            type="email" 
                                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                            placeholder="john@example.com"
                                            value={newCustomer.email}
                                            onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Address</label>
                                        <textarea 
                                            className="w-full p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all h-32 resize-none"
                                            placeholder="Customer locality..."
                                            value={newCustomer.address}
                                            onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <button 
                                    disabled={submitting}
                                    type="submit"
                                    className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                                >
                                    {submitting ? 'Registering...' : 'Register Customer'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Customers;
