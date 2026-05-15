import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Home, Lock, MessageCircle } from 'lucide-react';

const AccessDenied = () => {
    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 dark:bg-[#020617]">
            <div className="max-w-2xl w-full text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative inline-block mb-8"
                >
                    <div className="absolute inset-0 bg-rose-500 blur-3xl opacity-10 rounded-full"></div>
                    <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 shadow-2xl">
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-600">
                            <ShieldAlert size={44} />
                        </div>
                        
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Access Denied</h1>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm leading-relaxed mb-8">
                            This section is restricted to higher administrative roles. If you believe this is a mistake, please contact your Shop Owner or Platform Admin.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link
                                to="/dashboard"
                                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all"
                            >
                                <Home size={18} />
                                Back to Dashboard
                            </Link>
                            <Link
                                to="/contact"
                                className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                                <MessageCircle size={18} />
                                Contact Support
                            </Link>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
                        <Lock size={12} />
                        SECURE ZONE: Role Verification Failed
                    </div>
                </motion.div>
            </div>
        </main>
    );
};

export default AccessDenied;
