import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    FileText, Plus, Search, Download, Trash2,
    X, CheckCircle2, ShoppingCart, Calendar,
    User, Store, MapPin, Phone, Hash, Zap, Eye, Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PurchaseOrders = () => {
    const [pos, setPos] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingPO, setEditingPO] = useState(null);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        supplierName: '',
        supplierPhone: '',
        supplierEmail: '',
        items: [{ productName: '', productId: '', quantity: 1, expectedPrice: 0 }],
        notes: '',
        expectedDelivery: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [poRes, prodRes] = await Promise.all([
                api.get('/purchase-orders'),
                api.get('/products')
            ]);
            setPos(poRes.data.data);
            setProducts(prodRes.data.data);
        } catch (error) {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { productName: '', productId: '', quantity: 1, expectedPrice: 0 }]
        });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        if (field === 'productId') {
            const prod = products.find(p => p._id === value);
            newItems[index].productId = value;
            newItems[index].productName = prod.productName;
            newItems[index].expectedPrice = prod.purchasePrice || 0;
        } else {
            newItems[index][field] = value;
        }
        setFormData({ ...formData, items: newItems });
    };

    const handleRemoveItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleAutoAddLowStock = () => {
        const lowStockProducts = products.filter(p => p.quantity <= (p.lowStockThreshold || 10));

        if (lowStockProducts.length === 0) {
            return toast.error("No low-stock items found!");
        }

        const newItems = lowStockProducts.map(p => ({
            productId: p._id,
            productName: p.productName,
            quantity: (p.lowStockThreshold || 10) * 2, // Suggest double the threshold for restock
            expectedPrice: p.purchasePrice || 0
        }));

        setFormData({
            ...formData,
            items: newItems
        });
        toast.success(`Automatically added ${lowStockProducts.length} low-stock products.`);
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await api.patch(`/purchase-orders/${id}/status`, { status: newStatus });
            toast.success(`PO marked as ${newStatus}`);
            fetchInitialData();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this Purchase Order?")) return;
        try {
            await api.delete(`/purchase-orders/${id}`);
            toast.success("Purchase Order Deleted");
            fetchInitialData();
        } catch (error) {
            toast.error("Failed to delete PO");
        }
    };

    const handleEdit = (po) => {
        setEditingPO(po);
        setFormData({
            supplierName: po.supplierName || po.supplier?.name || '',
            supplierPhone: po.supplierPhone || po.supplier?.phone || '',
            supplierEmail: po.supplierEmail || po.supplier?.email || '',
            items: po.items.map(item => ({
                productName: item.productName,
                productId: item.productId?._id || item.productId,
                quantity: item.quantity,
                expectedPrice: item.expectedPrice
            })),
            notes: po.notes || '',
            expectedDelivery: po.expectedDelivery ? new Date(po.expectedDelivery).toISOString().split('T')[0] : ''
        });
        setShowAddModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.supplierName) return toast.error("Enter supplier name");

        const totalAmount = formData.items.reduce((acc, item) => acc + (item.quantity * item.expectedPrice), 0);

        try {
            const payload = {
                ...formData,
                totalAmount,
                manualSupplier: {
                    name: formData.supplierName,
                    phone: formData.supplierPhone,
                    email: formData.supplierEmail
                }
            };

            if (editingPO) {
                await api.put(`/purchase-orders/${editingPO._id}`, payload);
                toast.success("Purchase Order Updated");
            } else {
                await api.post('/purchase-orders', payload);
                toast.success("Purchase Order Created");
            }

            setShowAddModal(false);
            setEditingPO(null);
            setFormData({ supplierName: '', supplierPhone: '', supplierEmail: '', items: [{ productName: '', productId: '', quantity: 1, expectedPrice: 0 }], notes: '', expectedDelivery: '' });
            fetchInitialData();
        } catch (error) {
            toast.error(editingPO ? "Failed to update PO" : "Failed to create PO");
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
        doc.text(po.supplierName || po.supplier?.name || 'N/A', 20, 62);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Contact: ${po.supplierPhone || po.supplier?.phone || 'N/A'}`, 20, 68);
        doc.text(`Email: ${po.supplierEmail || po.supplier?.email || 'N/A'}`, 20, 74);

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

        // Notes
        if (po.notes) {
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text("Special Notes:", 20, finalY + 40);
            doc.setFont("helvetica", "italic");
            doc.text(po.notes, 20, finalY + 46);
        }

        doc.setFontSize(8);
        doc.setTextColor(180);
        doc.text("Generated by StockSaathi Retail OS", pageWidth / 2, 285, { align: 'center' });

        doc.save(`PO_${po.poNumber}.pdf`);
        toast.success("PO Downloaded");
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 font-black uppercase text-[10px] tracking-[0.3em]">
                        <ShoppingCart size={14} /> Procurement Manager
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                        Purchase <span className="text-indigo-600">Orders</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl text-lg leading-relaxed">
                        Create professional purchase orders to send to your vendors for restocking.
                    </p>
                </div>

                <button
                    onClick={() => {
                        setEditingPO(null);
                        setFormData({ supplierName: '', supplierPhone: '', supplierEmail: '', items: [{ productName: '', productId: '', quantity: 1, expectedPrice: 0 }], notes: '', expectedDelivery: '' });
                        setShowAddModal(true);
                    }}
                    className="h-14 px-8 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                    <Plus size={16} /> Create New PO
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {pos.map((po) => (
                    <motion.div
                        key={po._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 group hover:border-indigo-500/30 transition-all"
                    >
                        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 dark:bg-slate-800 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-600">
                                <FileText size={24} className="md:w-7 md:h-7" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                    <h3 className="text-base md:text-lg font-black tracking-tight truncate">#{po.poNumber}</h3>
                                    <select
                                        value={po.status}
                                        onChange={(e) => updateStatus(po._id, e.target.value)}
                                        className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border-none cursor-pointer focus:ring-0 ${po.status === 'Received' ? 'bg-emerald-50 text-emerald-600' :
                                                po.status === 'Sent' ? 'bg-indigo-50 text-indigo-600' :
                                                    po.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' :
                                                        'bg-amber-50 text-amber-600'
                                            }`}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Sent">Sent</option>
                                        <option value="Received">Received</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <p className="text-slate-500 font-bold text-xs mt-0.5 truncate">{po.supplierName || po.supplier?.name || 'Unknown Vendor'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 md:gap-12 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-50 dark:border-slate-800">
                            <div className="text-left hidden sm:block">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Expected By</p>
                                <p className="font-bold text-xs md:text-sm">{po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : 'ASAP'}</p>
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Amount</p>
                                <p className="text-lg md:text-xl font-black text-indigo-600">₹{po.totalAmount.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3">
                                <button
                                    onClick={() => navigate(`/dashboard/purchase-orders/${po._id}`)}
                                    className="h-10 w-10 md:h-12 md:w-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg md:rounded-xl flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                    title="View Details"
                                >
                                    <Eye size={18} />
                                </button>
                                <button
                                    onClick={() => handleEdit(po)}
                                    className="h-10 w-10 md:h-12 md:w-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg md:rounded-xl flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                    title="Edit PO"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(po._id)}
                                    className="h-10 w-10 md:h-12 md:w-12 bg-rose-50 text-rose-600 rounded-lg md:rounded-xl flex items-center justify-center hover:bg-rose-100 transition-all"
                                    title="Delete PO"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                            {/* Modal Header */}
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight">{editingPO ? 'Update' : 'Create'} Purchase Order</h2>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Procurement System</p>
                                </div>
                                <button type="button" onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                                {/* Supplier & Date Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1.5 space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Supplier Name</label>
                                        <input required className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm focus:ring-2 focus:ring-indigo-500/20" placeholder="Vendor Name" value={formData.supplierName} onChange={e => setFormData({ ...formData, supplierName: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone</label>
                                        <input className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm" placeholder="Contact" value={formData.supplierPhone} onChange={e => setFormData({ ...formData, supplierPhone: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Deadline</label>
                                        <input type="date" className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm" value={formData.expectedDelivery} onChange={e => setFormData({ ...formData, expectedDelivery: e.target.value })} />
                                    </div>
                                </div>

                                {/* Items Section */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Restock Items ({formData.items.length})</h4>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={handleAutoAddLowStock}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                                            >
                                                <Zap size={10} className="fill-white" /> Smart Fill
                                            </button>
                                            <button type="button" onClick={handleAddItem} className="text-[9px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest border-b border-slate-200 hover:border-indigo-600 transition-all">+ Add Item</button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {formData.items.map((item, index) => (
                                            <div key={index} className="flex flex-col md:flex-row gap-3 items-center bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                                <div className="flex-1 w-full">
                                                    <select
                                                        className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-900 border-none font-bold text-xs"
                                                        value={item.productId}
                                                        onChange={e => handleItemChange(index, 'productId', e.target.value)}
                                                    >
                                                        <option value="">Choose Product</option>
                                                        {products.map(p => <option key={p._id} value={p._id}>{p.productName}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex gap-2 w-full md:w-auto">
                                                    <div className="w-20">
                                                        <input type="number" placeholder="Qty" className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-900 border-none font-bold text-xs" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))} />
                                                    </div>
                                                    <div className="w-28">
                                                        <input type="number" placeholder="Rate" className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-900 border-none font-bold text-xs" value={item.expectedPrice} onChange={e => handleItemChange(index, 'expectedPrice', parseFloat(e.target.value))} />
                                                    </div>
                                                    {formData.items.length > 1 && (
                                                        <button type="button" onClick={() => handleRemoveItem(index)} className="h-10 w-10 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Delivery Notes</label>
                                    <textarea className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-xs h-20 resize-none" placeholder="Special instructions..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                                </div>
                            </form>

                            {/* Sticky Modal Footer */}
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Value</p>
                                    <p className="text-2xl font-black text-indigo-600">₹{formData.items.reduce((acc, item) => acc + (item.quantity * item.expectedPrice), 0).toLocaleString()}</p>
                                </div>
                                <button type="submit" onClick={handleSubmit} className="h-12 px-8 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20">
                                    {editingPO ? 'Update PO' : 'Generate PO'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PurchaseOrders;
