import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { Calendar, ExternalLink, Receipt, Search, ShoppingCart, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
};

const statusClass = (status) => {
    if (status === 'Returned') return 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300';
    if (status === 'Partial Return') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
};

const AdminSales = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState(null);

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const res = await api.get('/sales');
                setSales(res.data.data || []);
            } catch {
                toast.error('Failed to load transaction surveillance data');
            } finally {
                setLoading(false);
            }
        };

        fetchSales();
    }, []);

    const filteredSales = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return sales;

        return sales.filter((sale) =>
            [
                sale.transactionId,
                sale._id,
                sale.customerName,
                sale.customerPhone,
                sale.user?.shopName,
                sale.user?.ownerName,
            ]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(term))
        );
    }, [sales, searchTerm]);

    const summary = useMemo(() => {
        const totalSales = filteredSales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);
        const returned = filteredSales.filter((sale) => sale.status === 'Returned').length;
        const partial = filteredSales.filter((sale) => sale.status === 'Partial Return').length;

        return {
            count: filteredSales.length,
            totalSales,
            returned,
            partial,
        };
    }, [filteredSales]);

    return (
        <div className="space-y-6 pb-10">
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Administration</p>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">All Transactions</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Monitor sales, customer details, item counts, and payment status in one simple ledger.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-medium text-slate-500">Total Transactions</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{summary.count}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-medium text-slate-500">Total Sales</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">₹{summary.totalSales.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-medium text-slate-500">Returned</p>
                    <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-300">{summary.returned}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-medium text-slate-500">Partial Return</p>
                    <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-300">{summary.partial}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4">
                <div className="relative">
                    <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search transaction ID, shop, customer, phone"
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="min-w-[1050px] w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Transaction ID</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Store & Customer</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Items</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading &&
                                [1, 2, 3, 4].map((i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-4 py-6">
                                            <div className="h-6 rounded bg-slate-100 dark:bg-slate-800" />
                                        </td>
                                    </tr>
                                ))}

                            {!loading &&
                                filteredSales.map((sale) => {
                                    const itemCount = sale.items?.length || 0;
                                    const qty = (sale.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

                                    return (
                                        <tr key={sale._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-4 align-top">
                                                <p className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                                                    {sale.transactionId || sale._id}
                                                </p>
                                                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                                    <Calendar size={12} /> {formatDateTime(sale.createdAt)}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4 align-top">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{sale.user?.shopName || 'Unknown Shop'}</p>
                                                <p className="mt-1 text-xs text-slate-500">{sale.customerName || 'Walk-in Client'}{sale.customerPhone ? ` • ${sale.customerPhone}` : ''}</p>
                                            </td>
                                            <td className="px-4 py-4 align-top">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{itemCount} items</p>
                                                <p className="mt-1 text-xs text-slate-500">Total Qty: {qty}</p>
                                            </td>
                                            <td className="px-4 py-4 align-top">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">₹{(sale.totalAmount || 0).toLocaleString()}</p>
                                                <p className="mt-1 text-xs text-slate-500">{sale.paymentMethod || 'N/A'}</p>
                                            </td>
                                            <td className="px-4 py-4 align-top">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(sale.status)}`}>
                                                    {sale.status || 'Completed'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 align-top">
                                                <button
                                                    onClick={() => setSelectedSale(sale)}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    <ExternalLink size={14} /> View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}

                            {!loading && filteredSales.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                                        No transactions found for this search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={Boolean(selectedSale)}
                onClose={() => setSelectedSale(null)}
                title="Transaction Receipt"
                className="max-w-4xl"
            >
                {selectedSale && (
                    <div className="space-y-5 py-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                                <p className="text-xs text-slate-500">Transaction ID</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{selectedSale.transactionId || selectedSale._id}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                                <p className="text-xs text-slate-500">Merchant</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{selectedSale.user?.shopName || 'Unknown Shop'}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                                <p className="text-xs text-slate-500">Client</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{selectedSale.customerName || 'Walk-in Client'}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                                <p className="text-xs text-slate-500">Total Sales</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">₹{(selectedSale.totalAmount || 0).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="overflow-x-auto">
                                <table className="min-w-[640px] w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                        <tr>
                                            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
                                            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Qty</th>
                                            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Price</th>
                                            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {(selectedSale.items || []).map((item, idx) => (
                                            <tr key={`${item.product?._id || item.productName}-${idx}`}>
                                                <td className="px-3 py-2 text-sm text-slate-900 dark:text-white">{item.productName || item.product?.productName || 'N/A'}</td>
                                                <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300">{item.quantity || 0}</td>
                                                <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300">₹{(item.price || 0).toLocaleString()}</td>
                                                <td className="px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white">₹{(item.total || 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                            <p className="text-xs text-slate-500">Date: {formatDateTime(selectedSale.createdAt)} • Staff: {selectedSale.user?.ownerName || 'N/A'}</p>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                                <Receipt size={16} className="text-indigo-600" />
                                Status: {selectedSale.status || 'Completed'}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminSales;
