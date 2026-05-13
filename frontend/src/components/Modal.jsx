import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, className = "max-w-2xl" }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
                    ></motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] ${className} max-h-[95vh] flex flex-col bg-white dark:bg-secondary-900 z-[70] rounded-[2rem] shadow-2xl overflow-hidden border border-secondary-100 dark:border-secondary-800`}
                    >
                        <div className="flex justify-between items-center px-6 py-4 border-b border-secondary-100 dark:border-secondary-800 shrink-0">
                            <h3 className="text-xl font-bold">{title}</h3>
                            <button onClick={onClose} className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar min-h-0">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Modal;
