import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { ExternalLink, Package, Search, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const formatCurrency = (value) => `₹${(value || 0).toLocaleString()}`;

const AdminInventory = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedShop, setSelectedShop] = useState(null);
    const [shopInventory, setShopInventory] = useState([]);
    const [inventoryLoading, setInventoryLoading] = useState(false);

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const res = await api.get('/reports/admin-stats');
                setShops(res.data.data.shops || []);
            } catch {
                toast.error('Failed to load global inventory shops');
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
            [shop.shopName, shop.ownerName, shop.shopId].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))
        );
    }, [shops, searchTerm]);

    const totalProducts = useMemo(
        () => filteredShops.reduce((sum, shop) => sum + (shop.productCount || 0), 0),
        [filteredShops]
    );

    const viewShopInventory = async (shop) => {
        setSelectedShop(shop);
        setInventoryLoading(true);
        try {
            const res = await api.get(`/products?user=${shop._id}`);
            setShopInventory(res.data.data || []);
        } catch {
            toast.error('Failed to load selected shop inventory');
            setShopInventory([]);
        } finally {
            setInventoryLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Admin Operations</p>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Global Inventory</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Oversee inventory levels across all registered shops with real-time stock diagnostics.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-medium text-slate-500">Total Shops</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{filteredShops.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-medium text-slate-500">Total Products</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{totalProducts}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-medium text-slate-500">Inventory Health</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-300">Live</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4">
                <div className="relative">
                    <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search shop, owner, shop ID"
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {loading &&
                    [1, 2, 3].map((i) => (
                        <div key={i} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
                    ))}

                {!loading &&
                    filteredShops.map((shop) => (
                        <div key={shop._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                                        <Store size={18} />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{shop.shopName}</p>
                                        <p className="text-xs text-slate-500">{shop.ownerName}</p>
                                    </div>
                                </div>
                                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                    {shop.productCount || 0} products
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                                    <p className="text-slate-500">Shop ID</p>
                                    <p className="mt-1 truncate font-medium text-slate-900 dark:text-white">{shop.shopId || 'N/A'}</p>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                                    <p className="text-slate-500">Status</p>
                                    <p className="mt-1 font-medium text-emerald-600 dark:text-emerald-300">Active</p>
                                </div>
                            </div>

                            <button
                                onClick={() => viewShopInventory(shop)}
                                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                <ExternalLink size={15} /> View Inventory
                            </button>
                        </div>
                    ))}
            </div>

            <Modal
                isOpen={Boolean(selectedShop)}
                onClose={() => {
                    setSelectedShop(null);
                    setShopInventory([]);
                }}
                title={selectedShop ? `${selectedShop.shopName} Inventory` : 'Inventory'}
                className="max-w-6xl"
            >
                <div className="space-y-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedShop?.shopName || 'Selected shop'}</p>
                        <p className="text-xs text-slate-500">Total Product: {shopInventory.length}</p>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="overflow-x-auto">
                            <table className="min-w-[980px] w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Product Name</th>
                                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Inventory</th>
                                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Total Stock ₹</th>
                                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Control</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {inventoryLoading &&
                                        [1, 2, 3].map((i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={6} className="px-3 py-4">
                                                    <div className="h-5 rounded bg-slate-100 dark:bg-slate-800" />
                                                </td>
                                            </tr>
                                        ))}

                                    {!inventoryLoading &&
                                        shopInventory.map((product) => {
                                            const isLow = (product.quantity || 0) <= (product.lowStockThreshold || 0);
                                            const valuation = (product.quantity || 0) * (product.price || 0);

                                            return (
                                                <tr key={product._id}>
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <Package size={14} className="text-indigo-600" />
                                                            <span className="text-sm font-medium text-slate-900 dark:text-white">{product.productName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300">{product.category?.name || 'Uncategorized'}</td>
                                                    <td className="px-3 py-3 text-sm font-semibold text-slate-900 dark:text-white">{product.quantity || 0}</td>
                                                    <td className="px-3 py-3 text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(valuation)}</td>
                                                    <td className="px-3 py-3">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${isLow
                                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                                                }`}
                                                        >
                                                            {isLow ? 'Low Stock' : 'Healthy'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <span className="inline-flex rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                                                            {isLow ? 'Restock Needed' : 'No Action'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                    {!inventoryLoading && shopInventory.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                                                No inventory found for this shop.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminInventory;
