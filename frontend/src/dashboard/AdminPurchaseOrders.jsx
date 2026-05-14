import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { 
    FileText, Search, Download, Trash2, 
    CheckCircle2, ShoppingCart, Calendar,
    User, Store, MapPin, Phone, Hash, Zap,
    Filter, ArrowUpDown, ExternalLink, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminPurchaseOrders = () => {
    const [pos, setPos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        fetchAdminPOs();
    }, []);

    const fetchAdminPOs = async () => {
        try {
            const res = await api.get('/purchase-orders/admin');
            setPos(res.data.data);
        } catch (error) {
            toast.error("Failed to load global POs");
        } finally {
            setLoading(false);
        }
    };

    const filteredPOs = pos.filter(po => {
        const matchesSearch = 
            po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            po.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            po.user?.shopName?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filterStatus === 'All' || po.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    const downloadPO = (po) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // Branding Background
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, pageWidth, 40, 'F');

        // Header
        doc.setFontSize(28);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text("PURCHASE ORDER", 20, 28);
        
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "normal");
        doc.text(`PO NUMBER: #${po.poNumber}`, 190, 28, { align: 'right' });

        // Content
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        doc.text("ORDER TO:", 20, 55);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(po.supplierName || 'N/A', 20, 62);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Contact: ${po.supplierPhone || 'N/A'}`, 20, 68);
        doc.text(`Shop: ${po.user?.shopName || 'N/A'}`, 20, 74);

        // Date Box
        doc.setFillColor(248, 250, 252);
        doc.rect(130, 50, 60, 25, 'F');
        doc.setFontSize(8);
        doc.text("ISSUE DATE", 135, 57);
        doc.text("DELIVERY BY", 135, 63);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text(new Date(po.createdAt).toLocaleDateString(), 185, 57, { align: 'right' });
        doc.text(po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : 'ASAP', 185, 63, { align: 'right' });

        // Table
        const tableData = po.items.map((item, index) => [
            index + 1,
            item.productName,
            item.quantity,
            `Rs. ${item.expectedPrice.toLocaleString()}`,
            `Rs. ${(item.quantity * item.expectedPrice).toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: 90,
            head: [['#', 'Description', 'Quantity', 'Unit Price', 'Total']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229], fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9 },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                2: { halign: 'center', cellWidth: 20 },
                3: { halign: 'right', cellWidth: 40 },
                4: { halign: 'right', cellWidth: 40 }
            }
        });

        const finalY = doc.lastAutoTable.finalY || 180;

        // Summary
        doc.setDrawColor(226, 232, 240);
        doc.line(130, finalY + 10, 190, finalY + 10);
        doc.setFontSize(14);
        doc.setTextColor(79, 70, 229);
        doc.text(`GRAND TOTAL: Rs. ${po.totalAmount.toLocaleString()}`, 190, finalY + 20, { align: 'right' });

        doc.setFontSize(8);
        doc.setTextColor(180);
        doc.text("Admin Audit Copy - StockSaathi Retail OS", pageWidth/2, 285, { align: 'center' });

        doc.save(`ADMIN_PO_${po.poNumber}.pdf`);
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 font-black uppercase text-[10px] tracking-[0.3em]">
                        <Hash size={14} /> Global Procurement Audit
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                        Purchase <span className="text-indigo-600">Audit</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl text-lg leading-relaxed">
                        Monitor and analyze purchase orders across all registered shops in the network.
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: 'Total POs', value: pos.length, icon: FileText, color: 'bg-indigo-50 text-indigo-600' },
                    { label: 'Total Value', value: `₹${pos.reduce((acc, p) => acc + p.totalAmount, 0).toLocaleString()}`, icon: Zap, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Pending', value: pos.filter(p => p.status === 'Sent').length, icon: Calendar, color: 'bg-amber-50 text-amber-600' },
                    { label: 'Received', value: pos.filter(p => p.status === 'Received').length, icon: CheckCircle2, color: 'bg-blue-50 text-blue-600' },
                ].map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label} 
                        className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm"
                    >
                        <div className={`w-10 h-10 md:w-12 md:h-12 ${stat.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4`}>
                            <stat.icon size={20} className="md:w-6 md:h-6" />
                        </div>
                        <p className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                        <p className="text-lg md:text-2xl font-black mt-1">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Global Search Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search PO#, Supplier, or Shop..." 
                        className="w-full h-14 md:h-16 pl-16 pr-6 rounded-2xl md:rounded-[2rem] bg-white dark:bg-slate-900 border-none shadow-lg shadow-slate-200/50 dark:shadow-none font-bold text-base md:text-lg focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1 md:gap-2 bg-white dark:bg-slate-900 p-1.5 md:p-2 rounded-2xl md:rounded-[2rem] shadow-lg shadow-slate-200/50 dark:shadow-none overflow-x-auto no-scrollbar">
                    {['All', 'Sent', 'Received'].map((status) => (
                        <button 
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === status ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Section */}
            <div className="space-y-4">
                {/* Desktop Table */}
                <div className="hidden md:block bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">PO Number</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Origin Shop</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Vendor</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Amount</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Date</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredPOs.map((po) => (
                                    <tr key={po._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600">
                                                    <FileText size={18} />
                                                </div>
                                                <span className="font-black tracking-tight text-slate-900 dark:text-white">#{po.poNumber}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-slate-900 dark:text-white">{po.user?.shopName}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase">{po.user?.shopId}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-bold text-sm">{po.supplierName}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-lg font-black text-indigo-600">₹{po.totalAmount.toLocaleString()}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                po.status === 'Received' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                            }`}>
                                                {po.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-bold text-sm text-slate-500">{new Date(po.createdAt).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link 
                                                    to={`/dashboard/admin/purchase-orders/${po._id}`}
                                                    className="h-10 w-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                <button 
                                                    onClick={() => downloadPO(po)}
                                                    className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {filteredPOs.map((po) => (
                        <motion.div 
                            key={po._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">PO Number</p>
                                        <p className="font-black text-lg">#{po.poNumber}</p>
                                    </div>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    po.status === 'Received' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                                }`}>
                                    {po.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 dark:border-slate-800">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Origin Shop</p>
                                    <p className="font-bold text-xs truncate">{po.user?.shopName}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                                    <p className="font-black text-sm text-indigo-600">₹{po.totalAmount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vendor</p>
                                    <p className="font-bold text-xs truncate">{po.supplierName}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                                    <p className="font-bold text-xs">{new Date(po.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Link 
                                    to={`/dashboard/admin/purchase-orders/${po._id}`}
                                    className="flex-1 h-12 bg-slate-900 text-white dark:bg-white dark:text-black rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                                >
                                    <Eye size={14} /> View Details
                                </Link>
                                <button 
                                    onClick={() => downloadPO(po)}
                                    className="w-12 h-12 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                                >
                                    <Download size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {filteredPOs.length === 0 && (
                    <div className="p-12 md:p-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800">
                        <Hash size={48} className="mx-auto text-slate-100 dark:text-slate-800 mb-4 md:mb-6" />
                        <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">No Matching POs Found</h3>
                        <p className="text-slate-500 font-medium mt-1 text-sm">Try searching for a different ID or shop name.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPurchaseOrders;
