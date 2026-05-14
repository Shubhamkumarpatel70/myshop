import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { Download, Search, ShieldAlert, ShieldCheck, Store } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

const planClass = (plan) => {
    if (plan === 'Elite' || plan === 'Enterprise') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
    if (plan === 'Professional') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
};

const Shops = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
        if (!term) return shops;

        return shops.filter((shop) =>
            [shop.shopName, shop.ownerName, shop.shopId, shop.email, shop.phone]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(term))
        );
    }, [shops, searchTerm]);

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
            shop.email || '-',
            shop.phone || '-',
            shop.subscriptionPlan || 'Free',
            shop.approvalStatus || 'Pending',
            shop.isSuspended ? 'Suspended' : 'Active',
        ]);

        doc.autoTable({
            startY: 34,
            head: [['Shop', 'Owner', 'Email', 'Phone', 'Plan', 'Approval', 'Status']],
            body: tableData,
            headStyles: { fillColor: [79, 70, 229], fontSize: 8 },
            bodyStyles: { fontSize: 8 },
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
                                            <button
                                                onClick={() => handleSuspend(shop)}
                                                className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                                    shop.isSuspended
                                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                        : 'bg-rose-600 text-white hover:bg-rose-700'
                                                }`}
                                            >
                                                {shop.isSuspended ? 'Reactivate' : 'Suspend'}
                                            </button>
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
        </div>
    );
};

export default Shops;
