import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, User, Mail, Phone, Lock,
    CreditCard, ShieldCheck, Trash2, Search,
    ShoppingCart, Activity, Zap, Cpu, ArrowRight, X, ChevronRight, UserCheck, Upload, Eye, ExternalLink, Key
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import LimitModal from '../components/LimitModal';

const Staff = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [limitMetadata, setLimitMetadata] = useState({ type: 'staff', isTrialUsed: false });
    const [formData, setFormData] = useState({
        ownerName: '',
        email: '',
        phone: '',
        password: '',
        mPin: '',
        aadharNumber: '',
        aadharFront: '',
        aadharBack: '',
        role: 'cashier'
    });

    const [uploading, setUploading] = useState({ front: false, back: false });

    const [selectedStaffStats, setSelectedStaffStats] = useState(null);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const res = await api.get('/users/staff');
            setStaff(res.data.data);
        } catch (error) {
            toast.error("Failed to connect to staff database");
        } finally {
            setLoading(false);
        }
    };

    const uploadToCloudinary = async (file, side) => {
        const uploadData = new FormData();
        uploadData.append('image', file);
        setUploading(prev => ({ ...prev, [side]: true }));
        try {
            const res = await api.post('/products/upload', uploadData);
            setFormData(prev => ({ ...prev, [side === 'front' ? 'aadharFront' : 'aadharBack']: res.data.url }));
            toast.success(`${side === 'front' ? 'Front' : 'Back'} Image Uploaded`);
        } catch (error) {
            toast.error("Upload failed");
        } finally {
            setUploading(prev => ({ ...prev, [side]: false }));
        }
    };

    const handleViewStats = async (member) => {
        try {
            const res = await api.get(`/users/staff/${member._id}/stats`);
            setSelectedStaffStats({ ...res.data.data, member });
            setIsStatsModalOpen(true);
        } catch (error) {
            toast.error("Telemetry data unavailable");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.aadharFront || !formData.aadharBack) {
            return toast.error("Please upload both Aadhar Front and Back images");
        }

        if (formData.mPin.length !== 4) {
            return toast.error("mPin must be 4 digits");
        }

        try {
            await api.post('/users/staff', formData);
            toast.success("New Staff Registered: Profile Synced");
            setIsModalOpen(false);
            setFormData({ 
                ownerName: '', email: '', phone: '', password: '', 
                mPin: '', aadharNumber: '', aadharFront: '', aadharBack: '', 
                role: 'cashier' 
            });
            fetchStaff();
        } catch (error) {
            if (error.response?.data?.errorCode === 'LIMIT_REACHED') {
                setLimitMetadata({ type: 'staff', isTrialUsed: error.response.data.isTrialUsed });
                setIsLimitModalOpen(true);
            } else {
                toast.error(error.response?.data?.message || "Recruitment Protocol Error");
            }
        }
    };

    const filteredStaff = staff.filter((member) =>
        [member.ownerName, member.email, member.phone, member.role]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10 font-jakarta">
            {/* Header with Futuristic Aesthetic */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600">
                        <UserCheck size={14} /> Human Capital Management
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Staff <span className="text-indigo-600">Portal</span>
                    </h1>
                    <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                        Orchestrate your operational team and manage mission-critical permissions.
                    </p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-[1.25rem] bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700">
                    <Plus size={16} /> Onboard Staff
                </button>
            </div>

            <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search staff..."
                    className="h-12 w-full rounded-[1.25rem] border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-white/5 dark:bg-slate-900 dark:text-white"
                />
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {loading ? [1, 2, 3].map(i => (
                    <div key={i} className="h-72 animate-pulse rounded-[1.25rem] border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"></div>
                )) : filteredStaff.map((member) => (
                    <motion.div key={member._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }} className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">

                        <div className="mb-5 flex items-center gap-3">
                            <div className="grid h-12 w-12 place-items-center rounded-[1.25rem] border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                                <User size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold leading-none text-slate-900 dark:text-white">{member.ownerName}</h3>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">{member.role}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-5 space-y-2">
                            <div className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                                <Mail size={16} className="text-indigo-500" /> <span className="truncate">{member.email}</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                                <Phone size={16} className="text-indigo-500" /> {member.phone}
                            </div>
                            <div className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                                <ShieldCheck size={16} className="text-indigo-500" /> ID: {member.aadharNumber || 'N/A'}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => handleViewStats(member)} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[1.25rem] bg-slate-900 text-sm font-semibold text-white hover:bg-indigo-600">
                                <Activity size={14} /> Details
                            </button>
                            <button className="inline-flex h-10 w-10 items-center justify-center rounded-[1.25rem] border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Performance Modal */}
            <Modal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} title="Staff Performance" className="max-w-2xl">
                {selectedStaffStats && (
                    <div className="py-8 space-y-12">
                        <div className="flex items-center gap-5 p-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-inner">
                            <div className="w-16 h-16 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20"><Cpu size={28} /></div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight dark:text-white leading-none">{selectedStaffStats.member.ownerName}</h3>
                                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-2">{selectedStaffStats.member.role} • ACTIVE</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-8 bg-emerald-500 text-white rounded-[2rem] shadow-xl shadow-emerald-500/10 relative overflow-hidden group text-center">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700"></div>
                                <div className="relative z-10">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">Sales Count</p>
                                    <h4 className="text-4xl font-black tracking-tight">{selectedStaffStats.totalSales}</h4>
                                </div>
                            </div>
                            <div className="p-8 bg-indigo-600 text-white rounded-[2rem] shadow-xl shadow-indigo-500/10 relative overflow-hidden group text-center">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700"></div>
                                <div className="relative z-10">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">Revenue</p>
                                    <h4 className="text-4xl font-black tracking-tight">₹{selectedStaffStats.totalRevenue.toLocaleString()}</h4>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h5 className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-400 ml-4">KYC: Aadhar Card Images</h5>
                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { label: 'Front Side', field: 'aadharFront' },
                                    { label: 'Back Side', field: 'aadharBack' }
                                ].map((side, i) => (
                                    <div key={i} className="space-y-3">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">{side.label}</p>
                                        <div className="relative group aspect-video rounded-[1.25rem] overflow-hidden border-4 border-slate-100 dark:border-white/5 bg-slate-950 shadow-xl">
                                            {selectedStaffStats.member[side.field] ? (
                                                <>
                                                    <img src={selectedStaffStats.member[side.field]} alt={side.label} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <a href={selectedStaffStats.member[side.field]} target="_blank" rel="noreferrer" className="w-12 h-12 bg-white rounded-[1.25rem] flex items-center justify-center text-slate-950 shadow-2xl hover:scale-110 transition-all"><ExternalLink size={20} /></a>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-100 dark:bg-slate-900">
                                                    <Eye size={24} className="opacity-20" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest mt-2">No Image</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h5 className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-400 ml-4">Recent Protocol Logs</h5>
                            <div className="space-y-3">
                                {selectedStaffStats.recentSales.length > 0 ? selectedStaffStats.recentSales.map(sale => (
                                    <div key={sale._id} className="flex justify-between items-center p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[1.25rem] hover:border-indigo-500/20 transition-all shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-slate-50 dark:bg-slate-950 rounded-[1.25rem] flex items-center justify-center text-slate-400"><ShoppingCart size={16} /></div>
                                            <div>
                                                <p className="font-black text-[11px] uppercase dark:text-white leading-none">{sale.customerName}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{new Date(sale.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <p className="font-black text-base text-emerald-600">+ ₹{sale.totalAmount}</p>
                                    </div>
                                )) : <div className="p-10 text-center bg-slate-50 dark:bg-slate-950 rounded-[1.5rem] border border-dashed border-slate-200 dark:border-white/10 text-slate-400 font-black uppercase text-[10px] tracking-widest">No active logs recorded</div>}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Hire Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Staff" className="max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-10 py-6">
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3.5rem] bg-slate-50/50 dark:bg-black/20 group relative overflow-hidden">
                        <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 animate-float"><Cpu size={48} /></div>
                        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 text-center">Details: Add staff details</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Full Name</label>
                            <input type="text" required className="w-full h-18 px-8 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-white/5 rounded-[1.25rem] outline-none focus:border-indigo-600 dark:text-white font-bold transition-all" value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Mobile Number</label>
                            <input type="tel" required className="w-full h-18 px-8 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-white/5 rounded-[1.25rem] outline-none focus:border-indigo-600 dark:text-white font-bold transition-all" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Email Id</label>
                            <input type="email" required className="w-full h-18 px-8 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-white/5 rounded-[1.25rem] outline-none focus:border-indigo-600 dark:text-white font-bold transition-all" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Security Password</label>
                            <input type="password" required className="w-full h-18 px-8 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-white/5 rounded-[1.25rem] outline-none focus:border-indigo-600 dark:text-white font-bold transition-all" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Aadhar Number</label>
                            <input type="text" required className="w-full h-18 px-8 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-white/5 rounded-[1.25rem] outline-none focus:border-indigo-600 dark:text-white font-bold transition-all" value={formData.aadharNumber} onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })} />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Secure mPin (4 Digits)</label>
                            <input type="text" maxLength={4} required className="w-full h-18 px-8 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-white/5 rounded-[1.25rem] outline-none focus:border-indigo-600 dark:text-white font-bold transition-all" value={formData.mPin} onChange={(e) => setFormData({ ...formData, mPin: e.target.value.replace(/\D/g, '') })} />
                        </div>

                        <div className="md:col-span-2 space-y-6">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">KYC: Aadhar Card Images</label>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Front Side</p>
                                    <div className="relative group aspect-video rounded-[1.25rem] border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col items-center justify-center gap-3 transition-all hover:border-indigo-500/50">
                                        {formData.aadharFront ? (
                                            <img src={formData.aadharFront} alt="Front" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <Upload size={24} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Front</span>
                                            </>
                                        )}
                                        <input type="file" accept="image/*" onChange={(e) => uploadToCloudinary(e.target.files[0], 'front')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        {uploading.front && <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Back Side</p>
                                    <div className="relative group aspect-video rounded-[1.25rem] border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col items-center justify-center gap-3 transition-all hover:border-indigo-500/50">
                                        {formData.aadharBack ? (
                                            <img src={formData.aadharBack} alt="Back" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <Upload size={24} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Back</span>
                                            </>
                                        )}
                                        <input type="file" accept="image/*" onChange={(e) => uploadToCloudinary(e.target.files[0], 'back')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        {uploading.back && <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Staff Role</label>
                            <select required className="w-full h-18 px-8 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-white/5 rounded-[1.25rem] outline-none focus:border-indigo-600 dark:text-white font-bold cursor-pointer appearance-none" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                <option value="cashier">CASHIER (PROTOCOL: BILLING ONLY)</option>
                                <option value="manager">MANAGER (PROTOCOL: INVENTORY + BILLING)</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-6 pt-10 border-t border-slate-50 dark:border-white/5">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="h-20 flex-1 bg-slate-50 dark:bg-slate-950 rounded-[1.25rem] font-black uppercase text-[10px] tracking-widest text-slate-500">Cancel</button>
                        <button type="submit" className="h-20 flex-[2] bg-indigo-600 text-white rounded-[1.25rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:bg-indigo-700 active:scale-95 transition-all">Add Staff</button>
                    </div>
                </form>
            </Modal>

            <LimitModal isOpen={isLimitModalOpen} onClose={() => setIsLimitModalOpen(false)} limitType={limitMetadata.type} isTrialUsed={limitMetadata.isTrialUsed} />
        </div>
    );
};

export default Staff;
