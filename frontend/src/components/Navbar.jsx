import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 16);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsOpen(false);
        setIsProfileOpen(false);
    }, [location.pathname]);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Browse Shops', path: '/shops' },
        { name: 'My Shopping', path: '/lookup-receipt' },
        { name: 'Pricing', path: '/pricing' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
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
                    'mx-auto flex max-w-7xl items-center justify-between rounded-2xl border px-4 py-3 transition-all duration-300 sm:px-6',
                    scrolled
                        ? 'border-slate-200/80 bg-white/90 shadow-[0_10px_35px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/85'
                        : 'border-transparent bg-white/70 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:bg-slate-900/60',
                ].join(' ')}
            >
                <Link to="/" className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.35)]">
                        <ShoppingBag size={20} />
                    </span>
                    <span className="font-outfit text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Stock<span className="text-indigo-600">Saathi</span>
                    </span>
                </Link>

                <div className="hidden items-center gap-8 lg:flex">
                    {navLinks.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={[
                                    'relative text-sm font-semibold transition-colors',
                                    isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
                                ].join(' ')}
                            >
                                {link.name}
                                {isActive && (
                                    <span className="absolute -bottom-2 left-0 h-0.5 w-full rounded-full bg-indigo-600" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                <div className="hidden items-center gap-3 lg:flex">
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen((prev) => !prev)}
                                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-left dark:border-slate-700 dark:bg-slate-900"
                            >
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                                    {initial}
                                </span>
                                <span className="max-w-[130px]">
                                    <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                                        {user?.ownerName || 'Member'}
                                    </span>
                                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                                        {user?.role?.replace('_', ' ') || 'user'}
                                    </span>
                                </span>
                                <ChevronDown
                                    size={16}
                                    className={`text-slate-500 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        className="absolute right-0 mt-3 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                                    >
                                        <Link
                                            to="/dashboard"
                                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                                        >
                                            <LayoutDashboard size={16} />
                                            Dashboard
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                        >
                                            <LogOut size={16} />
                                            Logout
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(79,70,229,0.35)] transition-colors hover:bg-indigo-700"
                            >
                                Start Free
                            </Link>
                        </>
                    )}
                </div>

                <button
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 lg:hidden"
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
                        className="mx-auto mt-3 max-w-7xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900 lg:hidden"
                    >
                        <div className="space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`block rounded-lg px-3 py-2 text-sm font-medium ${location.pathname === link.path ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'}`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                            {user ? (
                                <div className="space-y-2">
                                    <Link
                                        to="/dashboard"
                                        className="block rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full rounded-lg bg-rose-50 px-3 py-2 text-left text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <Link
                                        to="/login"
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white"
                                    >
                                        Start Free
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
