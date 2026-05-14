import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { Search, User, ShieldCheck, Mail, Phone, Store, Users, Activity, Download, Copy, Eye, ExternalLink, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Modal from '../components/Modal';

const AdminStaff = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const copyToClipboard = (id) => {
        if (!id) return;
        navigator.clipboard.writeText(id);
        toast.success(`Shop ID ${id} copied to clipboard`);
    };

    useEffect(() => {
        const fetchAllStaff = async () => {
            try {
                const res = await api.get('/users/staff');
                setStaff(res.data.data || []);
            } catch {
                toast.error('Failed to load global staff directory');
            } finally {
                setLoading(false);
            }
        };

        fetchAllStaff();
    }, []);

    const filteredStaff = useMemo(() => {
        const term = searchTerm.toLowerCase();
        let result = staff;

        if (term) {
            result = result.filter(s => 
                [s.ownerName, s.email, s.phone, s.createdBy?.shopName]
                    .filter(Boolean)
                    .some(v => v.toLowerCase().includes(term))
            );
        }

        if (roleFilter !== 'all') {
            result = result.filter(s => s.role === roleFilter);
        }

        return result;
    }, [staff, searchTerm, roleFilter]);

    const handleExport = () => {
        if (filteredStaff.length === 0) return;

        const doc = new jsPDF();
        doc.setFont('helvetica', 'bold');
        doc.text('StockSaathi Global Staff Directory', 14, 20);
        
        const tableData = filteredStaff.map(s => [
            s.ownerName,
            s.role.toUpperCase(),
            s.phone,
            s.email,
            s.createdBy?.shopName || 'N/A',
            s.createdBy?.ownerName || 'N/A'
        ]);

        doc.autoTable({
            startY: 30,
            head: [['Staff Name', 'Role', 'Mobile', 'Email', 'Shop Name', 'Shop Owner']],
            body: tableData,
            headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save(`global-staff-${Date.now()}.pdf`);
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Administrative Oversight</p>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Global Staff Registry</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Monitor all operational staff nodes across the StockSaathi network.
                </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <Search size={18} className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, email, phone, or shop..."
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</span>
                    <select 
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="h-10 bg-transparent text-xs font-bold outline-none dark:text-white"
                    >
                        <option value="all">ALL ROLES</option>
                        <option value="manager">MANAGERS</option>
                        <option value="cashier">CASHIERS</option>
                    </select>
                </div>

                <button
                    onClick={handleExport}
                    className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                    <Download size={16} /> Export
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-medium text-slate-500">Total Staff</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{filteredStaff.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-medium text-slate-500">Managers</p>
                    <p className="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                        {filteredStaff.filter(s => s.role === 'manager').length}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-medium text-slate-500">Cashiers</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-300">
                        {filteredStaff.filter(s => s.role === 'cashier').length}
                    </p>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Staff Identity</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned Shop</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? [1, 2, 3].map(i => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-4 py-6">
                                        <div className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800" />
                                    </td>
                                </tr>
                            )) : filteredStaff.map((s) => (
                                <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.ownerName}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ID: {s.aadharNumber || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2"><Phone size={10} className="text-indigo-500" /> {s.phone}</div>
                                            <div className="flex items-center gap-2"><Mail size={10} className="text-indigo-500" /> {s.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-slate-400 dark:bg-slate-800/50">
                                                <Store size={14} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.createdBy?.shopName || 'N/A'}</p>
                                                    {s.createdBy?.shopId && (
                                                        <button 
                                                            onClick={() => copyToClipboard(s.createdBy.shopId)}
                                                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                                                            title="Copy Shop ID"
                                                        >
                                                            <Copy size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Owner: {s.createdBy?.ownerName || 'N/A'}</p>
                                                {s.createdBy?.shopId && (
                                                    <p className="text-[9px] text-indigo-500 font-black tracking-widest mt-0.5">ID: {s.createdBy.shopId}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                            <ShieldCheck size={10} /> Active
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <button 
                                            onClick={() => { setSelectedStaff(s); setIsViewModalOpen(true); }}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all dark:bg-indigo-500/10 dark:text-indigo-300"
                                            title="View Full Intel"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed Intel Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Staff Diagnostic Manifest" className="max-w-4xl">
                {selectedStaff && (
                    <div className="py-8 space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                            {/* Personal Details */}
                            <div className="md:col-span-7 space-y-10">
                                <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 dark:border-white/5 space-y-8 shadow-inner">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20"><User size={32} /></div>
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Full Identity</p>
                                            <h4 className="text-2xl font-black dark:text-white leading-none uppercase">{selectedStaff.ownerName}</h4>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                            <p className="text-sm font-bold dark:text-white truncate">{selectedStaff.email}</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Uplink Number</p>
                                            <p className="text-sm font-bold dark:text-white">{selectedStaff.phone}</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aadhar Number</p>
                                            <p className="text-sm font-bold dark:text-white">{selectedStaff.aadharNumber || 'NOT RECORDED'}</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Staff Role</p>
                                            <p className="text-sm font-black text-indigo-600 uppercase">{selectedStaff.role}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] ml-4">KYC: Aadhar Card Images</p>
                                    <div className="grid grid-cols-2 gap-6">
                                        {[
                                            { label: 'Front Side', field: 'aadharFront' },
                                            { label: 'Back Side', field: 'aadharBack' }
                                        ].map((side, i) => (
                                            <div key={i} className="space-y-3">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">{side.label}</p>
                                                <div className="relative group aspect-video rounded-3xl overflow-hidden border-4 border-slate-100 dark:border-white/5 bg-slate-950 shadow-xl">
                                                    {selectedStaff[side.field] ? (
                                                        <>
                                                            <img src={selectedStaff[side.field]} alt={side.label} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <a href={selectedStaff[side.field]} target="_blank" rel="noreferrer" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-950 shadow-2xl hover:scale-110 transition-all"><ExternalLink size={20} /></a>
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
                            </div>

                            {/* Store & Security Details */}
                            <div className="md:col-span-5 space-y-8">
                                <div className="p-8 bg-indigo-600 text-white rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Store size={20} /></div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Assigned Shop</p>
                                                <p className="text-lg font-black uppercase tracking-tight">{selectedStaff.createdBy?.shopName || 'UNASSIGNED'}</p>
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-white/20 grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Shop Owner</p>
                                                <p className="text-sm font-bold">{selectedStaff.createdBy?.ownerName || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Shop ID</p>
                                                <p className="text-sm font-bold font-mono tracking-tighter">{selectedStaff.createdBy?.shopId || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20"><Key size={24} /></div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Security Status</p>
                                            <p className="text-base font-black text-emerald-500 uppercase tracking-widest">VERIFIED ACTIVE</p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 text-center">Node Onboarding Date</p>
                                        <p className="text-lg font-black text-white text-center">{new Date(selectedStaff.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminStaff;
