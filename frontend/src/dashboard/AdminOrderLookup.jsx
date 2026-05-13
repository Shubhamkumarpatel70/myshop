import React, { useState } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, User, CreditCard, Calendar, Store, Tag, Receipt, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminOrderLookup = () => {
    const [orderId, setOrderId] = useState('');
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState(null);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!orderId) return;

        setLoading(true);
        setOrder(null);
        try {
            const res = await api.get(`/sales/${orderId}`);
            setOrder(res.data.data);
            toast.success("Order found!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Order not found");
        } finally {
            setLoading(false);
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

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-black tracking-tight">Order Discovery</h1>
                <p className="text-secondary-500">Search any transaction across the entire platform using Order ID or Transaction ID.</p>
            </div>

            <div className="relative group">
                <form onSubmit={handleSearch} className="flex gap-4 p-2 bg-white dark:bg-secondary-900 rounded-[2rem] shadow-2xl border border-secondary-100 dark:border-secondary-800 transition-all focus-within:ring-4 ring-primary-500/10">
                    <div className="flex-1 relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-600 transition-colors" size={24} />
                        <input 
                            type="text" 
                            placeholder="Enter Order ID or Transaction ID (e.g. 8A2B3C4D)..." 
                            className="w-full bg-transparent border-none focus:ring-0 pl-16 pr-6 h-16 text-lg font-bold"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn btn-primary rounded-2xl px-10 font-black text-lg h-16"
                    >
                        {loading ? 'Searching...' : 'Search Order'}
                    </button>
                </form>
            </div>

            <AnimatePresence mode="wait">
                {order ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Header Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-white dark:bg-secondary-900 rounded-[2rem] border border-secondary-100 dark:border-secondary-800 shadow-xl">
                                <p className="text-[10px] font-black uppercase text-secondary-400 mb-2 tracking-[0.2em]">Transaction ID</p>
                                <div className="flex items-center gap-3">
                                    <Receipt className="text-primary-600" size={20} />
                                    <p className="text-lg font-mono font-black">{order.transactionId || order._id.toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="p-6 bg-white dark:bg-secondary-900 rounded-[2rem] border border-secondary-100 dark:border-secondary-800 shadow-xl">
                                <p className="text-[10px] font-black uppercase text-secondary-400 mb-2 tracking-[0.2em]">Sale Date</p>
                                <div className="flex items-center gap-3">
                                    <Calendar className="text-primary-600" size={20} />
                                    <p className="text-lg font-black">{formatDate(order.createdAt)}</p>
                                </div>
                            </div>
                            <div className="p-6 bg-white dark:bg-secondary-900 rounded-[2rem] border border-secondary-100 dark:border-secondary-800 shadow-xl">
                                <p className="text-[10px] font-black uppercase text-secondary-400 mb-2 tracking-[0.2em]">Order Status</p>
                                <div className="flex items-center gap-3">
                                    <Tag className="text-primary-600" size={20} />
                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                                        order.status === 'Returned' ? 'bg-red-50 text-red-600' :
                                        order.status === 'Partial Return' ? 'bg-amber-50 text-amber-600' :
                                        'bg-emerald-50 text-emerald-600'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Shop & Customer Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 bg-secondary-900 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute -right-10 -top-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                    <Store size={200} />
                                </div>
                                <p className="text-[10px] font-black uppercase text-secondary-400 mb-6 tracking-[0.2em]">Platform Shop Details</p>
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                                            <Store size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black">{order.user?.shopName}</h3>
                                            <p className="text-secondary-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Verified Merchant</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-secondary-400 text-xs font-medium">Tenant ID: <span className="text-white font-mono">{order.user?._id}</span></p>
                                        <p className="text-secondary-400 text-xs font-medium mt-1">Contact: <span className="text-white">{order.user?.phone || 'N/A'}</span></p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-white dark:bg-secondary-900 rounded-[2.5rem] border border-secondary-100 dark:border-secondary-800 shadow-xl relative overflow-hidden group">
                                <div className="absolute -right-10 -top-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                    <User size={200} />
                                </div>
                                <p className="text-[10px] font-black uppercase text-secondary-400 mb-6 tracking-[0.2em]">Customer Information</p>
                                <div className="space-y-6 relative z-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-2xl flex items-center justify-center shadow-inner">
                                            <User size={28} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black tracking-tight">{order.customerName}</p>
                                            <p className="text-sm font-bold text-secondary-500 mt-0.5">{order.customerPhone || 'Walk-in Customer'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5 pt-4 border-t border-secondary-50 dark:border-secondary-800">
                                        <div className="w-14 h-14 bg-secondary-50 dark:bg-secondary-800 text-secondary-400 rounded-2xl flex items-center justify-center">
                                            <CreditCard size={28} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black">{order.paymentMethod}</p>
                                            {order.utrNumber && <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mt-1">UTR: {order.utrNumber}</p>}
                                        </div>
                                    </div>
                                    {order.customerAddress && (
                                        <div className="pt-4 border-t border-secondary-50 dark:border-secondary-800">
                                            <p className="text-[10px] font-black uppercase text-secondary-400 mb-2 tracking-widest">Delivery Address</p>
                                            <p className="text-xs font-medium text-secondary-500 italic leading-relaxed">{order.customerAddress}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Product List */}
                        <div className="bg-white dark:bg-secondary-900 rounded-[2.5rem] shadow-xl border border-secondary-100 dark:border-secondary-800 overflow-hidden">
                            <div className="px-8 py-6 border-b border-secondary-100 dark:border-secondary-800 flex justify-between items-center">
                                <h4 className="text-lg font-black tracking-tight">Order Items</h4>
                                <span className="bg-secondary-100 dark:bg-secondary-800 px-4 py-1 rounded-full text-xs font-black text-secondary-600">{order.items.length} Products</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-secondary-50 dark:bg-secondary-800/50">
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-500">Product</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-500">Batch Info</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-500">MRP/Price</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-500">Quantity</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-500 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                                        {order.items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-secondary-50/50 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div>
                                                        <p className="font-bold">{item.product?.productName || 'Deleted Product'}</p>
                                                        {item.isReturned && (
                                                            <div className="mt-1">
                                                                <span className="text-[10px] font-black uppercase text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Returned</span>
                                                                <p className="text-[10px] text-red-400 mt-1 italic font-medium">Reason: {item.returnReason || 'No reason provided'}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold"><span className="text-secondary-400">Batch:</span> {item.batchNumber || 'N/A'}</p>
                                                        <p className="text-[10px] font-bold"><span className="text-secondary-400">Exp:</span> {formatDate(item.expiryDate)}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs text-secondary-400 line-through">₹{item.mrp || item.price}</p>
                                                        <p className="text-sm font-black text-primary-600">₹{item.price}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="px-3 py-1 bg-secondary-100 dark:bg-secondary-800 rounded-lg text-xs font-black">{item.quantity}</span>
                                                </td>
                                                <td className="px-8 py-5 text-right font-black text-lg">₹{item.total.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-secondary-50/50">
                                            <td colSpan="4" className="px-8 py-6 text-right">
                                                <p className="text-sm font-black uppercase tracking-widest text-secondary-400">Grand Total</p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <p className="text-3xl font-black text-primary-600">₹{order.totalAmount.toLocaleString()}</p>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                ) : !loading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-secondary-300"
                    >
                        <AlertCircle size={64} strokeWidth={1} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium italic">No order details to display. Enter an ID to begin.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminOrderLookup;
