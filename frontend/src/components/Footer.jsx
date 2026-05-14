import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, MapPin, Phone, ShoppingBag } from 'lucide-react';
import packageJson from '../../package.json';

const Footer = () => {
    const year = new Date().getFullYear();
    const version = packageJson.version;

    return (
        <footer className="relative overflow-hidden border-t border-slate-200 bg-white pt-16 text-slate-700 dark:border-slate-800 dark:bg-[#020617] dark:text-slate-300">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
            </div>

            <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-10 sm:px-6 lg:grid-cols-12">
                <div className="lg:col-span-5">
                    <Link to="/" className="inline-flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.35)]">
                            <ShoppingBag size={20} />
                        </span>
                        <span className="font-outfit text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Stock<span className="text-indigo-600">Saathi</span>
                        </span>
                    </Link>
                    <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        Professional POS and inventory platform for growing retailers. Manage billing, stock, teams, and reports from one reliable system.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link to="/register" className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
                            Start Free
                        </Link>
                        <Link to="/pricing" className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">
                            View Pricing
                            <ArrowRight size={15} />
                        </Link>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Product</h4>
                    <ul className="mt-4 space-y-2 text-sm">
                        <li><Link to="/" className="hover:text-indigo-600">Home</Link></li>
                        <li><Link to="/about" className="hover:text-indigo-600">About</Link></li>
                        <li><Link to="/pricing" className="hover:text-indigo-600">Pricing</Link></li>
                        <li><Link to="/contact" className="hover:text-indigo-600">Contact</Link></li>
                    </ul>
                </div>

                <div className="lg:col-span-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Account</h4>
                    <ul className="mt-4 space-y-2 text-sm">
                        <li><Link to="/login" className="hover:text-indigo-600">Login</Link></li>
                        <li><Link to="/register" className="hover:text-indigo-600">Register</Link></li>
                        <li><Link to="/dashboard" className="hover:text-indigo-600">Dashboard</Link></li>
                    </ul>
                </div>

                <div className="lg:col-span-3">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Contact</h4>
                    <ul className="mt-4 space-y-3 text-sm">
                        <li className="flex items-start gap-2">
                            <Mail size={16} className="mt-0.5 text-indigo-600" />
                            <span>support@stocksaathi.com</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Phone size={16} className="mt-0.5 text-indigo-600" />
                            <span>+91 90000 00000</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <MapPin size={16} className="mt-0.5 text-indigo-600" />
                            <span>Mumbai, India</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-slate-200/80 py-5 dark:border-slate-800">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
                    <p>© {year} StockSaathi. All rights reserved. <span className="ml-2 font-bold opacity-30 tracking-tighter">v{version}</span></p>
                    <p>Built for modern retail operations.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
