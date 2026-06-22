import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, LogOut, ChevronDown, LayoutDashboard, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { user, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    const langRef = useRef(null);
    const profileRef = useRef(null);
    const companyRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 16);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (langRef.current && !langRef.current.contains(event.target)) {
                setIsLangOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (companyRef.current && !companyRef.current.contains(event.target)) {
                setIsCompanyOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setIsOpen(false);
        setIsProfileOpen(false);
        setIsLangOpen(false);
        setIsCompanyOpen(false);
    }, [location.pathname]);

    const mainLinks = [
        { name: t('Home'), path: '/' },
        { name: t('My Shopping'), path: '/lookup-receipt' },
    ];

    const dropdownLinks = [
        { name: t('About'), path: '/about' },
        { name: t('Pricing'), path: '/pricing' },
        { name: t('Contact'), path: '/contact' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const initial = user?.ownerName?.charAt(0)?.toUpperCase() || 'U';

    return (
        <header className="fixed inset-x-0 top-0 z-[110] px-4 pt-4 sm:px-6">
            <nav
                className={[
                    'mx-auto flex max-w-7xl items-center justify-between rounded-[1.25rem] border px-4 py-2.5 transition-all duration-300 sm:px-6',
                    scrolled
                        ? 'border-slate-200/80 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/90'
                        : 'border-transparent bg-white/70 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:bg-slate-900/60',
                ].join(' ')}
            >
                <Link to="/" className="flex items-center gap-3 group">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[1.25rem] bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.3)] group-hover:scale-105 transition-transform">
                        <ShoppingBag size={20} />
                    </span>
                    <span className="font-outfit text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Stock<span className="text-indigo-600">Saathi</span>
                    </span>
                </Link>

                <div className="hidden items-center gap-1.5 lg:flex">
                    {mainLinks.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={[
                                    'relative px-4 py-2 text-xs font-black uppercase tracking-widest transition-all rounded-xl',
                                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5',
                                ].join(' ')}
                            >
                                <span className="relative z-10">{link.name}</span>
                                {isActive && (
                                    <motion.span 
                                        layoutId="activeNavTab"
                                        className="absolute inset-0 bg-indigo-50/60 dark:bg-indigo-500/10 rounded-xl"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}

                    {/* Company Dropdown */}
                    <div ref={companyRef} className="relative">
                        <button
                            onClick={() => setIsCompanyOpen((prev) => !prev)}
                            className={[
                                'relative flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest transition-all rounded-xl cursor-pointer',
                                isCompanyOpen || dropdownLinks.some(l => location.pathname === l.path)
                                    ? 'text-indigo-600 dark:text-indigo-400' 
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5',
                            ].join(' ')}
                        >
                            <span className="relative z-10 flex items-center gap-1.5">
                                {t('Company')}
                                <ChevronDown size={12} className={`transition-transform duration-300 ${isCompanyOpen ? 'rotate-180' : ''}`} />
                            </span>
                            {dropdownLinks.some(l => location.pathname === l.path) && (
                                <motion.span 
                                    layoutId="activeNavTab"
                                    className="absolute inset-0 bg-indigo-50/60 dark:bg-indigo-500/10 rounded-xl"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </button>

                        <AnimatePresence>
                            {isCompanyOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-950 z-20"
                                >
                                    {dropdownLinks.map((link) => {
                                        const isLinkActive = location.pathname === link.path;
                                        return (
                                            <Link
                                                key={link.name}
                                                to={link.path}
                                                className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-black uppercase tracking-wider transition-all ${
                                                    isLinkActive 
                                                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' 
                                                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                {link.name}
                                            </Link>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="hidden items-center gap-4 lg:flex">
                    {/* Custom Language Switcher */}
                    <div ref={langRef} className="relative">
                        <button
                            onClick={() => setIsLangOpen((prev) => !prev)}
                            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 px-3.5 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all active:scale-95 cursor-pointer"
                        >
                            <Globe size={14} className="text-slate-400" />
                            <span>{language === 'en' ? 'EN' : 'हिन्दी'}</span>
                            <ChevronDown size={12} className={`text-slate-400 transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                            {isLangOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-32 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-950 z-20"
                                >
                                    <button
                                        onClick={() => { setLanguage('en'); setIsLangOpen(false); }}
                                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all ${language === 'en' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                    >
                                        English
                                    </button>
                                    <button
                                        onClick={() => { setLanguage('hi'); setIsLangOpen(false); }}
                                        className={`mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all ${language === 'hi' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                    >
                                        हिन्दी
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {user ? (
                        <div ref={profileRef} className="relative">
                            <button
                                onClick={() => setIsProfileOpen((prev) => !prev)}
                                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-left dark:border-slate-800 dark:bg-slate-900 transition-all active:scale-95 cursor-pointer"
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                                    {initial}
                                </span>
                                <span className="max-w-[130px]">
                                    <span className="block truncate text-xs font-semibold text-slate-900 dark:text-white">
                                        {user?.ownerName || 'Member'}
                                    </span>
                                </span>
                                <ChevronDown
                                    size={14}
                                    className={`text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-950 z-20"
                                    >
                                        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Signed In As</p>
                                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">{user?.ownerName}</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase">{user?.role?.replace('_', ' ') || 'user'}</p>
                                        </div>
                                        <Link
                                            to="/dashboard"
                                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                                        >
                                            <LayoutDashboard size={14} className="text-indigo-500" />
                                            {t('Dashboard')}
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                                        >
                                            <LogOut size={14} />
                                            {t('Logout')}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link
                                to="/login"
                                className="px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl"
                            >
                                {t('Login')}
                            </Link>
                            <Link
                                to="/register"
                                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-95"
                            >
                                {t('Start Free')}
                            </Link>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 lg:hidden active:scale-95 transition-all"
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
            </nav>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mx-auto mt-3 max-w-7xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900 lg:hidden"
                    >
                        <div className="space-y-1">
                            {mainLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`block rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider ${location.pathname === link.path ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                                <p className="px-4 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{t('Company')}</p>
                                {dropdownLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        to={link.path}
                                        className={`block rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider ${location.pathname === link.path ? 'bg-indigo-50/50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-200' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800 flex flex-col gap-3">
                            {/* Language Switcher Mobile */}
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Globe size={14} className="text-indigo-600" /> {t("Language / भाषा")}
                                </span>
                                <div className="flex bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-0.5 rounded-lg shadow-sm">
                                    <button 
                                        onClick={() => setLanguage('en')}
                                        className={`px-3.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${language === 'en' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        EN
                                    </button>
                                    <button 
                                        onClick={() => setLanguage('hi')}
                                        className={`px-3.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${language === 'hi' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        हिन्दी
                                    </button>
                                </div>
                            </div>

                            {user ? (
                                <div className="space-y-2">
                                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">{initial}</span>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 dark:text-white">{user?.ownerName}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{user?.role?.replace('_', ' ') || 'user'}</p>
                                        </div>
                                    </div>
                                    <Link
                                        to="/dashboard"
                                        className="block text-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-4 py-3 text-xs font-black uppercase tracking-widest"
                                    >
                                        {t('Dashboard')}
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-center rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-4 py-3 text-xs font-black uppercase tracking-widest cursor-pointer"
                                    >
                                        {t('Logout')}
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <Link
                                        to="/login"
                                        className="rounded-xl border border-slate-200 px-3 py-3 text-center text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        {t('Login')}
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="rounded-xl bg-indigo-600 px-3 py-3 text-center text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700"
                                    >
                                        {t('Start Free')}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Navbar;
