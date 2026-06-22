import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, className = "max-w-2xl" }) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/40 z-[60] backdrop-blur-[4px]"
                    ></motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: '-48%', x: '-50%' }}
                        animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
                        exit={{ opacity: 0, scale: 0.95, y: '-48%', x: '-50%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 400 }}
                        style={{ top: '50%' }}
                        className={`fixed left-1/2 w-[95%] ${className} max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 z-[70] rounded-[2rem] shadow-[0_20px_80px_rgba(0,0,0,0.25)] overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors`}
                    >
                        {/* Decorative Top Border */}
                        <div className="h-1.5 w-full bg-indigo-600 shrink-0" />
                        
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                            <div className="space-y-0.5">
                                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">{title}</h3>
                                <div className="h-0.5 w-8 bg-indigo-600 rounded-full" />
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 rounded-xl transition-all active:scale-90"
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar min-h-0 bg-white dark:bg-slate-900">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Modal;
