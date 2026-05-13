import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { 
    Store, Package, Search, ExternalLink, 
    AlertCircle, Filter, ArrowUpDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const AdminInventory = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedShop, setSelectedShop] = useState(null);
    const [shopInventory, setShopInventory] = useState([]);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const res = await api.get('/reports/admin-stats');
            setShops(res.data.data.shops);
        } catch (error) {
            toast.error("Failed to fetch shop list");
        } finally {
            setLoading(false);
        }
    };

    const viewShopInventory = async (shop) => {
        setSelectedShop(shop);
        setIsModalOpen(true);
        setInventoryLoading(true);
        try {
            // Re-using products endpoint but filtering by shop ID (handled by controller update)
            const res = await api.get(`/products?user=${shop._id}`);
            setShopInventory(res.data.data);
        } catch (error) {
            toast.error("Failed to fetch shop inventory");
        } finally {
            setInventoryLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Global Inventory Node</h1>
                    <p className="text-secondary-500 font-medium">Real-time surveillance of stock levels across the global commerce network.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-48 bg-white dark:bg-secondary-900 rounded-[2rem] animate-pulse"></div>)
                ) : shops.map((shop) => (
                    <motion.div 
                        key={shop._id}
                        whileHover={{ y: -5 }}
                        className="bg-white dark:bg-secondary-900 p-6 rounded-[2rem] shadow-xl border border-secondary-100 dark:border-secondary-800"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600">
                                <Store size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{shop.shopName}</h3>
                                <p className="text-xs text-secondary-500">{shop.ownerName}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3 bg-secondary-50 dark:bg-secondary-800/50 rounded-xl">
                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1">Stock Items</p>
                                <p className="text-xl font-black">---</p>
                            </div>
                            <div className="p-3 bg-secondary-50 dark:bg-secondary-800/50 rounded-xl">
                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1">Status</p>
                                <span className="text-emerald-500 text-xs font-bold uppercase">Healthy</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => viewShopInventory(shop)}
                            className="w-full py-3 bg-secondary-100 dark:bg-secondary-800 rounded-xl text-sm font-bold hover:bg-secondary-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <ExternalLink size={16} /> View Shop Inventory
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Shop Inventory Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={`${selectedShop?.shopName} - Inventory List`}
                className="max-w-5xl"
            >
                <div className="space-y-4">
                    {inventoryLoading ? (
                        <div className="space-y-3 py-10">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-secondary-100 dark:bg-secondary-800 rounded-xl animate-pulse"></div>)}
                        </div>
                    ) : shopInventory.length > 0 ? (
                        <div className="overflow-x-auto rounded-2xl border border-secondary-100 dark:border-secondary-800">
                            <table className="w-full text-left">
                                <thead className="bg-secondary-50 dark:bg-secondary-800/50">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">Product</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">Category</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">Stock</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">Price</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary-500">Expiry</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                                    {shopInventory.map((product) => (
                                        <tr key={product._id} className="hover:bg-secondary-50/50 dark:hover:bg-secondary-800/30">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Package size={16} className="text-primary-600" />
                                                    <span className="text-sm font-bold">{product.productName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium text-secondary-500">{product.category?.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-sm font-black ${product.quantity <= product.lowStockThreshold ? 'text-red-500' : ''}`}>
                                                    {product.quantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold">₹{product.price}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-secondary-500">{product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : 'N/A'}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-20 text-center text-secondary-500 italic">This shop has no products in stock.</div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default AdminInventory;
