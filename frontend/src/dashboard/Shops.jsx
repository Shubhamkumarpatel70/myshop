import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { 
    Store, User, Mail, Phone, MapPin, 
    Search, ExternalLink, Shield, Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

const Shops = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const res = await api.get('/reports/admin-stats');
            setShops(res.data.data.shops);
        } catch (error) {
            toast.error("Failed to fetch shops");
        } finally {
            setLoading(false);
        }
    };

    const filteredShops = shops.filter(shop => 
        shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSuspend = async (shop) => {
        const action = shop.isSuspended ? 'activate' : 'suspend';
        if (window.confirm(`Are you sure you want to ${action} this shop?`)) {
            try {
                await api.put(`/users/${shop._id}/suspend`);
                toast.success(`Shop ${shop.isSuspended ? 'activated' : 'suspended'} successfully`);
                fetchShops();
            } catch (error) {
                toast.error("Failed to update shop status");
            }
        }
    };

    const handleExportShops = () => {
        if (shops.length === 0) return;
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("Merchant Directory", 14, 22);
        
        const tableData = filteredShops.map(s => [
            s.shopName,
            s.ownerName,
            s.email,
            s.phone,
            s.businessType,
            s.isSuspended ? 'Suspended' : 'Active'
        ]);

        doc.autoTable({
            startY: 30,
            head: [['Shop Name', 'Owner', 'Email', 'Phone', 'Type', 'Status']],
            body: tableData,
            headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save('merchant_directory.pdf');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Merchant Directory</h1>
                    <p className="text-secondary-500 font-medium">Authorized business partners within the StockSaathi ecosystem.</p>
                </div>
                <button 
                    onClick={handleExportShops}
                    className="btn btn-primary h-14 px-8 rounded-2xl flex items-center gap-2"
                >
                    <Download size={20} /> Export Directory
                </button>
            </div>

            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by shop or owner name..." 
                    className="input-field pl-10 h-14 rounded-2xl bg-white dark:bg-secondary-900 shadow-sm border-secondary-100"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-64 bg-white dark:bg-secondary-900 rounded-[2.5rem] animate-pulse"></div>)
                ) : filteredShops.map((shop) => (
                    <motion.div 
                        key={shop._id}
                        whileHover={{ y: -5 }}
                        className={`bg-white dark:bg-secondary-900 p-8 rounded-[2.5rem] shadow-xl border relative overflow-hidden transition-all ${
                            shop.isSuspended ? 'border-red-200 dark:border-red-900/30 opacity-75 grayscale-[0.5]' : 'border-secondary-100 dark:border-secondary-800'
                        }`}
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                                shop.isSuspended ? 'bg-red-500 shadow-red-500/30' : 'bg-primary-600 shadow-primary-500/30'
                            }`}>
                                <Store size={32} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-xl leading-tight truncate">{shop.shopName}</h3>
                                <p className="text-xs text-primary-600 font-black uppercase tracking-widest mt-1">{shop.businessType}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-3 text-sm text-secondary-500">
                                <User size={18} className="text-secondary-400" /> 
                                <span className="font-medium text-secondary-900 dark:text-white truncate">{shop.ownerName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-secondary-500">
                                <Mail size={18} className="text-secondary-400" /> <span className="truncate">{shop.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-secondary-500">
                                <Phone size={18} className="text-secondary-400" /> {shop.phone}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-secondary-500">
                                <MapPin size={18} className="text-secondary-400" /> 
                                <span className="line-clamp-1">{shop.address}</span>
                            </div>
                        </div>
 
                        <div className="flex gap-3 mt-auto">
                            <button 
                                onClick={() => handleSuspend(shop)}
                                className={`w-full py-4 rounded-xl transition-all shadow-lg shadow-current/10 font-bold flex items-center justify-center gap-2 ${
                                    shop.isSuspended 
                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                }`}
                            >
                                <Shield size={20} /> {shop.isSuspended ? 'Reactivate Shop' : 'Suspend Account'}
                            </button>
                        </div>
 
                        <div className="absolute top-0 right-0 p-6 flex flex-col items-end gap-2">
                            <span className="text-[10px] font-black uppercase text-secondary-400 tracking-tighter">ID: {shop.shopId || shop._id.slice(-6)}</span>
                            {shop.isSuspended && (
                                <span className="px-2 py-1 bg-red-100 text-red-600 text-[8px] font-black uppercase rounded-lg tracking-widest">Suspended</span>
                            )}
                            <div className="flex flex-col items-end gap-1 mt-1">
                                <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-lg tracking-widest ${
                                    shop.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                                    shop.approvalStatus === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                                    'bg-amber-100 text-amber-600'
                                }`}>
                                    {shop.approvalStatus}
                                </span>
                                {shop.approvalStatus === 'Approved' && (
                                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-lg tracking-widest ${
                                        shop.isPaymentDone ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {shop.isPaymentDone ? 'Paid' : 'Unpaid'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Shops;
