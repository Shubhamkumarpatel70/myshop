import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Store, MapPin, Phone, ArrowRight, 
    ShoppingBag, Star, Zap, LayoutGrid, List
} from 'lucide-react';

const ShopFinder = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const res = await api.get('/users/public/shops');
            setShops(res.data.data);
        } catch (error) {
            console.error("Failed to load shops");
        } finally {
            setLoading(false);
        }
    };

    const maskPhone = (phone) => {
        if (!phone) return 'N/A';
        const str = phone.toString();
        if (str.length < 5) return str;
        const firstTwo = str.substring(0, 2);
        const lastTwo = str.substring(str.length - 2);
        const maskedLength = str.length - 4;
        return `${firstTwo}${'*'.repeat(maskedLength)}${lastTwo}`;
    };

    const filteredShops = shops.filter(shop => 
        shop.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-6">
                {/* Hero Section */}
                <div className="text-center mb-16 space-y-4">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest"
                    >
                        <Zap size={14} className="fill-indigo-600" /> Discover Local Commerce
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black tracking-tighter"
                    >
                        Find Your Favorite <span className="text-indigo-600">Shops</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-500 font-medium max-w-2xl mx-auto text-lg"
                    >
                        Browse through our network of verified retailers, check stock availability, and connect with local merchants instantly.
                    </motion.p>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-12">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search by shop name, location, or category..." 
                            className="w-full h-16 pl-16 pr-6 rounded-[2rem] bg-white dark:bg-slate-900 border-none shadow-xl shadow-slate-200/50 dark:shadow-none font-bold text-lg focus:ring-4 focus:ring-indigo-500/10 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-4 rounded-[1.5rem] transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-4 rounded-[1.5rem] transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <List size={20} />
                        </button>
                    </div>
                </div>

                {/* Results Grid */}
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'flex flex-col gap-6'}>
                    {loading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-80 bg-white dark:bg-slate-900 rounded-[3rem] animate-pulse" />
                        ))
                    ) : filteredShops.map((shop, idx) => (
                        <motion.div
                            key={shop._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Link 
                                to={`/public-shop/${shop._id}`}
                                className={`group bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all flex ${viewMode === 'list' ? 'flex-row items-center p-4' : 'flex-col'}`}
                            >
                                <div className={viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'h-52 w-full overflow-hidden'}>
                                    {shop.profileImage ? (
                                        <img src={shop.profileImage} alt={shop.shopName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                            <Store size={viewMode === 'list' ? 32 : 48} />
                                        </div>
                                    )}
                                </div>
                                
                                <div className={`p-8 flex-1 flex flex-col justify-between ${viewMode === 'list' ? 'py-2 px-6' : ''}`}>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-2xl font-black tracking-tight group-hover:text-indigo-600 transition-colors uppercase truncate pr-4">{shop.shopName}</h3>
                                            {viewMode === 'grid' && (
                                                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100">Active</div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                                <MapPin size={14} className="text-indigo-500 flex-shrink-0" />
                                                <span className="text-xs font-bold truncate">{shop.address}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                                <Phone size={14} className="text-indigo-500 flex-shrink-0" />
                                                <span className="text-xs font-bold">{maskPhone(shop.phone)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center ${viewMode === 'list' ? 'mt-0 pt-0 border-none' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="flex text-amber-400">
                                                <Star size={12} fill="currentColor" />
                                                <Star size={12} fill="currentColor" />
                                                <Star size={12} fill="currentColor" />
                                                <Star size={12} fill="currentColor" />
                                                <Star size={12} fill="currentColor" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Verified Shop</span>
                                        </div>
                                        <div className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <ArrowRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State */}
                {!loading && filteredShops.length === 0 && (
                    <div className="text-center py-32 bg-white dark:bg-slate-900 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <ShoppingBag size={80} className="mx-auto text-slate-100 dark:text-slate-800 mb-6" />
                        <h2 className="text-3xl font-black uppercase tracking-tight">No Shops Found</h2>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto mt-2">We couldn't find any shops matching your search. Try adjusting your keywords or location.</p>
                        <button onClick={() => setSearchTerm('')} className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-500/20">Clear Search</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopFinder;
