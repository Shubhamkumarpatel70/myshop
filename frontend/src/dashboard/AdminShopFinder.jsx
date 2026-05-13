import React, { useState } from 'react';
import api, { BASE_URL } from '../utils/api';
import { 
    Search, Store, User, Phone, 
    MapPin, Mail, Calendar, ExternalLink,
    AlertCircle, ShieldCheck, CreditCard, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminShopFinder = () => {
    const [shopId, setShopId] = useState('');
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!shopId) return;
        
        setLoading(true);
        setSearched(true);
        try {
            const res = await api.get(`/admin/shop-lookup/${shopId}`);
            setShop(res.data.data);
        } catch (error) {
            setShop(null);
            toast.error(error.response?.data?.message || "Shop not found");
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
        <div className="space-y-10 pb-20 max-w-5xl">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tight">Shop Finder</h1>
                <p className="text-slate-500 font-medium">Search the entire ecosystem using unique Shop/Member IDs.</p>
            </div>

            <form onSubmit={handleSearch} className="relative group">
                <input 
                    type="text" 
                    placeholder="Enter Shop ID (e.g. MS-RAJ-43-130526)" 
                    className="w-full h-20 pl-8 pr-40 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 text-xl font-black focus:border-indigo-600 transition-all uppercase placeholder:normal-case shadow-xl shadow-slate-200/20"
                    value={shopId}
                    onChange={(e) => setShopId(e.target.value)}
                />
                <button 
                    type="submit"
                    disabled={loading}
                    className="absolute right-3 top-3 bottom-3 px-10 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                >
                    {loading ? 'Searching...' : <><Search size={20} /> Find Shop</>}
                </button>
            </form>

            <AnimatePresence mode="wait">
                {shop ? (
                    <motion.div 
                        key="result"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        {/* Summary Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-indigo-600 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                                <div className="relative z-10 space-y-6 text-center">
                                    <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] flex items-center justify-center mx-auto backdrop-blur-md">
                                        <Store size={48} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight mb-1">{shop.shopName}</h3>
                                        <p className="text-indigo-200 font-bold uppercase text-[10px] tracking-widest">{shop.businessType}</p>
                                    </div>
                                    <div className="py-3 px-6 bg-white/10 rounded-2xl border border-white/10 inline-block">
                                        <p className="text-[10px] font-black uppercase opacity-60 mb-1">Status</p>
                                        <p className="font-black text-xs">{shop.approvalStatus} / {shop.isPaymentDone ? 'Paid' : 'Unpaid'}</p>
                                    </div>
                                </div>
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                            </div>

                            <div className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-4">
                                <h4 className="font-black uppercase text-xs tracking-[0.2em] text-slate-400 mb-4">Quick Actions</h4>
                                <button className="w-full py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                                    <ExternalLink size={16} /> View Shop Page
                                </button>
                                <button className="w-full py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                                    <CreditCard size={16} /> Transaction Logs
                                </button>
                            </div>
                        </div>

                        {/* Detailed Info */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Shop Owner</p>
                                    <div className="flex items-center gap-2">
                                        <User size={18} className="text-indigo-600" />
                                        <p className="text-lg font-black">{shop.ownerName}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact Email</p>
                                    <div className="flex items-center gap-2">
                                        <Mail size={18} className="text-indigo-600" />
                                        <p className="text-lg font-black truncate">{shop.email}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone Number</p>
                                    <div className="flex items-center gap-2">
                                        <Phone size={18} className="text-indigo-600" />
                                        <p className="text-lg font-black">{shop.phone}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Join Date</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={18} className="text-indigo-600" />
                                        <p className="text-lg font-black">{formatDate(shop.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="sm:col-span-2 space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Official Address</p>
                                    <div className="flex items-start gap-2">
                                        <MapPin size={18} className="text-indigo-600 mt-1 shrink-0" />
                                        <p className="text-lg font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{shop.address}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Aadhar Verification</p>
                                    <p className="text-lg font-black font-mono tracking-tighter">{shop.aadharNumber || 'Pending Submission'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Account Status</p>
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck size={18} className={shop.isSuspended ? 'text-rose-600' : 'text-emerald-600'} />
                                        <p className={`text-lg font-black uppercase ${shop.isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {shop.isSuspended ? 'Suspended' : 'Active Partner'}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Plan</p>
                                    <div className="flex items-center gap-2">
                                        <CreditCard size={18} className="text-indigo-600" />
                                        <p className="text-lg font-black uppercase tracking-tighter">{shop.subscriptionPlan || 'Free'}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Expiry Date</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={18} className="text-indigo-600" />
                                        <p className="text-lg font-black">{formatDate(shop.planExpiresAt)}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Purchase Date</p>
                                    <div className="flex items-center gap-2">
                                        <Clock size={18} className="text-indigo-600" />
                                        <p className="text-lg font-black">{formatDate(shop.planActivatedAt || shop.createdAt)}</p>
                                    </div>
                                </div>
                            </div>

                            {shop.aadharImage && (
                                <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-4">
                                        <ShieldCheck size={16} className="text-slate-400" />
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Identity Document</p>
                                    </div>
                                    <div className="w-full h-48 bg-slate-50 dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
                                        <img 
                                            src={shop.aadharImage.startsWith('http') ? shop.aadharImage : `${BASE_URL}${shop.aadharImage}`} 
                                            alt="KYC Document" 
                                            className="w-full h-full object-cover" 
                                        />
                                    </div>
                                </div>
                            )}

                            {shop.paymentScreenshot && (
                                <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-4">
                                        <CreditCard size={16} className="text-amber-500" />
                                        <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Registration Payment Proof</p>
                                    </div>
                                    <div className="w-full rounded-3xl overflow-hidden border border-amber-100 bg-amber-50/30">
                                        <img 
                                            src={shop.paymentScreenshot.startsWith('http') ? shop.paymentScreenshot : `${BASE_URL}${shop.paymentScreenshot}`} 
                                            alt="Payment Proof" 
                                            className="w-full h-auto max-h-[300px] object-contain" 
                                        />
                                    </div>
                                    <p className="text-[10px] font-bold text-amber-600 mt-2 text-center uppercase tracking-tighter">Verified by Admin: {shop.isPaymentDone ? 'YES' : 'PENDING'}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : searched && !loading ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-[50vh] flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800"
                    >
                        <AlertCircle size={48} className="text-rose-500 mb-4" />
                        <h3 className="text-xl font-black uppercase tracking-tight">No Shop Found</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">
                            We couldn't find any business associated with the ID <strong>"{shopId.toUpperCase()}"</strong>.
                        </p>
                    </motion.div>
                ) : (
                    <div className="h-[40vh] flex flex-col items-center justify-center text-center p-10 grayscale opacity-30">
                        <Store size={80} className="mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest">Enter an ID to start searching</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminShopFinder;
