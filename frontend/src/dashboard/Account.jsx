import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    User, Mail, Phone, MapPin, 
    Calendar, ShieldCheck, BadgeCheck, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';

const Account = () => {
    const { user } = useAuth();

    const handleCopyId = () => {
        if (user?.shopId) {
            navigator.clipboard.writeText(user.shopId);
            toast.success("Shop ID copied to clipboard!");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'DD-MM-YY';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'DD-MM-YY';
        
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = String(date.getFullYear()).slice(-2);
        return `${d}-${m}-${y}`;
    };

    return (
        <div className="max-w-4xl space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tight">Account Settings</h1>
                <p className="text-slate-500 font-medium">Manage your personal profile and business identification.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ID Card / Badge Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-950 text-white p-8 rounded-[3rem] relative overflow-hidden shadow-2xl group">
                        <div className="relative z-10 space-y-6">
                            <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md">
                                <BadgeCheck size={32} className="text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Official Shop ID</p>
                                <h3 className="text-xl font-black tracking-widest font-mono">
                                    {user?.shopId || 'GENERATING...'}
                                </h3>
                            </div>
                            <button 
                                onClick={handleCopyId}
                                className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all"
                            >
                                <Copy size={16} /> Copy ID
                            </button>
                        </div>
                        {/* Decor */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl group-hover:scale-125 transition-transform"></div>
                    </div>

                    <div className="p-6 bg-indigo-50 dark:bg-indigo-500/5 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-500/20">
                        <div className="flex items-center gap-3 text-indigo-600 mb-4">
                            <ShieldCheck size={20} />
                            <h4 className="font-black uppercase text-xs tracking-widest">Verification Status</h4>
                        </div>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                            Status: <span className="text-emerald-600">{user?.approvalStatus || 'Approved'}</span>
                        </p>
                    </div>
                </div>

                {/* Main Details Section */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <User size={14} /> Shop Owner Name
                            </label>
                            <p className="text-lg font-black">{user?.ownerName}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <ShieldCheck size={14} /> Shop Name
                            </label>
                            <p className="text-lg font-black">{user?.shopName}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <Mail size={14} /> Email Address
                            </label>
                            <p className="text-lg font-black">{user?.email}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <Phone size={14} /> Phone Number
                            </label>
                            <p className="text-lg font-black">{user?.phone}</p>
                        </div>
                        <div className="sm:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <MapPin size={14} /> Shop Address
                            </label>
                            <p className="text-lg font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{user?.address}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <Calendar size={14} /> Joined Platform
                            </label>
                            <p className="text-lg font-black">{formatDate(user?.createdAt)}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <ShieldCheck size={14} /> Account Role
                            </label>
                            <p className="text-lg font-black uppercase text-indigo-600">{user?.role}</p>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-medium text-slate-500 italic">
                            * To update your official business details, please contact the system administrator.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;
