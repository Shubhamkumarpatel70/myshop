import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { 
    Share2, ExternalLink, Package, 
    Copy, Check, Globe, LayoutGrid, List
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const MyShop = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data.data);
        } catch (error) {
            toast.error("Failed to load shop products");
        } finally {
            setLoading(false);
        }
    };

    const shopLink = `${window.location.origin}/shop/${user?.shopSlug || user?._id}`;
    const shareMessage = `Hey! Check out my shop "${user?.shopName}" on StockSaathi platform. View all our products here: ${shopLink}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shopLink);
        setCopied(true);
        toast.success("Shop link copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: user?.shopName,
                text: shareMessage,
                url: shopLink,
            }).catch(() => toast.error("Sharing failed"));
        } else {
            handleCopyLink();
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Premium Header Card */}
            <div className="relative overflow-hidden bg-white dark:bg-secondary-900 p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-secondary-100 dark:border-secondary-800">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

                <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left w-full lg:w-auto">
                        <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-primary-500 to-primary-700 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-primary-500/20 shrink-0">
                            <Globe size={48} className="animate-pulse-slow" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase truncate">{user?.shopName}</h1>
                                <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded-lg border border-emerald-200 dark:border-emerald-800 tracking-widest">Live</span>
                            </div>
                            <p className="text-secondary-500 font-medium text-sm md:text-base max-w-xl mx-auto md:mx-0">Your professional storefront is active. Customers can browse and view your live inventory from anywhere.</p>
                            
                            <div className="flex items-center justify-center md:justify-start gap-2 mt-4 p-2 pl-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-2xl border border-secondary-100 dark:border-secondary-800 max-w-md">
                                <Globe size={14} className="text-primary-600 shrink-0" />
                                <span className="text-[11px] font-bold text-secondary-600 dark:text-secondary-400 truncate flex-1">{shopLink}</span>
                                <button 
                                    onClick={handleCopyLink}
                                    className="p-2 bg-white dark:bg-secondary-700 text-secondary-400 hover:text-primary-600 rounded-xl transition-all shadow-sm"
                                    title="Copy Link"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <button 
                            onClick={handleShare}
                            className="w-full sm:w-auto px-8 py-5 bg-black dark:bg-white text-white dark:text-black rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl hover:scale-105 transition-all group"
                        >
                            <Share2 size={18} className="group-hover:rotate-12 transition-transform" /> Share Store
                        </button>
                        <a 
                            href={shopLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-8 py-5 bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-300 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-all"
                        >
                            <ExternalLink size={18} /> View Public
                        </a>
                    </div>
                </div>
            </div>

            {/* Grid Header */}
            <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-black uppercase tracking-tight">Active Products</h3>
                    <span className="px-3 py-1 bg-secondary-100 dark:bg-secondary-800 text-secondary-500 text-[10px] font-black rounded-full uppercase tracking-widest">{products.length} Items</span>
                </div>
                <div className="flex bg-secondary-100 dark:bg-secondary-800 p-1 rounded-xl">
                    <button className="p-2 bg-white dark:bg-secondary-700 rounded-lg shadow-sm text-primary-600"><LayoutGrid size={18} /></button>
                    <button className="p-2 text-secondary-400 opacity-50"><List size={18} /></button>
                </div>
            </div>

            {/* Responsive Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-2 md:px-0">
                {loading ? (
                    [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-[400px] bg-secondary-100 dark:bg-secondary-800 animate-pulse rounded-[2.5rem]"></div>
                    ))
                ) : products.length > 0 ? (
                    products.map((product, idx) => (
                        <motion.div 
                            key={product._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white dark:bg-secondary-900 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-secondary-100 dark:border-secondary-800 group relative"
                        >
                            {/* Product Image Holder */}
                            <div className="h-64 overflow-hidden relative bg-secondary-50 dark:bg-secondary-950">
                                {product.productImage ? (
                                    <img 
                                        src={product.productImage.startsWith('http') ? product.productImage : product.productImage} 
                                        alt={product.productName}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-secondary-200">
                                        <Package size={64} strokeWidth={1} />
                                        <span className="text-[10px] font-black uppercase tracking-widest mt-2">No Image</span>
                                    </div>
                                )}
                                
                                {/* Float Tags */}
                                <div className="absolute top-6 left-6">
                                    <span className="px-3 py-1.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-black uppercase rounded-xl tracking-widest border border-white/10 shadow-lg">
                                        {product.category?.name || 'Retail'}
                                    </span>
                                </div>
                                <div className="absolute top-6 right-6">
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl text-black font-black text-lg shadow-xl border border-white">
                                            ₹{product.price}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="p-8">
                                <h3 className="text-xl font-black uppercase truncate tracking-tight mb-2 group-hover:text-primary-600 transition-colors">
                                    {product.productName}
                                </h3>
                                <p className="text-xs text-secondary-400 line-clamp-2 mb-6 min-h-[2rem]">
                                    {product.description || 'Professional retail quality product ready for purchase.'}
                                </p>
                                
                                <div className="flex justify-between items-center pt-6 border-t border-secondary-50 dark:border-secondary-800">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${product.quantity > 0 ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${product.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {product.quantity > 0 ? `${product.quantity} Units` : 'Out of Stock'}
                                        </span>
                                    </div>
                                    <Link 
                                        to="/dashboard/inventory"
                                        className="p-3 bg-secondary-50 dark:bg-secondary-800 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all"
                                    >
                                        <ExternalLink size={18} />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full py-32 text-center bg-white dark:bg-secondary-900 rounded-[4rem] border-4 border-dashed border-secondary-50 dark:border-secondary-800">
                        <div className="w-24 h-24 bg-secondary-50 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Package size={48} className="text-secondary-200" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">Empty Inventory</h3>
                        <p className="text-secondary-500 mt-2 max-w-sm mx-auto font-medium">Your public store needs products to display. Add some items to your inventory to go live!</p>
                        <Link to="/dashboard/inventory" className="btn btn-primary mt-8 px-10 py-4 rounded-2xl">Add Your First Product</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyShop;
