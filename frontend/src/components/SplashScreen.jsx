import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

const SplashScreen = () => {
    return (
        <div className="fixed inset-0 bg-primary-600 flex flex-col items-center justify-center z-[9999]">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center"
            >
                <div className="bg-white p-4 rounded-3xl shadow-2xl mb-6">
                    <ShoppingBag className="w-16 h-16 text-primary-600" />
                </div>
                <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl font-extrabold text-white tracking-tight"
                >
                    MY <span className="text-primary-200">SHOP</span>
                </motion.h1>
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100px" }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="h-1 bg-white/30 rounded-full mt-4 overflow-hidden"
                >
                    <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        className="h-full w-full bg-white"
                    />
                </motion.div>
            </motion.div>
        </div>
    );
};

export default SplashScreen;
