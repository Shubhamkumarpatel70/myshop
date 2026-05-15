import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Ghost } from 'lucide-react';

const NotFound = () => {
    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 dark:bg-[#020617]">
            <div className="max-w-2xl w-full text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative inline-block mb-8"
                >
                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                    <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl">
                        <Ghost size={80} className="text-indigo-600 dark:text-indigo-400 mx-auto mb-4 animate-bounce" />
                        <h1 className="text-9xl font-black tracking-tighter text-slate-200 dark:text-slate-800 absolute -top-10 left-1/2 -translate-x-1/2 -z-10 select-none">
                            404
                        </h1>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Page Not Found</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm leading-relaxed">
                            Oops! It looks like you've wandered into an uncharted shelf. The product or page you are looking for doesn't exist.
                        </p>
                    </div>
                </motion.div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/"
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <Home size={18} />
                        Go to Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>
                </div>

                <div className="mt-12 text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-[0.2em]">
                    StockSaathi Retail OS
                </div>
            </div>
        </main>
    );
};

export default NotFound;
