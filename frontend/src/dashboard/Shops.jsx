import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { Download, Search, ShieldAlert, ShieldCheck, Store, Eye, Mail, Phone, MapPin, User, Calendar, Briefcase, Key } from 'lucide-react';
import Modal from '../components/Modal';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const planClass = (plan) => {
    if (plan === 'Elite' || plan === 'Enterprise') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
    if (plan === 'Professional') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
};

const Shops = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedShop, setSelectedShop] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const { setSession } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const res = await api.get('/reports/admin-stats');
                setShops(res.data.data.shops || []);
            } catch {
                toast.error('Failed to load merchant directory');
            } finally {
                setLoading(false);
            }
        };

        fetchShops();
    }, []);

    const filteredShops = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        let result = shops;

        if (term) {
            result = result.filter((shop) =>
                [shop.shopName, shop.ownerName, shop.shopId, shop.email, shop.phone]
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(term))
            );
        }

        if (statusFilter !== 'all') {
            if (statusFilter === 'active') result = result.filter(s => !s.isSuspended);
            if (statusFilter === 'suspended') result = result.filter(s => s.isSuspended);
            if (statusFilter === 'approved') result = result.filter(s => s.approvalStatus === 'Approved');
            if (statusFilter === 'pending') result = result.filter(s => s.approvalStatus === 'Pending');
        }

        return result;
    }, [shops, searchTerm, statusFilter]);

    const handleSuspend = async (shop) => {
        const action = shop.isSuspended ? 'reactivate' : 'suspend';
        if (!window.confirm(`Are you sure you want to ${action} ${shop.shopName}?`)) return;

        try {
            await api.put(`/users/${shop._id}/suspend`);
            toast.success(`Merchant ${action}d successfully`);

            setShops((prev) =>
                prev.map((item) =>
                    item._id === shop._id ? { ...item, isSuspended: !item.isSuspended } : item
                )
            );
        } catch {
            toast.error('Failed to update merchant status');
        }
    };

    const handleImpersonate = async (shop) => {
        if (!window.confirm(`SECURE ACCESS: Do you want to impersonate ${shop.shopName}?`)) return;

        try {
            const res = await api.post(`/admin/impersonate/${shop._id}`);
            if (res.data.success) {
                // Store impersonation flag and original identity
                localStorage.setItem('is_impersonating', 'true');
                localStorage.setItem('admin_token', localStorage.getItem('token')); 
                localStorage.setItem('admin_user', localStorage.getItem('user'));

                setSession(res.data.user, res.data.token);
                toast.success(`Access Tunnel Established: ${shop.shopName}`);
                navigate('/dashboard/overview');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Access Denied');
        }
    };

    const handleExportShops = () => {
        if (filteredShops.length === 0) return;

        const doc = new jsPDF();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('StockSaathi Merchant Directory', 14, 20);
        doc.setFontSize(9);
        doc.text(`Exported on ${new Date().toLocaleString('en-IN')}`, 14, 27);

        const tableData = filteredShops.map((shop) => [
            shop.shopName,
            shop.ownerName,
            shop.shopId || '-',
            shop.email || '-',
            shop.phone || '-',
            shop.subscriptionPlan || 'Free',
            shop.approvalStatus || 'Pending',
            shop.isSuspended ? 'Suspended' : 'Active',
            new Date(shop.createdAt).toLocaleDateString()
        ]);

        doc.autoTable({
            startY: 34,
            head: [['Shop Name', 'Owner Name', 'Shop ID', 'Email ID', 'Phone', 'Plan', 'Approval', 'Status', 'Joined On']],
            body: tableData,
            headStyles: { fillColor: [79, 70, 229], fontSize: 7 },
            bodyStyles: { fontSize: 7 },
        });

        doc.save(`merchant-directory-${Date.now()}.pdf`);
        toast.success('Merchant directory exported');
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Administration</p>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Shop Directory</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Manage and monitor all registered shops within the StockSaathi network.
                </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <Search size={18} className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by shop, owner, ID, email, phone"
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter</span>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-10 bg-transparent text-xs font-bold outline-none dark:text-white"
                    >
                        <option value="all">ALL NODES</option>
                        <option value="active">ACTIVE ONLY</option>
                        <option value="suspended">SUSPENDED</option>
                        <option value="approved">APPROVED</option>
                        <option value="pending">PENDING</option>
                    </select>
                </div>

                <button
                    onClick={handleExportShops}
                    className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                    <Download size={16} /> Export
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-medium text-slate-500">Merchants</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{filteredShops.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-medium text-slate-500">Approved</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-300">
                        {filteredShops.filter((s) => s.approvalStatus === 'Approved').length}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-medium text-slate-500">Suspended</p>
                    <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-300">
                        {filteredShops.filter((s) => s.isSuspended).length}
                    </p>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="min-w-[1080px] w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Store Details</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Business</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Approval</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading &&
                                [1, 2, 3].map((i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-4 py-6">
                                            <div className="h-6 rounded bg-slate-100 dark:bg-slate-800" />
                                        </td>
                                    </tr>
                                ))}

                            {!loading &&
                                filteredShops.map((shop) => (
                                    <tr key={shop._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                                                    <Store size={14} />
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{shop.shopName}</p>
                                                    <p className="text-xs text-slate-500">ID: {shop.shopId || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            <p>{shop.ownerName || 'N/A'}</p>
                                            <p className="text-xs text-slate-500">{shop.email || 'N/A'} • {shop.phone || 'N/A'}</p>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{shop.businessType || 'General'}</td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${planClass(shop.subscriptionPlan)}`}>
                                                {shop.subscriptionPlan || 'Free'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm font-medium text-slate-700 dark:text-slate-200">{shop.approvalStatus || 'Pending'}</td>
                                        <td className="px-4 py-4">
                                            {shop.isSuspended ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                                                    <ShieldAlert size={12} /> Suspended
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                                    <ShieldCheck size={12} /> Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleImpersonate(shop)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300"
                                                    title="Impersonate Shop"
                                                >
                                                    <Key size={14} />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedShop(shop); setIsViewModalOpen(true); }}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300"
                                                    title="View Details"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleSuspend(shop)}
                                                    className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${shop.isSuspended
                                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                            : 'bg-rose-600 text-white hover:bg-rose-700'
                                                        }`}
                                                >
                                                    {shop.isSuspended ? 'Reactivate' : 'Suspend'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                            {!loading && filteredShops.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                                        No merchants found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Shop Details"
                className="max-w-2xl"
            >
                {selectedShop && (
                    <div className="space-y-6 py-4">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-6 dark:border-slate-800">
                            <div className="grid h-16 w-16 place-items-center rounded-[1.25rem] bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                                <Store size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedShop.shopName}</h2>
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-600 mt-1">ID: {selectedShop.shopId || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Owner Identity</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800"><User size={14} /></div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Full Name</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedShop.ownerName || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800"><Mail size={14} /></div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Email Registry</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{selectedShop.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800"><Phone size={14} /></div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Contact Node</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedShop.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational Stats</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800"><Briefcase size={14} /></div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Business Category</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedShop.businessType || 'General'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800"><Calendar size={14} /></div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Onboarding Date</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{new Date(selectedShop.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800"><MapPin size={14} /></div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Physical Address</p>
                                            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{selectedShop.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Licensing</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{selectedShop.subscriptionPlan || 'Free Tier'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                                    <p className={`text-sm font-bold mt-1 ${selectedShop.isSuspended ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {selectedShop.isSuspended ? 'Suspended' : 'Verified & Active'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">KYC: Aadhar Card Images</h3>
                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { label: 'Front Side', field: 'aadharFront' },
                                    { label: 'Back Side', field: 'aadharBack' }
                                ].map((side, i) => (
                                    <div key={i} className="space-y-2">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-2">{side.label}</p>
                                        <div className="relative group aspect-video rounded-[2rem] overflow-hidden border-4 border-slate-100 dark:border-white/5 bg-slate-950 shadow-xl shadow-slate-200/50 dark:shadow-none">
                                            {selectedShop[side.field] ? (
                                                <>
                                                    <img src={selectedShop[side.field].startsWith('http') ? selectedShop[side.field] : `${BASE_URL}${selectedShop[side.field]}`} alt={side.label} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <a href={selectedShop[side.field].startsWith('http') ? selectedShop[side.field] : `${BASE_URL}${selectedShop[side.field]}`} target="_blank" rel="noreferrer" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-950 shadow-2xl hover:scale-110 transition-all">
                                                            <Eye size={20} />
                                                        </a>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-100 dark:bg-slate-900">
                                                    <ShieldAlert size={24} className="opacity-20" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest mt-2">No Document</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {(selectedShop.paymentScreenshot || selectedShop.pendingSubscription?.screenshot) && (
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 ml-4">Payment Verification Proof</h3>
                                <div className="overflow-hidden rounded-[2rem] border-2 border-indigo-500/20 shadow-xl shadow-indigo-500/10">
                                    <img 
                                        src={(selectedShop.paymentScreenshot || selectedShop.pendingSubscription?.screenshot).startsWith('http') ? (selectedShop.paymentScreenshot || selectedShop.pendingSubscription?.screenshot) : `${BASE_URL}${selectedShop.paymentScreenshot || selectedShop.pendingSubscription?.screenshot}`} 
                                        alt="Payment Proof" 
                                        className="w-full h-auto object-cover"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Shops;
