import React, { useCallback, useEffect, useState } from 'react';
import { Printer, RefreshCw, Store, CheckCircle2, Clock3, CircleSlash, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const statusMeta = {
    active: { label: 'Active', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
    inactive: { label: 'Inactive', icon: Clock3, className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
    'no-printer': { label: 'No printer', icon: CircleSlash, className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' }
};

const AdminPrinters = () => {
    const [shops, setShops] = useState([]);
    const [summary, setSummary] = useState({ totalShops: 0, active: 0, inactive: 0, noPrinter: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadPrinters = useCallback(async (quiet = false) => {
        if (quiet) setRefreshing(true); else setLoading(true);
        try {
            const response = await api.get('/admin/shop-printers');
            setShops(response.data.data || []);
            setSummary(response.data.summary || { totalShops: 0, active: 0, inactive: 0, noPrinter: 0 });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not load shop printer details.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadPrinters();
        const timer = window.setInterval(() => loadPrinters(true), 60000);
        return () => window.clearInterval(timer);
    }, [loadPrinters]);

    const formatSeen = value => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not reported yet';

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Admin tools</p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Shop Printers</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">See which shops have registered a receipt printer and when it last reported in.</p>
                </div>
                <button onClick={() => loadPrinters(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''}/> Refresh
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Total shops', value: summary.totalShops, icon: Store },
                    { label: 'Active printers', value: summary.active, icon: CheckCircle2 },
                    { label: 'Inactive printers', value: summary.inactive, icon: Clock3 },
                    { label: 'No printer', value: summary.noPrinter, icon: CircleSlash }
                ].map(card => {
                    const Icon = card.icon;
                    return <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between"><span className="text-sm text-slate-500">{card.label}</span><Icon size={18} className="text-indigo-600"/></div>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                    </div>;
                })}
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4 dark:border-slate-800"><Printer size={18} className="text-indigo-600"/><h2 className="font-bold text-slate-900 dark:text-white">Printer status by shop</h2></div>
                {loading ? <div className="space-y-3 p-5">{[1,2,3].map(n=><div key={n} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"/>)}</div> :
                    shops.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No registered shops found.</div> :
                    <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60"><tr>
                            <th className="px-4 py-3">Shop</th><th className="px-4 py-3">Printer</th><th className="px-4 py-3">Connection</th><th className="px-4 py-3">Paper</th><th className="px-4 py-3">Last seen</th><th className="px-4 py-3">Status</th>
                        </tr></thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {shops.map(shop => {
                                const meta = statusMeta[shop.printer?.status] || statusMeta['no-printer'];
                                const Icon = meta.icon;
                                return <tr key={shop._id}>
                                    <td className="px-4 py-4"><p className="font-semibold text-slate-900 dark:text-white">{shop.shopName || 'Unnamed shop'}</p><p className="mt-0.5 text-xs text-slate-500">{shop.ownerName} · {shop.shopId || shop.email}</p></td>
                                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{shop.printer?.isConfigured ? (shop.printer.printerName || 'Printer registered') : '—'}</td>
                                    <td className="px-4 py-4 capitalize text-slate-600 dark:text-slate-300">{shop.printer?.isConfigured ? String(shop.printer.connectionType || 'unknown').replace('-', ' ') : '—'}</td>
                                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{shop.printer?.isConfigured ? shop.printer.paperWidth + ' mm' : '—'}</td>
                                    <td className="px-4 py-4 text-xs text-slate-500">{formatSeen(shop.printer?.lastSeenAt)}</td>
                                    <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}><Icon size={13}/>{meta.label}</span></td>
                                </tr>;
                            })}
                        </tbody>
                    </table></div>
                }
            </div>
            <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><AlertCircle size={14} className="mt-0.5 shrink-0"/> A printer is shown as Active when the shop dashboard has reported a connection within the last 3 minutes. A closed browser or stopped connection will become Inactive automatically. Shops that have never registered a printer show No printer.</p>
        </div>
    );
};

export default AdminPrinters;
