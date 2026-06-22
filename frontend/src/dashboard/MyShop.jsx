import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { 
    Share2, ExternalLink, Package, 
    Copy, Check, Globe, LayoutGrid, List, MessageSquare,
    QrCode, Sparkles, Megaphone, ArrowRight, Eye, EyeOff,
    Power, ShieldAlert, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const MyShop = () => {
    const { t } = useLanguage();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [isMasterToggling, setIsMasterToggling] = useState(false);
    const { user, updateUser } = useAuth();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data.data);
        } catch (error) {
            if (navigator.onLine) toast.error("Failed to load shop products");
        } finally {
            setLoading(false);
        }
    };

    const toggleVisibility = async (productId, currentStatus) => {
        setUpdatingId(productId);
        try {
            const res = await api.put(`/products/${productId}`, { isPublic: !currentStatus });
            if (res.data.success) {
                setProducts(products.map(p => p._id === productId ? { ...p, isPublic: !currentStatus } : p));
                toast.success(!currentStatus ? "Product visible in showcase" : "Product hidden from showcase");
            }
        } catch (error) {
            toast.error("Visibility update failed");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleMasterToggle = async () => {
        setIsMasterToggling(true);
        const newStatus = !user.isStorefrontActive;
        try {
            const res = await api.post('/auth/toggle-storefront', { isActive: newStatus });
            if (res.data.success) {
                updateUser({ isStorefrontActive: newStatus });
                toast.success(newStatus ? "Global Storefront Activated" : "Global Storefront Deactivated");
            }
        } catch (error) {
            toast.error("Global toggle failed");
        } finally {
            setIsMasterToggling(false);
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
        <div className="space-y-10 pb-20 font-jakarta">
            {/* Ultra-Premium Storefront Control Center */}
            <div className="relative group">
                <div className={`absolute -inset-1 rounded-[3rem] blur opacity-10 group-hover:opacity-20 transition duration-1000 ${user?.isStorefrontActive !== false ? 'bg-indigo-600' : 'bg-rose-600'}`}></div>
                <div className="relative bg-white dark:bg-secondary-900 rounded-[3rem] p-8 md:p-12 border border-secondary-100 dark:border-secondary-800 shadow-sm overflow-hidden">
                    
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                        {user?.isStorefrontActive !== false ? <Sparkles size={120} className="text-primary-500 animate-pulse" /> : <ShieldAlert size={120} className="text-rose-500" />}
                    </div>

                    <div className="flex flex-col xl:flex-row gap-12 items-center">
                        {/* Shop Brand Section */}
                        <div className="flex-1 space-y-8 text-center xl:text-left">
                            <div className="flex flex-col md:flex-row items-center gap-4 justify-center xl:justify-start">
                                <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border animate-bounce-slow ${user?.isStorefrontActive !== false ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-800' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                    <Globe size={14} /> {user?.isStorefrontActive !== false ? t('Storefront Online') : t('Storefront Offline')}
                                </div>
                                <button 
                                    onClick={handleMasterToggle}
                                    disabled={isMasterToggling}
                                    className={`flex items-center gap-3 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${user?.isStorefrontActive !== false ? 'bg-rose-600 text-white shadow-rose-500/20 hover:bg-rose-700' : 'bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-700'}`}
                                >
                                    {isMasterToggling ? (
                                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                        <Power size={14} />
                                    )}
                                    {user?.isStorefrontActive !== false ? t('Go Offline') : t('Go Live Now')}
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
                                    {user?.shopName} <span className={user?.isStorefrontActive !== false ? 'text-primary-600' : 'text-rose-600'}>{user?.isStorefrontActive !== false ? t('Public Store') : t('On Maintenance')}</span>
                                </h1>
                                <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
                                    {user?.isStorefrontActive !== false 
                                        ? t("Your professional digital catalog is live. Share this link with your customers to accept orders and showcase your inventory.")
                                        : t("Your storefront is currently hidden from the public. Customers visiting your link will see an offline status message.")}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                                <div className="w-full sm:w-auto flex items-center gap-3 p-1.5 pl-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group/link cursor-pointer hover:border-primary-200 transition-all" onClick={handleCopyLink}>
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{shopLink}</span>
                                    <button className="p-3 bg-white dark:bg-secondary-700 text-slate-400 group-hover/link:text-primary-600 rounded-xl shadow-sm transition-all">
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>
                                <button onClick={handleShare} className="w-full sm:w-auto h-14 px-8 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-sm">
                                    <Share2 size={18} /> {t("Broadcast Shop")}
                                </button>
                            </div>
                        </div>

                        {/* Interactive Share Card */}
                        <div className={`w-full max-w-[340px] p-8 rounded-[2.5rem] border relative shadow-inner transition-all ${user?.isStorefrontActive !== false ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800' : 'bg-rose-50 border-rose-100 grayscale'}`}>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-2xl border border-white dark:border-secondary-800 flex flex-col items-center gap-6 relative overflow-hidden group/qr">
                                <div className="absolute inset-0 bg-primary-600/5 opacity-0 group-hover/qr:opacity-100 transition-opacity"></div>
                                <div className="relative p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shopLink)}&bgcolor=ffffff`}
                                        alt="Store QR"
                                        className="w-32 h-32 md:w-40 md:h-40"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://www.google.com/s2/favicons?sz=64&domain=qrserver.com"; // Small fallback or hide
                                            e.target.parentElement.innerHTML = `<div class="w-32 h-32 md:w-40 md:h-40 flex flex-col items-center justify-center gap-2 text-slate-300"><div class="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-qr-code"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16h.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg></div><span class="text-[8px] font-black uppercase tracking-widest text-slate-400">Offline: QR Unavailable</span></div>`;
                                        }}
                                    />
                                </div>
                                <div className="text-center space-y-2 relative">
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${user?.isStorefrontActive !== false ? 'text-primary-600' : 'text-rose-600'}`}>{user?.isStorefrontActive !== false ? t('Scan to browse') : t('Store Offline')}</p>
                                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{user?.shopName}</h4>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mt-6">
                                <a href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`} target="_blank" rel="noopener noreferrer" className="h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                                    <MessageSquare size={16} /> {t("WhatsApp")}
                                </a>
                                <a href={shopLink} target="_blank" rel="noopener noreferrer" className="h-12 bg-indigo-500 text-white rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">
                                    <ExternalLink size={16} /> {t("Preview")}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Catalog Management Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black uppercase tracking-tight">{t("Active Showcase")}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{t("Publicly visible products")} ({products.filter(p => p.isPublic !== false).length})</p>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <button className="px-6 py-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest text-primary-600">{t("Showcase Registry")}</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {loading ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="h-96 bg-white dark:bg-slate-900 rounded-[2.5rem] animate-pulse border border-slate-100 dark:border-slate-800"></div>
                        ))
                    ) : products.map((product, idx) => (
                        <motion.div 
                            key={product._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`group relative bg-white dark:bg-secondary-900 rounded-[2.5rem] overflow-hidden border transition-all ${product.isPublic !== false ? 'border-slate-100 dark:border-secondary-800 hover:border-primary-500/30 hover:shadow-2xl' : 'border-slate-200 dark:border-slate-800/50 grayscale-[0.5] opacity-80 shadow-inner bg-slate-50/50'}`}
                        >
                            {/* Toggle Button Overlay */}
                            <button 
                                onClick={() => toggleVisibility(product._id, product.isPublic !== false)}
                                disabled={updatingId === product._id}
                                className={`absolute top-4 left-4 z-20 h-10 px-4 rounded-xl font-black uppercase text-[8px] tracking-widest flex items-center gap-2 transition-all shadow-xl ${product.isPublic !== false ? 'bg-white text-emerald-600' : 'bg-slate-900 text-white'}`}
                            >
                                {updatingId === product._id ? (
                                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                    product.isPublic !== false ? <Eye size={12} /> : <EyeOff size={12} />
                                )}
                                {product.isPublic !== false ? t('Live') : t('Hidden')}
                            </button>

                            <div className="h-48 relative bg-slate-50 dark:bg-slate-950 overflow-hidden">
                                {product.productImage ? (
                                    <img src={product.productImage} alt={product.productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-200"><Package size={48} /></div>
                                )}
                                <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/80 backdrop-blur-md text-white rounded-xl text-[10px] font-black tracking-widest">₹{product.price}</div>
                            </div>
                            <div className="p-6 space-y-4">
                                <h4 className={`font-black uppercase truncate tracking-tight transition-colors ${product.isPublic !== false ? 'text-slate-900 dark:text-white group-hover:text-primary-600' : 'text-slate-400'}`}>{product.productName}</h4>
                                <div className="flex items-center justify-between">
                                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${product.quantity > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                        {product.quantity > 0 ? `${product.quantity} ${t("In Stock")}` : t('Sold Out')}
                                    </span>
                                    <Link to="/dashboard/inventory" className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600 rounded-xl transition-all"><ArrowRight size={16} /></Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MyShop;
