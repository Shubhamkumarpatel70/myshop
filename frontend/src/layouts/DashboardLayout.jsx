import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, Package, Layers, ShoppingCart, 
    BarChart3, Settings, Menu, X, Bell, 
    Search, LogOut, ChevronLeft, ChevronRight,
    Sun, Moon, MapPin, Store, ArrowRight,
    Users, Activity, Megaphone, CreditCard, Globe, User, ShieldCheck, ShoppingBag, Clock, Download, Smartphone, Monitor
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import NotificationDropdown from '../components/NotificationDropdown';
import RegistrationPayment from '../components/RegistrationPayment';

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingData, setOnboardingData] = useState({
        businessType: 'General Store',
        address: ''
    });
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);
    const [showSplash, setShowSplash] = useState(true);

    const { user, logout, updateUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.role !== 'super_admin' && user.address === 'Incomplete') {
            setShowOnboarding(true);
        }
    }, [user]);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // Hide splash after 2.5 seconds
        const timer = setTimeout(() => setShowSplash(false), 2500);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            clearTimeout(timer);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowInstallBtn(false);
        }
        setDeferredPrompt(null);
    };

    // Polling for approval/payment status update
    useEffect(() => {
        let interval;
        if (user?.role === 'shop_owner' && (user?.approvalStatus === 'Pending' || !user?.isPaymentDone)) {
            interval = setInterval(async () => {
                try {
                    const res = await api.get('/auth/profile');
                    if (res.data.success) {
                        const newUser = res.data.data;
                        // If status changed, update the local user context
                        if (newUser.approvalStatus !== user.approvalStatus || newUser.isPaymentDone !== user.isPaymentDone) {
                            updateUser(newUser);
                        }
                    }
                } catch (error) {
                    console.error("Status polling failed:", error);
                }
            }, 5000); // Check every 5 seconds for faster real-time feel
        }
        return () => clearInterval(interval);
    }, [user, updateUser]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle('dark');
    };

    const handleOnboardingSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put('/users/profile', onboardingData);
            if (res.data.success) {
                updateUser(res.data.data);
                setShowOnboarding(false);
                toast.success("Shop profile completed! Welcome to StockSaathi.");
            }
        } catch (error) {
            toast.error("Failed to update profile");
        }
    };

    const allNavItems = [
        { name: 'Overview', icon: <LayoutDashboard size={20} />, path: '/dashboard', roles: ['super_admin', 'shop_owner', 'manager', 'cashier'] },
        { name: 'POS Billing', icon: <ShoppingCart size={20} />, path: '/dashboard/sales', roles: ['shop_owner', 'manager', 'cashier'], priority: true },
        { name: 'Shift', icon: <Clock size={20} />, path: '/dashboard/shifts', roles: ['shop_owner', 'manager', 'cashier'] },
        { name: 'Inventory', icon: <Package size={20} />, path: '/dashboard/inventory', roles: ['shop_owner', 'manager'] },
        { name: 'StockSaathi', icon: <Globe size={20} />, path: '/dashboard/my-shop', roles: ['shop_owner', 'manager'], priority: true },
        { name: 'Categories', icon: <Layers size={20} />, path: '/dashboard/categories', roles: ['shop_owner', 'manager'] },
        { name: 'Staff Management', icon: <Users size={20} />, path: '/dashboard/staff', roles: ['shop_owner'] },
        { name: 'Shop Directory', icon: <Store size={20} />, path: '/dashboard/shops', roles: ['super_admin'] },
        { name: 'Global Stock', icon: <Package size={20} />, path: '/dashboard/admin/inventory', roles: ['super_admin'] },
        { name: 'Network Sales', icon: <ShoppingCart size={20} />, path: '/dashboard/admin/sales', roles: ['super_admin'] },
        { name: 'Shop Finder', icon: <Search size={20} />, path: '/dashboard/admin/shop-finder', roles: ['super_admin'] },
        { name: 'Order Finder', icon: <ShoppingBag size={20} />, path: '/dashboard/admin/order-finder', roles: ['super_admin'] },
        { name: 'System Logs', icon: <Activity size={20} />, path: '/dashboard/activity', roles: ['super_admin'] },
        { name: 'Broadcasts', icon: <Megaphone size={20} />, path: '/dashboard/broadcast', roles: ['super_admin'] },
        { name: 'Shop Approvals', icon: <ShieldCheck size={20} />, path: '/dashboard/admin/approvals', roles: ['super_admin'], priority: true },
        { name: 'System Settings', icon: <Settings size={20} />, path: '/dashboard/admin/settings', roles: ['super_admin'] },
        { name: 'Business Insights', icon: <BarChart3 size={20} />, path: '/dashboard/reports', roles: ['super_admin', 'shop_owner', 'manager'] },
        { name: 'Account', icon: <User size={20} />, path: '/dashboard/account', roles: ['shop_owner', 'manager', 'cashier'] },
        { name: 'Payments', icon: <CreditCard size={20} />, path: '/dashboard/payment-settings', roles: ['shop_owner'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(user?.role));
    const mobileBottomItems = navItems.filter(item => item.priority || item.name === 'Overview').slice(0, 4);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const businessTypes = [
        'Medical Store', 'Hardware Store', 'Grocery Store', 
        'Electronics Store', 'Clothing Store', 'General Store', 'Custom Store'
    ];

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#020617] overflow-hidden font-jakarta">
            <AnimatePresence>
                {showSplash && (
                    <motion.div 
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative">
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute -inset-4 border border-dashed border-indigo-500/30 rounded-full"
                                />
                                <img src="/favicon.png" alt="StockSaathi" className="w-32 h-32 md:w-48 md:h-48 object-contain rounded-3xl" />
                            </div>
                            <div className="mt-12 text-center">
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">StockSaathi</h1>
                                <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em] mt-2">Smart Inventory Ecosystem</p>
                                <div className="mt-8 flex gap-2 justify-center">
                                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Desktop Glass Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 280 : 88 }}
                className="hidden lg:flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 transition-all duration-500 z-30"
            >
                <div className="p-6 mb-2">
                    <div className="flex items-center gap-4 px-2">
                        <img src="/logo.png" alt="StockSaathi" className="w-12 h-12 object-contain rounded-xl shadow-lg" />
                        {isSidebarOpen && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="min-w-0"
                            >
                                <h2 className="text-[15px] font-black tracking-tight leading-tight uppercase truncate text-slate-900 dark:text-white">
                                    {user?.shopName || 'StockSaathi'}
                                </h2>
                                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-0.5">
                                    {user?.role}
                                </p>
                            </motion.div>
                        )}
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                                (location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path)))
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-xl shadow-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-indigo-600'
                            }`}
                        >
                            <div className={`shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                                (location.pathname === item.path) ? 'text-indigo-600 dark:text-indigo-400' : ''
                            }`}>
                                {item.icon}
                            </div>
                            {isSidebarOpen && (
                                <motion.span 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="truncate font-bold text-sm tracking-tight"
                                >
                                    {item.name}
                                </motion.span>
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 space-y-3">
                    {showInstallBtn && (
                        <button 
                            onClick={handleInstall}
                            className="flex items-center gap-4 px-5 py-4 w-full bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
                        >
                            <Download size={18} className="shrink-0" />
                            {isSidebarOpen && <span>Install App</span>}
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-5 py-4 w-full rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all group"
                    >
                        <LogOut size={20} className="shrink-0 transition-transform group-hover:-translate-x-1" />
                        {isSidebarOpen && (
                            <motion.span 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="font-bold text-sm uppercase tracking-widest"
                            >
                                Logout
                            </motion.span>
                        )}
                    </button>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="flex items-center justify-center w-full py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all"
                    >
                        {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>
            </motion.aside>

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Modern Header */}
                <header className="h-20 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-6 lg:px-10 z-20">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-3 text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="hidden md:flex items-center gap-3 bg-slate-100/50 dark:bg-slate-900/50 px-5 py-2.5 rounded-2xl border border-transparent focus-within:border-indigo-500/50 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all w-80 lg:w-[400px]">
                            <Search size={18} className="text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search everything..." 
                                className="bg-transparent border-none focus:ring-0 text-sm w-full font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-5">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={toggleDarkMode}
                                className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all"
                            >
                                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <NotificationDropdown />
                        </div>

                        <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

                        <div className="flex items-center gap-4 group cursor-pointer">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-black tracking-tight leading-none truncate max-w-[120px] uppercase">{user?.ownerName}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{user?.role}</p>
                            </div>
                            <div className="w-11 h-11 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all">
                                {user?.ownerName?.charAt(0) || <User size={20} />}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Scroller */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 pb-32 lg:pb-10">
                    <div className="max-w-[1600px] mx-auto">
                        {user?.role === 'shop_owner' && user?.approvalStatus === 'Rejected' ? (
                            <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6">
                                <div className="w-24 h-24 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-rose-500/20">
                                    <X size={48} />
                                </div>
                                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4 text-rose-600">Application Rejected</h2>
                                <div className="max-w-xl mx-auto p-8 bg-rose-50/50 dark:bg-rose-500/5 rounded-[2.5rem] border-2 border-rose-100 dark:border-rose-500/20 mb-8">
                                    <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest mb-2">Reason for Rejection</p>
                                    <p className="text-xl font-bold text-slate-800 dark:text-white leading-relaxed">
                                        "{user?.rejectionReason || 'Details provided were insufficient for verification.'}"
                                    </p>
                                </div>
                                <p className="text-slate-500 font-medium">Please contact support or re-register with valid documents.</p>
                                <button 
                                    onClick={handleLogout}
                                    className="mt-8 px-10 py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-500/20"
                                >
                                    Logout & Re-apply
                                </button>
                            </div>
                        ) : user?.role === 'shop_owner' && !user?.isPaymentDone ? (
                            <RegistrationPayment user={user} onPaymentSuccess={() => {
                                window.location.reload();
                            }} />
                        ) : user?.role === 'shop_owner' && user?.approvalStatus === 'Pending' ? (
                            <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6">
                                <div className="w-24 h-24 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-amber-500/20 animate-pulse">
                                    <Clock size={48} />
                                </div>
                                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">Application Under Review</h2>
                                <p className="text-slate-500 text-lg max-w-lg mx-auto font-medium leading-relaxed">
                                    Payment received! Your shop details are now being audited by our administrative team. 
                                    Please wait while we verify your business information.
                                </p>
                                <div className="mt-10 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Expected response time: 24-48 Hours</p>
                                </div>
                            </div>
                        ) : (
                            <Outlet />
                        )}
                    </div>
                </main>

                {/* Mobile Bottom Navigation (Only for Mobile/Tablet) */}
                <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-[2.5rem] shadow-2xl flex items-center justify-around px-4 z-40">
                    {mobileBottomItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
                                    isActive ? 'text-indigo-600 dark:text-indigo-400 scale-110 font-black' : 'text-slate-400'
                                }`}
                            >
                                {item.icon}
                                <span className="text-[8px] uppercase tracking-tighter">{item.name.split(' ')[0]}</span>
                                {isActive && <motion.div layoutId="bottomNav" className="w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full mt-0.5" />}
                            </Link>
                        );
                    })}
                    <button 
                        onClick={handleLogout}
                        className="flex flex-col items-center gap-1 p-3 text-rose-500"
                    >
                        <LogOut size={20} />
                        <span className="text-[8px] uppercase tracking-tighter">Exit</span>
                    </button>
                </nav>
            </div>

            {/* Fullscreen Mobile Menu Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white dark:bg-slate-950 z-[70] lg:hidden flex flex-col"
                        >
                            <div className="p-8 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                                        <Store size={20} />
                                    </div>
                                    <span className="text-xl font-black uppercase tracking-tighter">StockSaathi</span>
                                </div>
                                <button 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 bg-slate-100 dark:bg-slate-900 rounded-xl"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                                {navItems.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${
                                                isActive 
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            {item.icon}
                                            <span className="text-sm tracking-tight">{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="p-6 border-t border-slate-100 dark:border-slate-900">
                                <button 
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-6 py-4 rounded-2xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 font-black w-full uppercase text-xs tracking-widest shadow-lg shadow-rose-500/10"
                                >
                                    <LogOut size={20} /> Logout Account
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Onboarding Premium Modal */}
            <AnimatePresence>
                {showOnboarding && (
                    <div className="modal-overlay">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 40 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="modal-content max-w-md"
                        >
                            <div className="relative p-10">
                                {/* Decor */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

                                <div className="text-center mb-8">
                                    <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-indigo-500/40 animate-float">
                                        <Store size={36} />
                                    </div>
                                    <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">Final Setup</h2>
                                    <p className="text-slate-500 font-medium">Let\'s get your store ready for business, {user?.ownerName}.</p>
                                </div>

                                <form onSubmit={handleOnboardingSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Niche</label>
                                        <select 
                                            required
                                            className="input-field appearance-none cursor-pointer"
                                            value={onboardingData.businessType}
                                            onChange={(e) => setOnboardingData({...onboardingData, businessType: e.target.value})}
                                        >
                                            {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Official Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-4 text-indigo-600" size={18} />
                                            <textarea 
                                                required
                                                placeholder="Street, City, State..."
                                                className="input-field pl-12 pt-4 h-28 resize-none"
                                                value={onboardingData.address}
                                                onChange={(e) => setOnboardingData({...onboardingData, address: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary w-full py-5 text-lg font-black uppercase tracking-[0.2em] rounded-[1.5rem]">
                                        Open StockSaathi <ArrowRight className="ml-2" size={20} />
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardLayout;
