import React, { useState } from 'react';
import api from '../utils/api';
import { 
    Search, ShoppingBag, Store, User, 
    CreditCard, Calendar, Clock, Package,
    ArrowRight, MapPin, Phone, ShieldCheck,
    AlertCircle, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminOrderFinder = () => {
    const [orderId, setOrderId] = useState('');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!orderId) return;
        
        setLoading(true);
        setSearched(true);
        try {
            const res = await api.get(`/sales/${orderId}`);
            setOrder(res.data.data);
        } catch (error) {
            setOrder(null);
            toast.error(error.response?.data?.message || "Order not found");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = String(date.getFullYear()).slice(-2);
        return `${d}-${m}-${y}`;
    };

    return (
        <div className="space-y-10 pb-20 max-w-6xl">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Global Order Finder</h1>
                    <p className="text-slate-500 font-medium">Track any transaction across the entire StockSaathi network.</p>
                </div>
                <div className="hidden md:block">
                    <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
                        Admin Protocol
                    </div>
                </div>
            </div>

            <form onSubmit={handleSearch} className="relative group">
                <input 
                    type="text" 
                    placeholder="Enter Order ID (e.g. 64f1...)" 
                    className="w-full h-20 pl-8 pr-40 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 text-xl font-black focus:border-indigo-600 transition-all shadow-xl shadow-slate-200/20"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                />
                <button 
                    type="submit"
                    disabled={loading}
                    className="absolute right-3 top-3 bottom-3 px-10 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                >
                    {loading ? 'Searching...' : <><Search size={20} /> Locate Order</>}
                </button>
            </form>

            <AnimatePresence mode="wait">
                {order ? (
                    <motion.div 
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                        {/* Transaction Header Card */}
                        <div className="lg:col-span-12 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-[2rem] flex items-center justify-center">
                                    <ShoppingBag size={40} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Transaction ID</p>
                                    <h2 className="text-2xl font-black tracking-tight">{order._id}</h2>
                                    <div className="flex gap-4 mt-2">
                                        <span className="flex items-center gap-1 text-xs font-bold text-slate-500"><Calendar size={14} /> {formatDate(order.createdAt)}</span>
                                        <span className="flex items-center gap-1 text-xs font-bold text-slate-500"><Clock size={14} /> {new Date(order.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Amount</p>
                                <h3 className="text-5xl font-black text-indigo-600 tracking-tighter">₹{order.totalAmount}</h3>
                                <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                    order.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                                }`}>
                                    {order.paymentStatus}
                                </span>
                            </div>
                        </div>

                        {/* Origin Details */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-indigo-600 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Store size={20} className="text-indigo-200" />
                                        <h4 className="font-black uppercase text-xs tracking-widest">Merchant Origin</h4>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight mb-1">{order.user?.shopName || 'Unknown Shop'}</h3>
                                        <p className="text-indigo-200 text-sm font-bold uppercase">{order.user?.businessType}</p>
                                    </div>
                                    <div className="space-y-3 pt-4 border-t border-white/10">
                                        <div className="flex items-center gap-3 text-xs">
                                            <User size={14} className="opacity-60" /> {order.user?.ownerName}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs">
                                            <Phone size={14} className="opacity-60" /> {order.user?.phone}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs">
                                            <ShieldCheck size={14} className="opacity-60" /> Shop ID: {order.user?.shopId || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform"></div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
                                <div className="flex items-center gap-3 text-slate-400">
                                    <User size={20} />
                                    <h4 className="font-black uppercase text-xs tracking-widest">Customer Profile</h4>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Customer Name</p>
                                        <p className="text-lg font-black">{order.customerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone / Mobile</p>
                                        <p className="text-lg font-black">{order.customerPhone}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Payment Mode</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <CreditCard size={18} className="text-indigo-600" />
                                            <p className="text-lg font-black uppercase">{order.paymentMethod}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3 text-slate-400">
                                    <Package size={20} />
                                    <h4 className="font-black uppercase text-xs tracking-widest">Inventory Manifest</h4>
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-500">{order.items.length} Items</span>
                            </div>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center font-black text-indigo-600 shadow-sm">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h5 className="font-black text-slate-800 dark:text-white uppercase text-sm">{item.productName}</h5>
                                                <p className="text-xs font-bold text-slate-500">Qty: {item.quantity} × ₹{item.price}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-lg text-slate-900 dark:text-white">₹{item.quantity * item.price}</p>
                                            {item.isReturned && <span className="text-[8px] font-black uppercase text-rose-500">Returned</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tax (GST)</p>
                                        <p className="font-black text-lg">₹{((order.totalAmount * 0.18)).toFixed(2)} <span className="text-[10px] font-bold text-slate-400">(Inc. 18%)</span></p>
                                    </div>
                                </div>
                                <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-black transition-all flex items-center gap-3">
                                    Print Audit Report <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : searched && !loading ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-[50vh] flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800"
                    >
                        <AlertCircle size={48} className="text-rose-500 mb-4" />
                        <h3 className="text-xl font-black uppercase tracking-tight">Order Not Found</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">
                            We couldn't locate any transaction with ID <strong>"{orderId}"</strong> in our system.
                        </p>
                    </motion.div>
                ) : (
                    <div className="h-[40vh] flex flex-col items-center justify-center text-center p-10 grayscale opacity-30">
                        <ShoppingBag size={80} className="mb-4 text-slate-300" />
                        <p className="text-sm font-black uppercase tracking-widest">Search across all registered merchants</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminOrderFinder;
