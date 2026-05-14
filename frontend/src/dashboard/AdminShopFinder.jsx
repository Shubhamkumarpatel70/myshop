import React, { useState } from 'react';
import api, { BASE_URL } from '../utils/api';
import { AlertCircle, Search, Store } from 'lucide-react';
import toast from 'react-hot-toast';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const AdminShopFinder = () => {
    const [shopId, setShopId] = useState('');
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!shopId.trim()) return;

        setLoading(true);
        setSearched(true);
        setShop(null);

        try {
            const res = await api.get(`/admin/shop-lookup/${shopId.trim()}`);
            setShop(res.data.data || null);
            toast.success('Shop node found');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Shop not found');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Administrative Tools</p>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Shop Finder</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Locate any shop within the StockSaathi network using their unique ID.
                </p>
            </div>

            <form onSubmit={handleSearch} className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4">
                <div className="flex flex-col gap-3 md:flex-row">
                    <div className="relative flex-1">
                        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={shopId}
                            onChange={(e) => setShopId(e.target.value)}
                            placeholder="Enter shop ID (example: SS-MUM-42-120524)"
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {loading ? 'Searching...' : 'Find Shop'}
                    </button>
                </div>
            </form>

            {shop && (
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-1">
                        <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                                <Store size={18} />
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{shop.shopName}</p>
                                <p className="text-xs text-slate-500">ID: {shop.shopId || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-900 dark:text-white">Plan Type:</span>
                                <span className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${shop.subscriptionPlan === 'Free' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-600 text-white'}`}>
                                    {shop.subscriptionPlan || 'Free'}
                                </span>
                            </div>
                            <p className="flex justify-between"><span className="font-medium text-slate-900 dark:text-white">Activated On:</span> {formatDate(shop.planActivatedAt || shop.createdAt)}</p>
                            <p className="flex justify-between"><span className="font-medium text-slate-900 dark:text-white">Expiry Date:</span> {shop.planExpiresAt ? formatDate(shop.planExpiresAt) : 'Lifetime'}</p>
                            <p className="flex justify-between"><span className="font-medium text-slate-900 dark:text-white">Verified:</span> {shop.isPaymentDone ? 'Yes' : 'No'}</p>
                            <p className="flex justify-between"><span className="font-medium text-slate-900 dark:text-white">Account Status:</span> <span className={shop.isSuspended ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>{shop.isSuspended ? 'Suspended' : 'Active'}</span></p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                                <p className="text-xs text-slate-500">Owner Name</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{shop.ownerName || 'N/A'}</p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                                <p className="text-xs text-slate-500">Account Created</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatDate(shop.createdAt)}</p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                                <p className="text-xs text-slate-500">Contact Number</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{shop.phone || 'N/A'}</p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                                <p className="text-xs text-slate-500">Email Address</p>
                                <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">{shop.email || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                            <p className="text-xs text-slate-500">Store Address</p>
                            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{shop.address || 'N/A'}</p>
                        </div>

                        {shop.aadharImage && (
                            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                <img
                                    src={shop.aadharImage.startsWith('http') ? shop.aadharImage : `${BASE_URL}${shop.aadharImage}`}
                                    alt="KYC"
                                    className="h-56 w-full object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!shop && searched && !loading && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
                    <AlertCircle size={28} className="mx-auto text-rose-500" />
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">No matching shop found</p>
                    <p className="mt-1 text-xs text-slate-500">Checked ID: {shopId}</p>
                </div>
            )}
        </div>
    );
};

export default AdminShopFinder;
