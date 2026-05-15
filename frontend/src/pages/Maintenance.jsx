import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
    Hammer, Sparkles, Clock, ShoppingBag, Lock, 
    RefreshCcw, ShieldCheck, Zap, Server
} from 'lucide-react';

const Maintenance = ({ time = '15 Minutes', until }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!until) return;

        const calculateTimeLeft = () => {
            const difference = new Date(until) - new Date();
            
            if (difference <= 0) {
                setTimeLeft('READY SOON');
                return;
            }

            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTimeLeft(
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();

        return () => clearInterval(timer);
    }, [until]);

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center p-6 overflow-hidden relative font-jakarta">
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                    animate={{ 
                        x: [0, 100, 0],
                        y: [0, -50, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px]" 
                />
                <motion.div 
                    animate={{ 
                        x: [0, -100, 0],
                        y: [0, 50, 0],
                        opacity: [0.1, 0.15, 0.1]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[100px]" 
                />
            </div>

            <div className="max-w-2xl w-full relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                    className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[4rem] p-10 md:p-16 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.1)] dark:shadow-none relative overflow-hidden"
                >
                    {/* Top Branding */}
                    <div className="flex flex-col items-center text-center space-y-8">
                        <div className="flex items-center gap-3 px-6 py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-full border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                            <ShoppingBag size={18} className="text-indigo-600" />
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">StockSaathi Retail OS</span>
                        </div>

                        {/* Centered Graphic */}
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                className="w-32 h-32 md:w-40 md:h-40 border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 rounded-full flex items-center justify-center"
                            >
                                <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-xl"></div>
                            </motion.div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                    animate={{ 
                                        scale: [1, 1.1, 1],
                                        y: [0, -5, 0]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-white/5"
                                >
                                    <Server size={40} className="text-indigo-600" />
                                </motion.div>
                            </div>
                            
                            {/* Floating Micro-Icons */}
                            <motion.div 
                                animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }} 
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute -top-4 -right-4 bg-emerald-500 text-white p-2 rounded-xl shadow-lg shadow-emerald-500/20"
                            >
                                <ShieldCheck size={16} />
                            </motion.div>
                            <motion.div 
                                animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }} 
                                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                                className="absolute -bottom-4 -left-4 bg-amber-500 text-white p-2 rounded-xl shadow-lg shadow-amber-500/20"
                            >
                                <Zap size={16} />
                            </motion.div>
                        </div>

                        <div className="space-y-4 max-w-md">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                                Scheduled <span className="text-indigo-600">Upgrade</span> in Progress
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                We're enhancing our cloud infrastructure to provide a faster and more secure retail experience. We'll be back shortly.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full pt-4">
                            <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center gap-4 w-full">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600">
                                    <Clock size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Estimated Return</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white leading-none mt-1 uppercase tracking-tighter">
                                        {until ? (
                                            <span className="text-indigo-600 font-mono tabular-nums">{timeLeft}</span>
                                        ) : (
                                            `~ ${time}`
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center gap-4 w-full">
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <RefreshCcw size={20} className="animate-spin-slow" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Status</p>
                                    <p className="text-lg font-black text-emerald-600 leading-none mt-1 uppercase tracking-tighter">Deploying</p>
                                </div>
                            </div>
                        </div>

                        {/* Progress Indicator */}
                        <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden relative">
                            <motion.div 
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-indigo-600 to-transparent"
                            />
                        </div>

                        {/* Footer & Management Access */}
                        <div className="w-full pt-10 border-t border-slate-100 dark:border-white/5 flex flex-col items-center gap-6">
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">
                                Systems Managed by STOCKSAATHI OS
                            </p>
                            
                            <Link 
                                to="/login" 
                                className="flex items-center gap-2 px-6 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 group border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                            >
                                <Lock size={12} className="group-hover:text-indigo-500 transition-colors" />
                                Admin Gateway
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
};

export default Maintenance;
