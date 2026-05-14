import React, { useMemo, useState } from 'react';
import api from '../utils/api';
import { AlertCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const AdminOrderFinder = () => {
    const [orderId, setOrderId] = useState('');
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!orderId.trim()) return;

        setLoading(true);
        setOrder(null);
        setSearched(true);

        try {
            const res = await api.get(`/sales/${orderId.trim()}`);
            setOrder(res.data.data || null);
            toast.success('Order found');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Order not found');
        } finally {
            setLoading(false);
        }
    };

    const payloadSummary = useMemo(() => {
        if (!order?.items) return { items: 0, qty: 0 };
        return {
            items: order.items.length,
            qty: order.items.reduce((sum, item) => sum + (item.quantity || 0), 0),
        };
    }, [order]);

    return (
        <div className="space-y-6 pb-10">
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Administrative Tools</p>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Order Lookup</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Find order receipts with transaction details, payment information, and order status.
                </p>
            </div>

            <form onSubmit={handleSearch} className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4">
                <div className="flex flex-col gap-3 md:flex-row">
                    <div className="relative flex-1">
                        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            placeholder="Enter transaction ID or order ID"
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {loading ? 'Searching...' : 'Find Order'}
                    </button>
                </div>
            </form>

            {order && (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                            <p className="text-xs text-slate-500">Transaction ID</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{order.transactionId || order._id}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                            <p className="text-xs text-slate-500">Shop & Customer</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{order.user?.shopName || 'N/A'} • {order.customerName || 'Walk-in'}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                            <p className="text-xs text-slate-500">Items Count</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{payloadSummary.items} items / {payloadSummary.qty} qty</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                            <p className="text-xs text-slate-500">Payment</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">₹{(order.totalAmount || 0).toLocaleString()} • {order.paymentMethod}</p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                        <div className="overflow-x-auto">
                            <table className="min-w-[980px] w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Order ID</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date & Staff</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    <tr>
                                        <td className="px-4 py-4 text-sm font-semibold text-slate-900 dark:text-white">{order.transactionId || order._id}</td>
                                        <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {formatDate(order.createdAt)}
                                            <div className="text-xs text-slate-500">{order.user?.ownerName || order.user?.shopName || 'N/A'}</div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">Standard Sale</td>
                                        <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{order.paymentMethod || 'N/A'}</td>
                                        <td className="px-4 py-4 text-sm font-semibold text-slate-900 dark:text-white">₹{(order.totalAmount || 0).toLocaleString()}</td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                                {order.status || 'Completed'}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                        <div className="overflow-x-auto">
                            <table className="min-w-[900px] w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Product Name</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Qty</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {(order.items || []).map((item, idx) => (
                                        <tr key={`${item.product?._id || item.productName}-${idx}`}>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{item.productName || item.product?.productName || 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.product?.category?.name || 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.quantity || 0}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">₹{(item.total || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.isReturned ? 'Returned' : 'Sold'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.isReturned ? 'Return logged' : 'No action'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {!order && searched && !loading && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
                    <AlertCircle size={28} className="mx-auto text-rose-500" />
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">No order found for this ID</p>
                    <p className="mt-1 text-xs text-slate-500">Checked: {orderId}</p>
                </div>
            )}
        </div>
    );
};

export default AdminOrderFinder;
