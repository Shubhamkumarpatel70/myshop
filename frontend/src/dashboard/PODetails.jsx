import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
    ArrowLeft, FileText, Download, ShoppingBag, 
    Calendar, User, Store, Hash, Package, Trash2, Phone
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PODetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [po, setPo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPODetails();
    }, [id]);

    const fetchPODetails = async () => {
        try {
            // Use the admin endpoint if user is admin, otherwise shop owner endpoint
            // For now, let's assume this is for admin audit
            const res = await api.get(`/purchase-orders/admin`);
            const found = res.data.data.find(p => p._id === id);
            if (!found) {
                toast.error("PO not found");
                navigate('/dashboard/admin/purchase-orders');
                return;
            }
            setPo(found);
        } catch (error) {
            toast.error("Failed to load PO details");
        } finally {
            setLoading(false);
        }
    };

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

    if (loading) return <div className="p-10 text-center animate-pulse">Loading PO Details...</div>;
    if (!po) return null;

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="h-12 w-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Global Audit Viewer</p>
                    <h1 className="text-3xl font-black tracking-tight">Purchase Order <span className="text-indigo-600">#{po.poNumber}</span></h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Details Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                        <div className="flex justify-between items-start mb-12">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-[1.5rem] flex items-center justify-center text-indigo-600">
                                    <FileText size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Order Items</h3>
                                    <p className="text-slate-500 font-bold text-sm">Itemized breakdown of this procurement</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => downloadPO(po)}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
                            >
                                <Download size={14} /> Download PDF
                            </button>
                        </div>

                        <div className="space-y-4">
                            {po.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-slate-100/50 dark:border-slate-700/50">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center font-black text-indigo-600 shadow-sm">{i+1}</div>
                                        <div>
                                            <p className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">{item.productName}</p>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rate: ₹{item.expectedPrice.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-indigo-600">₹{(item.quantity * item.expectedPrice).toLocaleString()}</p>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Qty: {item.quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 p-8 bg-indigo-600 rounded-[2.5rem] text-white flex justify-between items-center shadow-2xl shadow-indigo-500/30">
                            <div>
                                <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Total Order Value</p>
                                <p className="text-4xl font-black">₹{po.totalAmount.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Status</p>
                                <p className="text-2xl font-black">{po.status}</p>
                            </div>
                        </div>
                    </div>

                    {po.notes && (
                        <div className="bg-amber-50/50 border border-amber-100 p-8 rounded-[2.5rem]">
                            <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-2">Special Instructions</h4>
                            <p className="font-bold text-slate-700 leading-relaxed italic">"{po.notes}"</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 border-b border-slate-50 pb-4">Origin Store</h4>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
                                <Store size={24} />
                            </div>
                            <div>
                                <p className="font-black text-lg uppercase leading-tight">{po.user?.shopName}</p>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">ID: {po.user?.shopId}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-500">
                                <User size={16} className="text-indigo-500" />
                                <span className="text-sm font-bold">{po.user?.ownerName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500">
                                <Hash size={16} className="text-indigo-500" />
                                <span className="text-sm font-bold">Role: Shop Owner</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 border-b border-slate-50 pb-4">Vendor Details</h4>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Supplier Name</p>
                                <p className="font-black text-xl uppercase text-slate-900 dark:text-white">{po.supplierName}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase text-slate-400">Contact Number</p>
                                    <p className="font-bold text-sm">{po.supplierPhone || 'Not Provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 border-b border-slate-50 pb-4">Timeline</h4>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-10 bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden">
                                    <div className="absolute top-0 w-full h-1/2 bg-indigo-600" />
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-slate-400">Created On</p>
                                        <p className="font-bold text-sm">{new Date(po.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-slate-400">Expected By</p>
                                        <p className="font-bold text-sm text-indigo-600">{po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : 'ASAP'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PODetails;
