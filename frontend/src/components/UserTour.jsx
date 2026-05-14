import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, X, LayoutDashboard, ShoppingCart, 
    Package, BarChart3, Bell, CheckCircle2 
} from 'lucide-react';

const TOUR_STEPS = [
    {
        title: "Welcome to StockSaathi!",
        description: "Your all-in-one Retail OS is ready. Let's take a 30-second tour to see how it works.",
        icon: <LayoutDashboard className="text-indigo-600" size={32} />,
        target: "overview"
    },
    {
        title: "Smart Inventory",
        description: "Manage your stock, set low-stock alerts, and track expiry dates automatically.",
        icon: <Package className="text-amber-500" size={32} />,
        target: "inventory"
    },
    {
        title: "Lightning Fast POS",
        description: "Generate bills in seconds, handle UPI/Cash payments, and print professional receipts.",
        icon: <ShoppingCart className="text-emerald-500" size={32} />,
        target: "sales"
    },
    {
        title: "Profit Analytics",
        description: "Watch your daily, monthly, and yearly net profit grow with real-time reports.",
        icon: <BarChart3 className="text-indigo-600" size={32} />,
        target: "reports"
    },
    {
        title: "Smart Alerts",
        description: "The Bell icon will notify you about low stock, expiring batches, and shift closing reports.",
        icon: <Bell className="text-rose-500" size={32} />,
        target: "notifications"
    }
];

const UserTour = ({ user }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show for shop owners who haven't seen it
        const hasSeenTour = localStorage.getItem(`tour_seen_${user?._id}`);
        if (user?.role === 'shop_owner' && !hasSeenTour) {
            const timer = setTimeout(() => setIsVisible(true), 1500); // Wait for dashboard to load
            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem(`tour_seen_${user?._id}`, 'true');
    };

    if (!isVisible) return null;

    const step = TOUR_STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                onClick={handleComplete}
            />
            
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_32px_120px_rgba(0,0,0,0.3)] border border-white dark:border-slate-800 overflow-hidden"
            >
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800">
                    <motion.div 
                        className="h-full bg-indigo-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
                    />
                </div>

                <div className="p-10 pt-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                        {step.icon}
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                            {step.title}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            {step.description}
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                        {TOUR_STEPS.map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            onClick={handleComplete}
                            className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                        >
                            Skip Tour
                        </button>
                        <button 
                            onClick={handleNext}
                            className="flex-[2] h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {currentStep === TOUR_STEPS.length - 1 ? (
                                <>Get Started <CheckCircle2 size={16} /></>
                            ) : (
                                <>Next Step <ChevronRight size={16} /></>
                            )}
                        </button>
                    </div>
                </div>

                <button 
                    onClick={handleComplete}
                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                >
                    <X size={20} />
                </button>
            </motion.div>
        </div>
    );
};

export default UserTour;
