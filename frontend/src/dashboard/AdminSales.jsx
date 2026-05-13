import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { 
    ShoppingCart, Search, ExternalLink, 
    Calendar, User, CreditCard, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const AdminSales = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const res = await api.get('/sales');
            setSales(res.data.data);
        } catch (error) {
            toast.error("Failed to fetch global sales");
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

    const filteredSales = sales.filter(s => 
        s._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.user?.shopName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Platform Transaction Hub</h1>
                    <p className="text-secondary-500 font-medium">Monitoring the global economic pulse across all registered merchants.</p>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by Transaction ID, Customer, or Shop Name..." 
                    className="input-field pl-12 h-14 rounded-2xl shadow-sm border-secondary-100 dark:border-secondary-800"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white dark:bg-secondary-900 rounded-[2.5rem] shadow-xl border border-secondary-100 dark:border-secondary-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-secondary-50 dark:bg-secondary-800/50">
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">ID & Date</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">Shop</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">Customer</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">Amount</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">Status</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => <tr key={i} className="animate-pulse h-16"><td colSpan="6"></td></tr>)
                            ) : filteredSales.length > 0 ? (
                                filteredSales.map((sale) => (
                                    <tr key={sale._id} className="hover:bg-secondary-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-[10px] font-mono font-bold text-secondary-500 leading-tight">{sale.transactionId || sale._id.toUpperCase()}</p>
                                            <p className="text-[10px] text-secondary-400 mt-0.5">{formatDate(sale.createdAt)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold">{sale.user?.shopName}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-bold">{sale.customerName}</p>
                                                <p className="text-[10px] text-secondary-500">{sale.customerPhone}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black">₹{sale.totalAmount.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                                                sale.status === 'Returned' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                sale.status === 'Partial Return' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                            }`}>
                                                {sale.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => { setSelectedSale(sale); setIsModalOpen(true); }}
                                                className="p-2 hover:bg-secondary-100 rounded-lg text-secondary-500"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="py-20 text-center text-secondary-500 italic">No sales transactions found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Transaction Details">
                {selectedSale && (
                    <div className="space-y-6">
                        <div className="p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-2xl">
                             <p className="text-[10px] font-black uppercase text-secondary-400 mb-1">Transaction ID</p>
                             <p className="font-mono font-bold text-secondary-600">{selectedSale.transactionId || selectedSale._id.toUpperCase()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-2xl">
                                <p className="text-[10px] font-black uppercase text-secondary-400 mb-1">Customer</p>
                                <p className="font-bold">{selectedSale.customerName}</p>
                                <p className="text-xs text-secondary-500">{selectedSale.customerPhone}</p>
                            </div>
                            <div className="p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-2xl">
                                <p className="text-[10px] font-black uppercase text-secondary-400 mb-1">Payment</p>
                                <p className="font-bold">{selectedSale.paymentMethod}</p>
                                <p className="text-xs text-secondary-500">{formatDate(selectedSale.createdAt)} {new Date(selectedSale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-bold ml-1">Products Purchased</p>
                            <div className="border border-secondary-100 dark:border-secondary-800 rounded-2xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-secondary-50 dark:bg-secondary-800/50">
                                        <tr>
                                            <th className="px-4 py-3">Item</th>
                                            <th className="px-4 py-3">Batch</th>
                                            <th className="px-4 py-3">Expiry</th>
                                            <th className="px-4 py-3">Qty</th>
                                            <th className="px-4 py-3 text-right">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                                        {selectedSale.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3">
                                                    <p className="font-bold">{item.product?.productName}</p>
                                                    {item.isReturned && (
                                                        <p className="text-[10px] text-red-500 italic mt-0.5">Return Reason: {item.returnReason || 'N/A'}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-secondary-500">{item.batchNumber || 'N/A'}</td>
                                                <td className="px-4 py-3 text-xs text-secondary-500">{formatDate(item.expiryDate)}</td>
                                                <td className="px-4 py-3">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right font-bold">₹{item.total}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-secondary-100 dark:border-secondary-800 flex justify-between items-center">
                            <div>
                                <p className="text-lg font-black uppercase tracking-widest text-secondary-400">Total Amount</p>
                                {selectedSale.utrNumber && (
                                    <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1">UTR: {selectedSale.utrNumber}</p>
                                )}
                            </div>
                            <p className="text-3xl font-black text-primary-600">₹{selectedSale.totalAmount.toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminSales;
