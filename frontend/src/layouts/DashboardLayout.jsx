import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    CreditCard,
    LayoutDashboard,
    Layers,
    LogOut,
    Megaphone,
    Menu,
    MessageSquare,
    Moon,
    Package,
    History,
    Search,
    Settings,
    ShieldCheck,
    ShoppingBag,
    ShoppingCart,
    Store,
    Sun,
    User,
    Users,
    X,
    Clock,
    Zap,
    Share2,
    BarChart3,
    Truck,
    IndianRupee,
    Undo2,
    ShieldAlert,
    Tag,
    WifiOff,
    Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import NotificationDropdown from '../components/NotificationDropdown';
import RegistrationPayment from '../components/RegistrationPayment';
import UserTour from '../components/UserTour';

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [privacyMode, setPrivacyMode] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingData, setOnboardingData] = useState({
        businessType: 'General Store',
        address: '',
    });

    const { user, logout, updateUser } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const isDark = localStorage.getItem('theme') === 'dark';
        const isPrivacy = localStorage.getItem('privacy_mode') === 'true';
        setDarkMode(isDark);
        setPrivacyMode(isPrivacy);
        document.documentElement.classList.toggle('dark', isDark);
        document.documentElement.classList.toggle('privacy-mode', isPrivacy);
    }, []);

    useEffect(() => {
        if (user && user.role !== 'super_admin' && user.address === 'Incomplete') {
            setShowOnboarding(true);
        }
    }, [user]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const toggleDarkMode = () => {
        const next = !darkMode;
        setDarkMode(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    const togglePrivacyMode = () => {
        const next = !privacyMode;
        setPrivacyMode(next);
        document.documentElement.classList.toggle('privacy-mode', next);
        localStorage.setItem('privacy_mode', next ? 'true' : 'false');
        toast.success(next ? 'Privacy Mode Active' : 'Privacy Mode Disabled');
    };

    const handleOnboardingSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put('/users/profile', onboardingData);
            if (res.data.success) {
                updateUser(res.data.data);
                setShowOnboarding(false);
                toast.success('Profile completed successfully');
            }
        } catch {
            toast.error('Unable to save profile');
        }
    };

    const allNavItems = [
        { name: t('Overview'), icon: LayoutDashboard, path: '/dashboard', roles: ['super_admin', 'shop_owner', 'manager', 'cashier'], priority: true, description: t('Role summary and quick actions'), group: 'core' },
        { name: t('Sales'), icon: ShoppingCart, path: '/dashboard/sales', roles: ['shop_owner', 'manager', 'cashier'], priority: true, description: t('POS transactions and returns'), group: 'operations' },
        { name: t('Shifts'), icon: Clock, path: '/dashboard/shifts', roles: ['shop_owner', 'manager', 'cashier'], priority: true, description: t('Open/close and shift logs'), group: 'operations' },
        { name: t('Reports'), icon: BarChart3, path: '/dashboard/reports', roles: ['shop_owner', 'manager', 'super_admin'], priority: true, description: t('Sales and business analytics'), group: 'operations' },
        { name: t('Inventory'), icon: Package, path: '/dashboard/inventory', roles: ['shop_owner', 'manager'], priority: true, description: t('Stock levels and adjustments'), group: 'inventory' },
        { name: t('Stock Ledger'), icon: History, path: '/dashboard/ledger', roles: ['shop_owner', 'manager'], description: t('Complete product history log'), group: 'inventory' },
        { name: t('Categories'), icon: Layers, path: '/dashboard/categories', roles: ['shop_owner', 'manager'], description: t('Catalog grouping'), group: 'inventory' },
        { name: t('Barcodes'), icon: Tag, path: '/dashboard/barcodes', roles: ['shop_owner', 'manager'], description: t('Manage product identifiers'), group: 'inventory' },
        { name: t('Staff'), icon: Users, path: '/dashboard/staff', roles: ['shop_owner'], description: t('Team access and roles'), group: 'management' },
        { name: t('Pricing'), icon: Zap, path: '/dashboard/pricing', roles: ['shop_owner'], description: t('Plan and billing controls'), group: 'management' },
        { name: t('Payments'), icon: CreditCard, path: '/dashboard/payment-settings', roles: ['shop_owner'], description: t('Gateway and UPI settings'), group: 'management' },
        { name: t('Share Shop'), icon: Share2, path: '/dashboard/share', roles: ['shop_owner'], description: t('Promote your shop link'), group: 'community' },
        { name: t('Customers'), icon: Users, path: '/dashboard/customers', roles: ['shop_owner', 'manager'], priority: true, description: t('Client CRM and loyalty'), group: 'community' },
        { name: t('Purchase Orders'), icon: ShoppingCart, path: '/dashboard/purchase-orders', roles: ['shop_owner', 'manager'], description: t('Procurement and restocking'), group: 'inventory' },
        { name: t('Account'), icon: User, path: '/dashboard/account', roles: ['shop_owner', 'manager', 'cashier'], description: t('Profile and security'), group: 'management' },

        { name: t('Shops'), icon: Store, path: '/dashboard/shops', roles: ['super_admin'], priority: true, description: t('All registered shops'), group: 'admin-core' },
        { name: t('Approvals'), icon: ShieldCheck, path: '/dashboard/admin/approvals', roles: ['super_admin'], priority: true, description: t('Shop verification list'), group: 'admin-core' },
        { name: t('Global Staff'), icon: Users, path: '/dashboard/admin/staff', roles: ['super_admin'], description: t('Monitor all shop employees'), group: 'admin-core' },
        { name: t('Admin Barcodes'), icon: Tag, path: '/dashboard/admin/barcodes', roles: ['super_admin'], description: t('Global identifier registry'), group: 'admin-core' },
        { name: t('Subscriptions'), icon: CreditCard, path: '/dashboard/admin/subscriptions', roles: ['super_admin'], description: t('Manage shop subscriptions'), group: 'admin-core' },
        { name: t('Admin Sales'), icon: ShoppingCart, path: '/dashboard/admin/sales', roles: ['super_admin'], priority: true, description: t('Platform-wide transaction audit'), group: 'admin-ops' },
        { name: t('Admin Inventory'), icon: Package, path: '/dashboard/admin/inventory', roles: ['super_admin'], priority: true, description: t('Platform-wide inventory view'), group: 'admin-ops' },
        { name: t('Admin POs'), icon: ShoppingCart, path: '/dashboard/admin/purchase-orders', roles: ['super_admin'], priority: true, description: t('Platform-wide procurement audit'), group: 'admin-ops' },
        { name: t('Platform Reports'), icon: BarChart3, path: '/dashboard/reports', roles: ['super_admin'], priority: true, description: t('Global business intelligence'), group: 'admin-ops' },
        { name: t('Shop Finder'), icon: Search, path: '/dashboard/admin/shop-finder', roles: ['super_admin'], description: t('Lookup by shop ID'), group: 'admin-tools' },
        { name: t('Order Finder'), icon: Search, path: '/dashboard/admin/order-finder', roles: ['super_admin'], description: t('Lookup by order or transaction ID'), group: 'admin-tools' },
        { name: t('Broadcast'), icon: Megaphone, path: '/dashboard/broadcast', roles: ['super_admin'], description: t('Send announcements to shops'), group: 'admin-comms' },
        { name: t('Queries'), icon: MessageSquare, path: '/dashboard/admin/queries', roles: ['super_admin'], description: t('Customer support inquiries'), group: 'admin-comms' },
        { name: t('Activity'), icon: Activity, path: '/dashboard/activity', roles: ['super_admin'], description: t('Platform activity logs'), group: 'admin-comms' },
        { name: t('Pricing Config'), icon: Zap, path: '/dashboard/admin/pricing', roles: ['super_admin'], description: t('Manage plans and pricing'), group: 'admin-system' },
        { name: t('Settings'), icon: Settings, path: '/dashboard/admin/settings', roles: ['super_admin'], description: t('Global platform configuration'), group: 'admin-system' },
        { name: t('Platform Revenue'), icon: IndianRupee, path: '/dashboard/admin/revenue', roles: ['super_admin'], priority: true, description: t('Subscription earnings audit'), group: 'admin-system' },
    ];

    const navItems = useMemo(
        () => allNavItems.filter((item) => item.roles.includes(user?.role)),
        [user?.role, language]
    );

    const groupedNavItems = useMemo(() => {
        if (user?.role !== 'super_admin') {
            const sections = [
                { key: 'core', label: t('Main') },
                { key: 'operations', label: t('Operations') },
                { key: 'inventory', label: t('Supply Chain') },
                { key: 'community', label: t('Community') },
                { key: 'management', label: t('Administrative') },
            ];

            return sections
                .map((section) => ({
                    ...section,
                    items: navItems.filter((item) => item.group === section.key),
                }))
                .filter((section) => section.items.length > 0);
        }

        const sections = [
            { key: 'admin-core', label: t('Core Admin') },
            { key: 'admin-ops', label: t('Operations') },
            { key: 'admin-tools', label: t('Lookup Tools') },
            { key: 'admin-comms', label: t('Communication') },
            { key: 'admin-system', label: t('System') },
        ];

        return sections
            .map((section) => ({
                ...section,
                items: navItems.filter((item) => item.group === section.key || item.path === '/dashboard'),
            }))
            .filter((section) => section.items.length > 0)
            .map((section) => ({
                ...section,
                items:
                    section.key === 'admin-core'
                        ? [
                              ...section.items.filter((item) => item.path === '/dashboard'),
                              ...section.items.filter((item) => item.path !== '/dashboard'),
                          ]
                        : section.items.filter((item) => item.path !== '/dashboard'),
            }))
            .filter((section) => section.items.length > 0);
    }, [navItems, user?.role, language]);

    const mobileBottomItems = useMemo(() => {
        const preferred = navItems.filter((item) => item.priority);
        const dashboardItem = navItems.find((item) => item.path === '/dashboard');
        const merged = dashboardItem
            ? [dashboardItem, ...preferred.filter((item) => item.path !== '/dashboard')]
            : preferred;
        return merged.slice(0, 4);
    }, [navItems]);

    const currentNavItem = navItems.find((item) => {
        if (item.path === '/dashboard') return location.pathname === '/dashboard';
        return location.pathname.startsWith(item.path);
    });

    const handleLogout = () => {
        logout();
        localStorage.removeItem('is_impersonating');
        localStorage.removeItem('admin_token');
        navigate('/login');
    };

    const handleExitImpersonation = () => {
        const adminToken = localStorage.getItem('admin_token');
        const adminUser = localStorage.getItem('admin_user');
        if (adminToken && adminUser) {
            localStorage.setItem('token', adminToken);
            localStorage.setItem('user', adminUser);
            localStorage.removeItem('is_impersonating');
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            window.location.href = '/dashboard/shops'; 
        }
    };

    const businessTypes = [
        'Medical Store',
        'Hardware Store',
        'Grocery Store',
        'Electronics Store',
        'Clothing Store',
        'General Store',
        'Custom Store',
    ];

    const roleLabel = user?.role?.replace('_', ' ') || 'user';

    const renderNavLink = (item, compact = false) => {
        const Icon = item.icon;
        const isActive =
            item.path === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.path);

        return (
            <Link
                key={item.path}
                to={item.path}
                title={compact ? item.name : undefined}
                className={[
                    'group flex items-center gap-3 rounded-[1.25rem] px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                        ? 'bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.35)]'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                    compact ? 'justify-center px-2' : '',
                ].join(' ')}
            >
                <Icon size={18} className="shrink-0" />
                {!compact && (
                    <div className="min-w-0">
                        <span className="block truncate">{item.name}</span>
                        {item.description && (
                            <span
                                className={[
                                    'block truncate text-[11px]',
                                    isActive ? 'text-indigo-100/90' : 'text-slate-400 dark:text-slate-500',
                                ].join(' ')}
                            >
                                {item.description}
                            </span>
                        )}
                    </div>
                )}
            </Link>
        );
    };

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 dark:bg-[#020617] dark:text-white">
            <UserTour user={user} />
            <aside
                className={[
                    'hidden shrink-0 border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col',
                    isSidebarOpen ? 'w-64' : 'w-24',
                ].join(' ')}
            >
                <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                    <Link to="/" className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-[1.25rem] bg-indigo-600 text-white">
                            <ShoppingBag size={20} />
                        </span>
                        {isSidebarOpen && (
                            <span className="font-outfit text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Stock<span className="text-indigo-600">Saathi</span>
                            </span>
                        )}
                    </Link>
                </div>

                <nav className="flex-1 space-y-4 overflow-y-auto p-3">
                    {groupedNavItems.map((section) => (
                        <div key={section.key}>
                            {isSidebarOpen && (
                                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                                    {section.label}
                                </p>
                            )}
                            <div className="space-y-1">
                                {section.items.map((item) => renderNavLink(item, !isSidebarOpen))}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                    <div className={['mb-3 flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/70', isSidebarOpen ? '' : 'justify-center'].join(' ')}>
                        <span className="flex h-9 w-9 items-center justify-center rounded-[1.25rem] bg-indigo-600 text-sm font-bold text-white">
                            {user?.ownerName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                        {isSidebarOpen && (
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.ownerName || 'User'}</p>
                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        className={[
                            'mb-2 inline-flex w-full items-center gap-2 rounded-[1.25rem] px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10',
                            isSidebarOpen ? '' : 'justify-center',
                        ].join(' ')}
                    >
                        <LogOut size={17} />
                        {isSidebarOpen && t('Logout')}
                    </button>

                    <button
                        onClick={() => setIsSidebarOpen((prev) => !prev)}
                        className="inline-flex h-10 w-full items-center justify-center rounded-[1.25rem] border border-slate-200 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        {isSidebarOpen ? t('Collapse') : t('Expand')}
                    </button>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {localStorage.getItem('is_impersonating') === 'true' && (
                    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between z-50">
                        <div className="flex items-center gap-3">
                            <ShieldAlert size={16} />
                            <span className="text-xs font-black uppercase tracking-widest">
                                IMPERSONATION MODE ACTIVE: Viewing as <span className="underline">{user?.shopName}</span>
                            </span>
                        </div>
                        <button 
                            onClick={handleExitImpersonation}
                            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            <Undo2 size={12} /> Exit Session
                        </button>
                    </div>
                )}
                <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-2xl dark:border-slate-800/50 dark:bg-[#020617]/80">
                    <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 lg:hidden"
                            >
                                <Menu size={18} />
                            </button>

                            <div className="min-w-0">
                                <h1 className="truncate text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">{currentNavItem?.name || t('Dashboard')}</h1>
                                <div className="flex items-center gap-1.5 opacity-60">
                                    <Store size={10} className="text-indigo-600" />
                                    <p className="truncate text-[10px] font-bold uppercase tracking-widest">{user?.shopName || 'Workspace'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Search Integration */}
                        <div className="hidden max-w-md flex-1 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5 transition-all focus-within:border-indigo-500/30 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-indigo-500/5 dark:border-white/5 dark:bg-white/5 xl:flex">
                            <Search size={16} className="text-slate-400" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('Search') + '...'}
                                className="w-full bg-transparent text-[11px] font-black uppercase tracking-widest outline-none placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <AnimatePresence>
                                {!isOnline && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shadow-sm"
                                        title="System Offline"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></div>
                                        <span className="hidden xs:inline text-[9px] font-black uppercase tracking-widest">{t('Offline')}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-center gap-1 sm:gap-2 bg-slate-100/50 dark:bg-white/5 p-1 rounded-xl border border-slate-100 dark:border-white/5">
                                {/* Language Switcher */}
                                <div className="flex items-center gap-1 px-1.5 py-1">
                                    <Globe size={14} className="text-slate-500" />
                                    <select 
                                        value={language} 
                                        onChange={(e) => setLanguage(e.target.value)} 
                                        className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-slate-600 dark:text-slate-300 border-none pr-1"
                                    >
                                        <option value="en" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">EN</option>
                                        <option value="hi" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">HI</option>
                                    </select>
                                </div>

                                <button
                                    onClick={togglePrivacyMode}
                                    title={privacyMode ? 'Disable Privacy' : 'Enable Privacy'}
                                    className={`grid h-9 w-9 place-items-center rounded-lg transition-all ${privacyMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800'}`}
                                >
                                    <ShieldCheck size={16} />
                                </button>

                                <button
                                    onClick={toggleDarkMode}
                                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-all"
                                >
                                    {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                                </button>
                                
                                <NotificationDropdown />
                            </div>

                            <div className="hidden items-center gap-3 pl-2 sm:flex border-l border-slate-200 dark:border-slate-800 ml-1">
                                <div className="text-right hidden md:block">
                                    <p className="text-[11px] font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">{user?.ownerName || 'User'}</p>
                                    <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mt-1 leading-none opacity-80">{roleLabel}</p>
                                </div>
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-[11px] font-black text-white shadow-lg shadow-indigo-500/20 ring-2 ring-white dark:ring-slate-950">
                                    {user?.ownerName?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800 xl:hidden bg-slate-50/50 dark:bg-white/5">
                        <div className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900 shadow-sm transition-all focus-within:border-indigo-500/30">
                            <Search size={14} className="text-slate-400" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('Search') + '...'}
                                className="w-full bg-transparent text-[10px] font-black uppercase tracking-widest outline-none placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-auto overflow-y-auto p-4 pb-32 sm:p-6 sm:pb-32 lg:pb-10">
                    <div className="w-full min-w-0">
                        <AnimatePresence mode="wait">
                            {user?.role === 'shop_owner' && user?.approvalStatus === 'Rejected' ? (
                                <motion.div key="rejected" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-[70vh] flex-col items-center justify-center rounded-[1.25rem] border border-rose-200 bg-white p-8 text-center dark:border-rose-500/20 dark:bg-slate-900">
                                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                                        <X size={24} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-rose-600">Approval rejected</h2>
                                    <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300">
                                        {user?.rejectionReason || 'Your account approval was rejected. Please review details and re-register.'}
                                    </p>
                                    <button onClick={handleLogout} className="mt-5 inline-flex h-11 items-center justify-center rounded-[1.25rem] bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700">
                                        Logout
                                    </button>
                                </motion.div>
                            ) : user?.role === 'shop_owner' && !user?.isPaymentDone ? (
                                <RegistrationPayment user={user} onPaymentSuccess={() => window.location.reload()} />
                            ) : user?.role === 'shop_owner' && user?.approvalStatus === 'Pending' ? (
                                <motion.div key="pending" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-[70vh] flex-col items-center justify-center rounded-[1.25rem] border border-amber-200 bg-white p-8 text-center dark:border-amber-500/20 dark:bg-slate-900">
                                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                                        <Clock size={24} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Approval in progress</h2>
                                    <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300">
                                        Your profile is under review by admin. You will get full dashboard access after approval.
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                                    <Outlet context={{ searchQuery }} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>

                {mobileBottomItems.length > 0 && (
                    <nav className="fixed bottom-6 left-6 right-6 z-40 rounded-[2rem] border border-white/20 bg-white/80 px-2.5 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/80 lg:hidden ring-1 ring-black/5">
                        <div className="grid grid-cols-4 gap-1">
                            {mobileBottomItems.map((item) => {
                                const Icon = item.icon;
                                const isActive =
                                    item.path === '/dashboard'
                                        ? location.pathname === '/dashboard'
                                        : location.pathname.startsWith(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={[
                                            'flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-all duration-300',
                                            isActive
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-[1.02]'
                                                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5',
                                        ].join(' ')}
                                    >
                                        <Icon size={isActive ? 18 : 16} className={isActive ? 'animate-pulse-slow' : ''} />
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                            {item.name.split(' ')[0]}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>
                )}
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[120] bg-slate-950/60 lg:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                            className="fixed inset-y-0 left-0 z-[130] flex w-[86%] max-w-sm flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:hidden"
                        >
                            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-[1.25rem] bg-indigo-600 text-white">
                                        <ShoppingBag size={18} />
                                    </span>
                                    <span className="font-outfit text-xl font-extrabold text-slate-900 dark:text-white">StockSaathi</span>
                                </div>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="grid h-9 w-9 place-items-center rounded-[1.25rem] border border-slate-200 dark:border-slate-700"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <nav className="flex-1 space-y-4 overflow-y-auto p-3">
                                {groupedNavItems.map((section) => (
                                    <div key={section.key}>
                                        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                                            {section.label}
                                        </p>
                                        <div className="space-y-1">
                                            {section.items.map((item) => renderNavLink(item))}
                                        </div>
                                    </div>
                                ))}
                            </nav>

                            <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                                <button
                                    onClick={handleLogout}
                                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[1.25rem] bg-rose-600 text-sm font-semibold text-white"
                                >
                                    <LogOut size={16} /> Logout
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showOnboarding && (
                    <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-lg rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-8"
                        >
                            <h2 className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">Complete your profile</h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Add business type and address to continue.</p>

                            <form onSubmit={handleOnboardingSubmit} className="mt-5 space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Business type</label>
                                    <select
                                        value={onboardingData.businessType}
                                        onChange={(e) => setOnboardingData({ ...onboardingData, businessType: e.target.value })}
                                        className="h-11 w-full rounded-[1.25rem] border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                    >
                                        {businessTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Address</label>
                                    <textarea
                                        required
                                        value={onboardingData.address}
                                        onChange={(e) => setOnboardingData({ ...onboardingData, address: e.target.value })}
                                        rows={4}
                                        className="w-full rounded-[1.25rem] border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                        placeholder="Enter your business address"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="inline-flex h-11 w-full items-center justify-center rounded-[1.25rem] bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                    Save and continue
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardLayout;
