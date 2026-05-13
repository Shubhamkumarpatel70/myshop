import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-50 glass border-b border-secondary-200 dark:border-secondary-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <img src="/favicon.png" alt="StockSaathi" className="w-9 h-9 object-contain" />
                        <span className="text-xl font-bold tracking-tight">Stock<span className="text-primary-600">Saathi</span></span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.name} 
                                to={link.path}
                                className="text-secondary-600 hover:text-primary-600 font-medium transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                        
                        {user ? (
                            <div className="relative">
                                <button 
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 bg-secondary-100 dark:bg-secondary-800 px-3 py-1.5 rounded-full hover:bg-secondary-200 transition-colors"
                                >
                                    <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {user?.ownerName?.charAt(0) || 'U'}
                                    </div>
                                    <span className="text-sm font-medium">{user?.ownerName || 'User'}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-900 rounded-xl shadow-xl border border-secondary-200 dark:border-secondary-800 py-2"
                                        >
                                            <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary-50 dark:hover:bg-secondary-800">
                                                <User className="w-4 h-4" /> Dashboard
                                            </Link>
                                            <button 
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <LogOut className="w-4 h-4" /> Logout
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/login" className="text-secondary-600 font-medium">Login</Link>
                                <Link to="/register" className="btn btn-primary">Get Started</Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} className="p-2">
                            {isOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white dark:bg-secondary-950 border-b border-secondary-200 dark:border-secondary-800"
                    >
                        <div className="px-4 py-6 space-y-4">
                            {navLinks.map((link) => (
                                <Link 
                                    key={link.name} 
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className="block text-lg font-medium text-secondary-600"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <hr className="border-secondary-100 dark:border-secondary-800" />
                            {user ? (
                                <>
                                    <Link to="/dashboard" className="block text-lg font-medium">Dashboard</Link>
                                    <button onClick={handleLogout} className="block text-lg font-medium text-red-600">Logout</button>
                                </>
                            ) : (
                                <div className="space-y-4 pt-2">
                                    <Link to="/login" className="block text-center py-2 font-medium border border-secondary-200 rounded-lg">Login</Link>
                                    <Link to="/register" className="block text-center py-3 font-medium bg-primary-600 text-white rounded-lg">Get Started</Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
