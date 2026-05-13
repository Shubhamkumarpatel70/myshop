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
                    [1, 2, 3].map(i => <div key={i} className="h-[450px] bg-white dark:bg-secondary-900 rounded-[3rem] animate-pulse"></div>)
                ) : filteredShops.map((shop) => (
                    <motion.div 
                        key={shop._id}
                        whileHover={{ y: -5 }}
                        className={`bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-2xl border transition-all relative flex flex-col ${
                            shop.isSuspended ? 'border-rose-200 dark:border-rose-900/30 grayscale-[0.5]' : 'border-slate-100 dark:border-slate-800'
                        }`}
                    >
                        {/* Card Header: Badges & ID */}
                        <div className="flex justify-between items-start mb-6">
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl shrink-0 ${
                                shop.isSuspended ? 'bg-rose-500 shadow-rose-500/20' : 'bg-indigo-600 shadow-indigo-500/20'
                            }`}>
                                <Store size={36} />
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">ID: {shop.shopId || shop._id.slice(-8).toUpperCase()}</span>
                                <div className="flex flex-wrap justify-end gap-1.5">
                                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg tracking-widest ${
                                        shop.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                                        shop.approvalStatus === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                                        'bg-amber-100 text-amber-600'
                                    }`}>
                                        {shop.approvalStatus}
                                    </span>
                                    {shop.isPaymentDone && (
                                        <span className="px-2.5 py-1 bg-indigo-100 text-indigo-600 text-[9px] font-black uppercase rounded-lg tracking-widest">Paid</span>
                                    )}
                                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg tracking-widest ${
                                        shop.subscriptionPlan === 'Enterprise' ? 'bg-amber-100 text-amber-600' :
                                        shop.subscriptionPlan === 'Professional' ? 'bg-indigo-100 text-indigo-600' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                        {shop.subscriptionPlan || 'Free'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Shop Info */}
                        <div className="mb-8">
                            <h3 className="font-black text-2xl leading-tight uppercase tracking-tighter text-slate-900 dark:text-white mb-1">{shop.shopName}</h3>
                            <p className="text-xs text-indigo-600 font-black uppercase tracking-[0.2em]">{shop.businessType}</p>
                        </div>
                        
                        {/* Contact Details */}
                        <div className="space-y-4 mb-10 flex-1">
                            <div className="flex items-center gap-4 text-sm">
                                <User size={18} className="text-slate-400 shrink-0" /> 
                                <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{shop.ownerName}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <Mail size={18} className="text-slate-400 shrink-0" /> 
                                <span className="font-medium text-slate-500 truncate">{shop.email}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <Phone size={18} className="text-slate-400 shrink-0" /> 
                                <span className="font-medium text-slate-500">{shop.phone}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <MapPin size={18} className="text-slate-400 shrink-0" /> 
                                <span className="font-medium text-slate-500 line-clamp-1">{shop.address}</span>
                            </div>
                        </div>
 
                        {/* Action Area */}
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50">
                            <button 
                                onClick={() => handleSuspend(shop)}
                                className={`w-full py-4 rounded-2xl transition-all font-black uppercase text-[11px] tracking-[0.1em] flex items-center justify-center gap-2 ${
                                    shop.isSuspended 
                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                }`}
                            >
                                <Shield size={18} /> {shop.isSuspended ? 'Reactivate Shop' : 'Suspend Account'}
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Shops;
