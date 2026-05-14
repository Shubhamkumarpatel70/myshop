import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Check, ArrowRight, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UpgradeModal = ({ isOpen, onClose, plan, feature }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                onClick={onClose}
            />
            
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_32px_120px_rgba(0,0,0,0.3)] border border-white dark:border-slate-800 overflow-hidden"
            >
                <div className="p-8 sm:p-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                        <Zap className="text-amber-500" size={36} />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                            Limit Reached!
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            Your <span className="text-indigo-600 font-bold uppercase">{plan}</span> plan has reached its maximum {feature} limit. Upgrade to unlock your business potential.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 py-4">
                        {[
                            "Unlimited Product Listings",
                            "Add Multiple Staff Members",
                            "Premium Business Intelligence",
                            "Priority Customer Support"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-left p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                                    <Check size={12} />
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">{item}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={onClose}
                            className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                        >
                            Maybe Later
                        </button>
                        <button 
                            onClick={() => {
                                navigate('/dashboard/pricing');
                                onClose();
                            }}
                            className="flex-[2] h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            View Pro Plans <ArrowRight size={16} />
                        </button>
                    </div>
                </div>

                <button 
                    onClick={onClose}
                    className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                >
                    <X size={20} />
                </button>
            </motion.div>
        </div>
    );
};

export default UpgradeModal;
