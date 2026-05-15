import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Package, ShoppingBag, MapPin, Phone, 
    ArrowRight, ShieldCheck, 
    Zap, Star, Award
} from 'lucide-react';

const PublicShop = () => {
    const { shopSlug, shopId } = useParams();
    const [shopData, setShopData] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");

    useEffect(() => {
        const fetchShop = async () => {
            try {
                const userRes = shopId 
                    ? await api.get(`/users/public/shops/${shopId}`)
                    : await api.get(`/users/public/${shopSlug}`);
                
                setShopData(userRes.data.data);

                const prodRes = shopId
                    ? await api.get(`/products/public/shop/${shopId}`)
                    : await api.get(`/products/public/${shopSlug}`);
                
                setProducts(prodRes.data.data);
            } catch (error) {
                console.error("Failed to load shop");
            } finally {
                setLoading(false);
            }
        };
        fetchShop();
    }, [shopSlug, shopId]);

    const filteredProducts = products.filter(p => {
        const matchesCategory = activeCategory === "All" || p.category?.name === activeCategory;
        return matchesCategory;
    });

    const categories = ["All", ...new Set(products.map(p => p.category?.name).filter(Boolean))];

    const maskPhone = (phone) => {
        if (!phone) return 'N/A';
        const str = phone.toString();
        if (str.length < 8) return str;
        return str.substring(0, 5) + '*** **' + str.substring(str.length - 2);
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-200 rounded-[1.25rem]"></div>
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-[1.25rem] animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Initializing Boutique</p>
            </div>
        </div>
    );

    if (!shopData) return (
        <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-8 p-6 text-center">
            <div className="w-24 h-24 bg-rose-50 rounded-[1.25rem] flex items-center justify-center text-rose-500 border border-rose-100">
                <ShieldCheck size={48} />
            </div>
            <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase leading-none">Boutique Unavailable</h1>
                <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium leading-relaxed">The requested digital storefront is currently offline or the security clearance has expired.</p>
            </div>
            <a href="/" className="px-8 py-4 bg-slate-900 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-900/20">Return to Portal</a>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 text-slate-900 font-outfit selection:bg-indigo-600 selection:text-white">
            {/* Ultra-Modern Floating Header */}
            <header className="fixed top-0 left-0 right-0 z-[100] px-4 pt-4 pointer-events-none">
                <div className="max-w-7xl mx-auto h-20 bg-white/80 backdrop-blur-2xl border border-white rounded-[1.25rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex justify-between items-center px-6 pointer-events-auto">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                            <ShoppingBag size={22} />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-black uppercase tracking-tight text-slate-900 leading-none mb-1">{shopData.shopName}</h1>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                                    <MapPin size={10} className="text-indigo-500" /> {shopData.address?.split(',')[0] || 'Flagship Store'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <a href={`tel:${shopData.phone}`} className="h-11 px-6 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-[1.25rem] transition-all group">
                            <Phone size={14} className="text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Connect</span>
                        </a>
                    </div>
                </div>
            </header>

            {/* Cinematic Hero */}
            <section className="relative pt-44 pb-32 overflow-hidden bg-white">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-50/30 skew-x-[-12deg] translate-x-24 -z-10"></div>
                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="max-w-3xl space-y-8">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-[1.25rem] border border-indigo-100"
                        >
                            <Sparkles size={14} className="text-indigo-600" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Curated Intelligence</span>
                        </motion.div>
                        
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-4"
                        >
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 uppercase leading-[0.85]">
                                Premium <br />
                                <span className="text-indigo-600">Collection</span>
                            </h1>
                            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
                                Synchronized real-time inventory from {shopData.shopName}. Experience the future of retail transparency.
                            </p>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap gap-8 pt-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-[1.25rem] bg-slate-50 flex items-center justify-center text-indigo-600 border border-slate-100">
                                    <Award size={18} />
                                </div>
                                <div className="leading-none">
                                    <p className="text-[10px] font-black uppercase text-slate-900">Verified</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Official Merchant</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-[1.25rem] bg-slate-50 flex items-center justify-center text-indigo-600 border border-slate-100">
                                    <Zap size={18} />
                                </div>
                                <div className="leading-none">
                                    <p className="text-[10px] font-black uppercase text-slate-900">Live Sync</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Real-time Data</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Products Explorer */}
            <main className="max-w-7xl mx-auto px-6 py-20">
                {/* Minimalist Filter Bar */}
                <div className="flex items-center justify-start gap-3 mb-16 overflow-x-auto pb-6 scrollbar-hide sticky top-28 z-[90] pointer-events-none">
                    <div className="flex gap-3 pointer-events-auto bg-white/40 backdrop-blur-xl p-2 rounded-[1.25rem] border border-white/50 shadow-sm">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-8 h-12 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap border ${activeCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid Architecture */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                    <AnimatePresence mode='popLayout'>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product, idx) => (
                                <motion.div 
                                    layout
                                    key={product._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                                    className="group flex flex-col"
                                >
                                    {/* Visual Core */}
                                    <div className="aspect-[4/5] rounded-[1.25rem] overflow-hidden relative bg-white border border-slate-100 group-hover:border-indigo-600/30 transition-all duration-500 shadow-sm group-hover:shadow-2xl group-hover:shadow-indigo-500/10 mb-6">
                                        {product.productImage ? (
                                            <img 
                                                src={product.productImage} 
                                                alt={product.productName}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-200">
                                                <Package size={64} strokeWidth={1} />
                                                <span className="text-[9px] font-black uppercase tracking-[0.3em] mt-4 opacity-50">Image Pending</span>
                                            </div>
                                        )}
                                        
                                        <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
                                            <div className="px-4 py-2 bg-white/90 backdrop-blur-xl rounded-[1.25rem] text-slate-950 font-black text-base shadow-lg border border-white">
                                                ₹{product.price}
                                            </div>
                                            {product.quantity <= 5 && product.quantity > 0 && (
                                                <div className="px-3 py-1.5 bg-rose-500 text-white rounded-[1.25rem] text-[8px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20">
                                                    Limited
                                                </div>
                                            )}
                                        </div>

                                        {/* Quick Action Overlay */}
                                        <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                                    </div>

                                    {/* Intelligence Data */}
                                    <div className="px-2 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500">{product.category?.name || 'Essential'}</span>
                                            <div className="h-px flex-1 bg-slate-100"></div>
                                        </div>
                                        
                                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">{product.productName}</h3>
                                        
                                        <p className="text-sm text-slate-400 font-medium line-clamp-2 leading-relaxed min-h-[40px]">
                                            {product.description || 'Premium industrial-grade quality assets, inspected and verified for platform standards.'}
                                        </p>
                                        
                                        <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${product.quantity > 0 ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></div>
                                                <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${product.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {product.quantity > 0 ? `${product.quantity} Units Syncing` : 'Depleted'}
                                                </span>
                                            </div>
                                            <div className="w-8 h-8 rounded-[1.25rem] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                <ArrowRight size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full py-40 text-center"
                            >
                                <div className="w-24 h-24 bg-slate-100 rounded-[1.25rem] flex items-center justify-center mx-auto mb-8">
                                    <Package size={40} className="text-slate-300" />
                                </div>
                                <h3 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">Vault Empty</h3>
                                <p className="text-slate-400 mt-3 text-base font-medium max-w-sm mx-auto">No assets matched your current category filter. Try broadening your search.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Industrial Footer */}
            <footer className="bg-white border-t border-slate-100 pt-32 pb-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24">
                        <div className="lg:col-span-6 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white">
                                    <ShoppingBag size={24} />
                                </div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900">{shopData.shopName}</h3>
                            </div>
                            <p className="text-slate-500 text-lg font-medium max-w-md leading-relaxed">
                                Professional retail distribution network powered by StockSaathi OS. Authenticity and real-time synchronization guaranteed.
                            </p>
                        </div>
                        <div className="lg:col-span-3 space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-500">Contact Protocol</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-10 h-10 rounded-[1.25rem] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                                        <Phone size={16} />
                                    </div>
                                    <p className="text-slate-900 text-sm font-black tracking-widest">{maskPhone(shopData.phone)}</p>
                                </div>
                                <div className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-10 h-10 rounded-[1.25rem] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                                        <MapPin size={16} />
                                    </div>
                                    <p className="text-slate-600 text-xs font-bold leading-tight">{shopData.address || 'Global Distribution Center'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-3 space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-500">Infrastructure</h4>
                            <div className="p-6 bg-slate-50 rounded-[1.25rem] border border-slate-100 flex flex-col items-center text-center">
                                <div className="w-10 h-10 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-600/20">
                                    <ShieldCheck size={20} />
                                </div>
                                <p className="text-xs font-black uppercase tracking-tight text-slate-900">StockSaathi Retail OS</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Verified Digital Asset</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-6">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer">Integrity</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer">Protocol</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer">Privacy</span>
                        </div>
                        <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">© {new Date().getFullYear()} Intelligent Retail Matrix</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicShop;
