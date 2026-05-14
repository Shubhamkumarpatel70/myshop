import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
    Truck, Plus, Search, Mail, Phone, MapPin, 
    Edit2, Trash2, X, CheckCircle2, Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', contactPerson: '', phone: '', email: '', address: '', gstin: '', category: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data.data);
        } catch (error) {
            toast.error("Failed to load suppliers");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/suppliers/${editingId}`, formData);
                toast.success("Supplier updated");
            } else {
                await api.post('/suppliers', formData);
                toast.success("Supplier added");
            }
            setShowAddModal(false);
            setFormData({ name: '', contactPerson: '', phone: '', email: '', address: '', gstin: '', category: '' });
            setEditingId(null);
            fetchSuppliers();
        } catch (error) {
            toast.error("Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this supplier?")) return;
        try {
            await api.delete(`/suppliers/${id}`);
            toast.success("Supplier removed");
            fetchSuppliers();
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 font-black uppercase text-[10px] tracking-[0.3em]">
                        <Truck size={14} /> Supply Chain
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                        Supplier <span className="text-indigo-600">Hub</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl text-lg leading-relaxed">
                        Manage your vendors, contact points, and supply categories in one central hub.
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-80 group w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search suppliers..." 
                            className="input-field pl-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => {
                            setEditingId(null);
                            setFormData({ name: '', contactPerson: '', phone: '', email: '', address: '', gstin: '', category: '' });
                            setShowAddModal(true);
                        }}
                        className="h-14 px-8 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                        <Plus size={16} /> Add Supplier
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-[2.5rem] animate-pulse border border-slate-100 dark:border-slate-800" />)
                ) : filteredSuppliers.map((supplier, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={supplier._id}
                        className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                                <Building size={24} />
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => {
                                        setEditingId(supplier._id);
                                        setFormData(supplier);
                                        setShowAddModal(true);
                                    }}
                                    className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(supplier._id)}
                                    className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-600 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-black tracking-tight group-hover:text-indigo-600 transition-colors">{supplier.name}</h3>
                                <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mt-1">{supplier.category || 'General Supplier'}</p>
                            </div>

                            <div className="space-y-2 pt-2">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                    <Phone size={14} className="text-indigo-500" />
                                    <span className="text-sm font-bold">{supplier.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                    <Mail size={14} className="text-indigo-500" />
                                    <span className="text-sm font-bold truncate">{supplier.email || 'No email provided'}</span>
                                </div>
                                <div className="flex items-start gap-3 text-slate-500 dark:text-slate-400">
                                    <MapPin size={14} className="text-indigo-500 mt-1" />
                                    <span className="text-xs font-bold leading-relaxed">{supplier.address || 'Address not available'}</span>
                                </div>
                            </div>

                            {supplier.gstin && (
                                <div className="pt-4 mt-4 border-t border-slate-50 dark:border-slate-800">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">GSTIN: <span className="text-slate-900 dark:text-white ml-2">{supplier.gstin}</span></p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden">
                            <form onSubmit={handleSubmit} className="p-10 space-y-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-black uppercase tracking-tight">{editingId ? 'Update Supplier' : 'New Supplier'}</h2>
                                    <button type="button" onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Company Name</label>
                                        <input required className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Contact Person</label>
                                        <input className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone Number</label>
                                        <input required className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
                                        <input type="email" className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">GSTIN (Optional)</label>
                                        <input className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Category</label>
                                        <input className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold" placeholder="e.g. Beverages, Electronics" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Office Address</label>
                                    <textarea className="w-full p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold h-24 resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                                </div>

                                <button type="submit" className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all">
                                    {editingId ? 'Update Supplier Profile' : 'Register Supplier'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Suppliers;
