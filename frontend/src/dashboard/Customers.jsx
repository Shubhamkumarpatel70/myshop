import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Search, Filter, Download, 
    TrendingUp, Calendar, Phone, Mail, 
    ArrowRight, ChevronRight, X, Heart,
    Zap, ShoppingBag, MessageCircle, Plus,
    Star, Wallet, Clock, MapPin, History
} from 'lucide-react';
import toast from 'react-hot-toast';

const Customers = () => {
    const { t } = useLanguage();
    const [customers, setCustomers] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSales, setCustomerSales] = useState([]);
    const [fetchingDetails, setFetchingDetails] = useState(false);
    const [filterTier, setFilterTier] = useState('All');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers');
            setCustomers(res.data.data);
        } catch (error) {
            toast.error(t("Failed to load customers"));
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/customers', newCustomer);
            toast.success(t("Customer registered successfully!"));
            setShowAddModal(false);
            setNewCustomer({ name: '', phone: '', email: '', address: '' });
            fetchCustomers();
        } catch (error) {
            toast.error(error.response?.data?.message || t("Registration failed"));
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
            toast.error(t("Failed to load purchase history"));
        } finally {
            setFetchingDetails(false);
        }
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
        
        if (filterTier === 'VIP') return matchesSearch && c.totalSpent > 5000; // Adjusted VIP threshold
        if (filterTier === 'New') return matchesSearch && c.orderCount <= 1;
        return matchesSearch;
    });

    const handleSendWhatsApp = (phone, name) => {
        const message = `Hello ${name}! Thank you for your continued loyalty at our shop. We've added a special discount for your next visit!`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{t("Syncing CRM Registry...")}</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Simple Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">{t("Customer Registry")}</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{t("Loyalty Management & VIP Tracking")}</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="h-12 px-8 bg-indigo-600 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    <Plus size={16} /> {t("Register Customer")}
                </button>
            </div>

            {/* Clean Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: t('Total Base'), value: customers.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: t('Lifetime Value'), value: `₹${customers.reduce((acc, c) => acc + c.totalSpent, 0).toLocaleString()}`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: t('VIP Members'), value: customers.filter(c => c.totalSpent > 5000).length, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: t('Avg Ticket'), value: `₹${Math.round(customers.reduce((acc, c) => acc + c.totalSpent, 0) / (customers.length || 1)).toLocaleString()}`, icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 shadow-sm">
                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-[1.25rem] flex items-center justify-center`}>
                            <stat.icon size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{stat.label}</p>
                            <p className="text-xl font-black mt-1.5">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder={t("Search by name or mobile number...")} 
                        className="w-full h-14 pl-14 pr-6 rounded-[1.25rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[1.25rem] border border-slate-100 dark:border-slate-800">
                    {['All', 'VIP', 'New'].map((tier) => (
                        <button 
                            key={tier}
                            onClick={() => setFilterTier(tier)}
                            className={`px-6 py-2.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${filterTier === tier ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            {t(tier)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Customer List Table - Simple & Professional */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t("Customer Identity")}</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">{t("Lifetime Spending")}</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">{t("Visits")}</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">{t("Tier Status")}</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">{t("Actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer._id} className="hover:bg-slate-50/30 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-[1.25rem] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100 dark:border-indigo-500/20">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">{customer.name}</p>
                                                <div className="flex items-center gap-1.5 text-slate-400 mt-0.5 font-bold">
                                                    <Phone size={10} />
                                                    <span className="text-[10px]">{customer.phone}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <p className="text-sm font-black text-emerald-600">₹{customer.totalSpent.toLocaleString()}</p>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <ShoppingBag size={12} className="text-slate-400" />
                                            <span className="text-xs font-black text-slate-700 dark:text-slate-300">{customer.orderCount}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        {customer.totalSpent > 5000 ? (
                                            <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase border border-amber-100 flex items-center justify-center gap-1 w-fit mx-auto">
                                                <Star size={10} fill="currentColor" /> {t("VIP Star")}
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[9px] font-black uppercase border border-slate-100 w-fit mx-auto flex items-center justify-center">{t("Regular")}</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => { setSelectedCustomer(customer); fetchCustomerDetails(customer.phone); }}
                                                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-[1.25rem] transition-all"
                                                title={t("View History")}
                                            >
                                                <History size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleSendWhatsApp(customer.phone, customer.name)}
                                                className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-[1.25rem] transition-all"
                                                title={t("Send Promo")}
                                            >
                                                <MessageCircle size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Customer Details Modal */}
            <AnimatePresence>
                {selectedCustomer && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCustomer(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-white/5">
                            <div className="p-8 md:p-10 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.25rem] flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-500/20">
                                            {selectedCustomer.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black uppercase tracking-tight">{selectedCustomer.name}</h2>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedCustomer.phone}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedCustomer(null)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-[1.25rem] text-slate-400 hover:text-rose-500 transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-[1.25rem] border border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{t("Lifetime")}</p>
                                        <p className="text-xl font-black text-emerald-600">₹{selectedCustomer.totalSpent.toLocaleString()}</p>
                                    </div>
                                    <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-[1.25rem] border border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{t("Visits")}</p>
                                        <p className="text-xl font-black text-indigo-600">{selectedCustomer.orderCount}</p>
                                    </div>
                                    <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-[1.25rem] border border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{t("Last Seen")}</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase mt-1">{selectedCustomer.lastPurchase ? new Date(selectedCustomer.lastPurchase).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : t('Never')}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">{t("Recent Transactions")}</h4>
                                    <div className="max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                        {fetchingDetails ? (
                                            <div className="py-10 text-center animate-pulse"><Clock className="mx-auto text-indigo-400 mb-2" /><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t("Retrieving Logs...")}</p></div>
                                        ) : customerSales.map((sale) => (
                                            <div key={sale._id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-[1.25rem] flex justify-between items-center border border-slate-100 dark:border-slate-800">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{new Date(sale.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{sale.items.length} {t("items")} · {sale.paymentMethod}</p>
                                                </div>
                                                <p className="font-black text-indigo-600">₹{sale.totalAmount.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button className="flex-1 h-14 bg-emerald-600 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20" onClick={() => handleSendWhatsApp(selectedCustomer.phone, selectedCustomer.name)}><MessageCircle size={18} /> {t("Send WhatsApp Promo")}</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Registration Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-950 w-full max-w-md rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-white/5">
                            <form onSubmit={handleAddCustomer} className="p-10 space-y-8">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-indigo-500/30"><Users size={32} /></div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight">{t("Register Client")}</h2>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">{t("Add to your loyalty database")}</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t("Full Name")}</label>
                                        <input required type="text" className="w-full h-14 px-6 rounded-[1.25rem] bg-slate-50 dark:bg-slate-900 border-none font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} placeholder={t("Customer Name")} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t("Mobile Number")}</label>
                                        <input required type="tel" className="w-full h-14 px-6 rounded-[1.25rem] bg-slate-50 dark:bg-slate-900 border-none font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="91XXXXXXXX" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t("Locality/Address (Optional)")}</label>
                                        <textarea className="w-full p-6 rounded-[1.25rem] bg-slate-50 dark:bg-slate-900 border-none font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-24 resize-none" value={newCustomer.address} onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})} placeholder={t("Area, City...")} />
                                    </div>
                                </div>
                                <button disabled={submitting} type="submit" className="w-full h-16 bg-indigo-600 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all">{t("Register & Enroll")}</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Customers;
