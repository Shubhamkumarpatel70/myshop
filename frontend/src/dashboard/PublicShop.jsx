import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { Package, ShoppingBag, MapPin, Phone, Globe } from 'lucide-react';

const PublicShop = () => {
    const { shopSlug } = useParams();
    const [shopData, setShopData] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShop = async () => {
            try {
                // Fetch basic shop details and products by slug
                const [userRes, prodRes] = await Promise.all([
                    api.get(`/users/public/${shopSlug}`),
                    api.get(`/products/public/${shopSlug}`)
                ]);
                setShopData(userRes.data.data);
                setProducts(prodRes.data.data);
            } catch (error) {
                console.error("Failed to load shop");
            } finally {
                setLoading(false);
            }
        };
        fetchShop();
    }, [shopSlug]);

    if (loading) return (
        <div className="min-h-screen bg-secondary-50 dark:bg-black flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        </div>
    );

    if (!shopData) return (
        <div className="min-h-screen bg-secondary-50 dark:bg-black flex items-center justify-center flex-col gap-4">
            <h1 className="text-4xl font-black uppercase">Shop Not Found</h1>
            <p className="text-secondary-500">The link you followed may be broken or the shop has been closed.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-black text-secondary-900 dark:text-white font-sans">
            {/* Header / Hero */}
            <header className="bg-white dark:bg-secondary-900 border-b border-secondary-100 dark:border-secondary-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-600/20">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter">{shopData.shopName}</h1>
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase text-secondary-400 mt-0.5 tracking-widest">
                                <span className="flex items-center gap-1"><MapPin size={10} /> {shopData.address || 'India'}</span>
                                <span className="w-1 h-1 bg-secondary-200 rounded-full"></span>
                                <span className="flex items-center gap-1 text-primary-600"><Phone size={10} /> {shopData.phone}</span>
                            </div>
                        </div>
                    </div>
                    <button className="hidden md:flex px-6 py-3 bg-black dark:bg-white dark:text-black text-white rounded-2xl font-black uppercase text-xs tracking-widest gap-2 items-center hover:scale-105 transition-transform">
                        <Globe size={16} /> Contact Store
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight uppercase">Our Collection</h2>
                        <p className="text-secondary-500 mt-2 font-medium">Browse through our latest inventory and best prices.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-secondary-400 tracking-widest border-b-2 border-primary-500 pb-1">Items: {products.length}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {products.length > 0 ? (
                        products.map((product, idx) => (
                            <motion.div 
                                key={product._id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white dark:bg-secondary-900 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-secondary-100 dark:border-secondary-800 group"
                            >
                                <div className="h-64 overflow-hidden relative">
                                    {product.productImage ? (
                                        <img 
                                            src={product.productImage.startsWith('http') ? product.productImage : product.productImage} 
                                            alt={product.productName}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-secondary-50 dark:bg-secondary-800 flex items-center justify-center text-secondary-200">
                                            <Package size={64} />
                                        </div>
                                    )}
                                    <div className="absolute top-6 right-6 px-4 py-2 bg-black/80 backdrop-blur-md rounded-2xl text-white font-black text-lg">
                                        ₹{product.price}
                                    </div>
                                </div>
                                <div className="p-8">
                                    <p className="text-[10px] font-black uppercase text-primary-600 mb-2 tracking-widest">{product.category?.name || 'In Stock'}</p>
                                    <h3 className="text-xl font-black uppercase truncate group-hover:text-primary-600 transition-colors">{product.productName}</h3>
                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-secondary-50 dark:border-secondary-800">
                                        <div className={`w-2 h-2 rounded-full ${product.quantity > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                        <span className="text-[10px] font-black uppercase text-secondary-500 tracking-tighter">
                                            {product.quantity > 0 ? 'Available for purchase' : 'Currently out of stock'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-32 text-center">
                            <Package size={80} className="mx-auto text-secondary-100 mb-6" />
                            <h3 className="text-2xl font-black uppercase">No Products Available</h3>
                            <p className="text-secondary-500 mt-2">This shop hasn't listed any products yet.</p>
                        </div>
                    )}
                </div>
            </main>

            <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-secondary-100 dark:border-secondary-800 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-secondary-300">Powered by StockSaathi Platform</p>
                <p className="text-secondary-400 mt-4 font-bold text-sm">© {new Date().getFullYear()} {shopData.shopName}. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default PublicShop;
