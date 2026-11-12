import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, Shield, Crown, Plus, 
    Save, Trash2, Check, Settings2,
    Package, Users, Info, Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPricing = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState(null);
    const [addons, setAddons] = useState([]);
    const [editingAddon, setEditingAddon] = useState(null);

    useEffect(() => {
        fetchPlans();
        fetchAddons();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await api.get('/subscriptions/plans');
            setPlans(res.data.data);
        } catch (error) {
            toast.error("Failed to load plans");
        } finally {
            setLoading(false);
        }
    };

    const fetchAddons = async () => {
        try { const res = await api.get('/subscriptions/admin/addons'); setAddons(Array.isArray(res.data?.data) ? res.data.data : []); }
        catch { toast.error('Failed to load add-ons'); }
    };

    const handleSaveAddon = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...editingAddon, id: editingAddon._id || editingAddon.id || undefined };
            const res = await api.post('/subscriptions/admin/addons', payload);
            if (res.data.success) { toast.success('Add-on saved'); setEditingAddon(null); fetchAddons(); }
        } catch (error) { toast.error(error.response?.data?.message || 'Unable to save add-on'); }
    };

    const handleDeleteAddon = async (id) => {
        if (!window.confirm('Delete this add-on?')) return;
        try { await api.delete(`/subscriptions/admin/addons/${id}`); toast.success('Add-on deleted'); fetchAddons(); }
        catch { toast.error('Unable to delete add-on'); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/subscriptions/admin/plans', editingPlan);
            if (res.data.success) {
                toast.success("Plan updated successfully!");
                setEditingPlan(null);
                fetchPlans();
            }
        } catch (error) {
            toast.error("Failed to save plan");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this plan? This cannot be undone.")) return;
        try {
            const res = await api.delete(`/subscriptions/admin/plans/${id}`);
            if (res.data.success) {
                toast.success("Plan deleted successfully!");
                fetchPlans();
            }
        } catch (error) {
            toast.error("Failed to delete plan");
        }
    };

    const defaultFeatures = [
        'Max Products: 50',
        'Staff Accounts: 2',
        'Basic Sales History',
        'Offline POS Sync'
    ];

    return (
        <div className="space-y-10 pb-20">
            <div className="flex justify-between items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 font-black uppercase text-[10px] tracking-[0.3em]">
                        <Settings2 size={14} /> Revenue Config
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                        Plan <span className="text-indigo-600">Manager</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl text-lg">
                        Define pricing, limits, and features for your SaaS network.
                    </p>
                </div>
                <button 
                    onClick={() => setEditingPlan({ name: '', price: 0, maxProducts: 50, maxStaff: 2, maxBarcodes: 30, features: defaultFeatures, isRecommended: false })}
                    className="btn btn-primary h-14 px-8 rounded-2xl"
                >
                    <Plus size={20} /> Create Plan
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <div key={plan._id} className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 relative">
                        {plan.isRecommended && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest">Recommended</div>
                        )}
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600">
                                {plan.name === 'Free' ? <Zap size={24} /> : plan.name === 'Professional' ? <Shield size={24} /> : <Crown size={24} />}
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setEditingPlan(plan)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400"><Settings2 size={18} /></button>
                                <button onClick={() => handleDelete(plan._id)} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-500"><Trash2 size={18} /></button>
                            </div>
                        </div>
                        <h3 className="text-xl font-black tracking-tight">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-3xl font-black">₹{plan.price}</span>
                            <span className="text-xs text-slate-400 font-bold">/{plan.duration}</span>
                        </div>
                        <div className="mt-6 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                                <Package size={14} className="text-indigo-600" /> Max Products: {plan.maxProducts === 0 ? 'Unlimited' : plan.maxProducts}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                                <Users size={14} className="text-indigo-600" /> Max Staff: {plan.maxStaff === 0 ? 'Unlimited' : plan.maxStaff}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                                <Tag size={14} className="text-indigo-600" /> Max Barcodes: {plan.maxBarcodes === 0 ? 'Unlimited' : plan.maxBarcodes}
                            </div>
                        </div>
                    </div>
                ))}
            </div>


            <section className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div><h2 className="text-2xl font-black">Standalone Add-ons</h2><p className="text-sm text-slate-500">Create and manage optional modules shown on the shop pricing page.</p></div>
                    <button onClick={() => setEditingAddon({ name: '', description: '', price: 0, billingLabel: 'One-time payment', features: [], activationKey: 'none', isActive: true })} className="btn btn-primary h-12 px-6 rounded-xl"><Plus size={18}/> Add Add-on</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {addons.map(addon => <div key={addon._id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                        <div className="flex justify-between gap-3"><div><h3 className="font-black text-lg">{addon.name}</h3><p className="text-xs text-slate-500 mt-1">{addon.isActive ? 'Active' : 'Hidden from shops'}</p></div><span className="font-black text-xl">₹{addon.price}</span></div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">{addon.description}</p>
                        <div className="flex gap-2 mt-5"><button onClick={() => setEditingAddon({...addon, features: addon.features || []})} className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 py-2 text-sm font-bold">Edit</button><button onClick={() => handleDeleteAddon(addon._id)} className="rounded-xl px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 dark:bg-rose-500/10">Delete</button></div>
                    </div>)}
                    {!addons.length && <p className="text-sm text-slate-500">No add-ons created yet.</p>}
                </div>
            </section>
            {editingAddon && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
                <motion.div initial={{opacity:0, scale:0.96}} animate={{opacity:1, scale:1}} className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-950 p-7">
                    <h2 className="text-2xl font-black mb-6">{editingAddon._id ? 'Edit Add-on' : 'Create Add-on'}</h2>
                    <form onSubmit={handleSaveAddon} className="space-y-4">
                        <label className="block text-xs font-bold">Add-on name<input required maxLength="80" className="input-field mt-1 h-12 rounded-xl" value={editingAddon.name} onChange={e=>setEditingAddon({...editingAddon,name:e.target.value})}/></label>
                        <label className="block text-xs font-bold">Description<textarea required maxLength="500" className="input-field mt-1 rounded-xl" rows="3" value={editingAddon.description} onChange={e=>setEditingAddon({...editingAddon,description:e.target.value})}/></label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block text-xs font-bold">Price (₹)<input required min="1" type="number" className="input-field mt-1 h-12 rounded-xl" value={editingAddon.price} onChange={e=>setEditingAddon({...editingAddon,price:Number(e.target.value)})}/></label>
                            <label className="block text-xs font-bold">Price label<input maxLength="40" className="input-field mt-1 h-12 rounded-xl" value={editingAddon.billingLabel} onChange={e=>setEditingAddon({...editingAddon,billingLabel:e.target.value})}/></label>
                        </div>
                        <label className="block text-xs font-bold">Included features (one per line)<textarea rows="3" className="input-field mt-1 rounded-xl" value={(editingAddon.features || []).join('\n')} onChange={e=>setEditingAddon({...editingAddon,features:e.target.value.split('\n')})}/></label>
                        <label className="block text-xs font-bold">Feature activation<select className="input-field mt-1 h-12 rounded-xl" value={editingAddon.activationKey} onChange={e=>setEditingAddon({...editingAddon,activationKey:e.target.value})}><option value="none">Display and payment only</option><option value="barcode">Unlock Barcode Booster</option><option value="team">Unlock Team Expansion</option></select></label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editingAddon.isActive !== false} onChange={e=>setEditingAddon({...editingAddon,isActive:e.target.checked})}/> Show on shop pricing page</label>
                        <div className="flex gap-3 pt-2"><button type="button" onClick={()=>setEditingAddon(null)} className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 py-3 font-bold">Cancel</button><button type="submit" className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white">Save Add-on</button></div>
                    </form>
                </motion.div>
            </div>}

            {editingPlan && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-950 rounded-[3rem] p-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-3xl font-black tracking-tighter uppercase mb-8">Edit Plan: {editingPlan.name}</h2>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Plan Name</label>
                                    <input type="text" className="input-field h-14 rounded-2xl" value={editingPlan.name} onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Price (₹)</label>
                                    <input type="number" className="input-field h-14 rounded-2xl" value={editingPlan.price} onChange={e => setEditingPlan({...editingPlan, price: Number(e.target.value)})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Max Products (0=Inf)</label>
                                    <input type="number" className="input-field h-14 rounded-2xl" value={editingPlan.maxProducts} onChange={e => setEditingPlan({...editingPlan, maxProducts: Number(e.target.value)})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Max Staff (0=Inf)</label>
                                    <input type="number" className="input-field h-14 rounded-2xl" value={editingPlan.maxStaff} onChange={e => setEditingPlan({...editingPlan, maxStaff: Number(e.target.value)})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Max Barcodes (0=Inf)</label>
                                    <input type="number" className="input-field h-14 rounded-2xl" value={editingPlan.maxBarcodes} onChange={e => setEditingPlan({...editingPlan, maxBarcodes: Number(e.target.value)})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Description</label>
                                <textarea className="input-field h-24 rounded-2xl pt-4" value={editingPlan.description} onChange={e => setEditingPlan({...editingPlan, description: e.target.value})} />
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setEditingPlan(null)} className="flex-1 h-16 rounded-2xl font-black uppercase text-xs tracking-widest bg-slate-100 dark:bg-slate-800">Cancel</button>
                                <button type="submit" className="flex-[2] h-16 rounded-2xl font-black uppercase text-xs tracking-widest bg-indigo-600 text-white shadow-xl shadow-indigo-500/20">Save Plan <Save size={18} className="inline ml-2" /></button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminPricing;
