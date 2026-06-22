import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

const Loader = ({ message = "Synchronizing Matrix", fullScreen = true }) => {
    const content = (
        <div className="flex flex-col items-center gap-8 relative">
            {/* Animated Logo Container */}
            <div className="relative">
                <motion.div
                    animate={{ 
                        rotate: 360,
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                        rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                        scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="w-24 h-24 rounded-[2rem] border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center relative"
                >
                    <div className="absolute inset-0 bg-indigo-500/5 rounded-[2rem] blur-xl animate-pulse"></div>
                </motion.div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-2xl border border-slate-100 dark:border-white/5 relative z-10"
                    >
                        <ShoppingBag size={32} className="text-indigo-600" />
                    </motion.div>
                </div>

                {/* Satellite Orbs */}
                {[0, 120, 240].map((degree, i) => (
                    <motion.div
                        key={degree}
                        animate={{ 
                            rotate: 360 
                        }}
                        transition={{ 
                            duration: 3, 
                            repeat: Infinity, 
                            ease: "linear",
                            delay: i * 0.5
                        }}
                        className="absolute inset-0 pointer-events-none"
                    >
                        <motion.div 
                            className="w-2 h-2 bg-indigo-500 rounded-full absolute -top-1 left-1/2 -translate-x-1/2 shadow-[0_0_10px_#6366f1]"
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Status Text */}
            <div className="space-y-3 text-center">
                <div className="flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">{message}</h3>
                </div>
                
                {/* Progress Bar */}
                <div className="w-48 h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden relative mx-auto">
                    <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-0 bottom-0 w-1/2 bg-indigo-600"
                    />
                </div>
            </div>
        </div>
    );

    if (!fullScreen) return content;

    return (
        <div className="fixed inset-0 bg-white/60 dark:bg-[#020617]/60 backdrop-blur-xl flex items-center justify-center z-[10000] p-6">
            {content}
        </div>
    );
};

export default Loader;
