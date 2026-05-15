import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, ArrowRight, ShieldCheck, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const LimitModal = ({ isOpen, onClose, limitType, isTrialUsed }) => {
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const [loading, setLoading] = React.useState(false);

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

    if (!isOpen) return null;

    const handleActivateTrial = async () => {
        setLoading(true);
        try {
            const res = await api.post('/subscriptions/activate-trial');
            if (res.data.success) {
                toast.success(res.data.message);
                updateUser(res.data.data);
                onClose();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Trial activation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/40 backdrop-blur-[4px]"
                />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    transition={{ type: "spring", damping: 25, stiffness: 400 }}
                    className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_32px_120px_rgba(0,0,0,0.25)] overflow-hidden border border-slate-200 dark:border-slate-800"
                >
                    {/* Decorative Top Border */}
                    <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 shrink-0" />
                    
                    <div className="p-8 md:p-12 text-center">
                        <div className="w-24 h-24 bg-amber-50 dark:bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-amber-600 ring-8 ring-amber-500/5">
                            <Zap size={48} className="animate-pulse" />
                        </div>
                        
                        <h2 className="text-3xl font-black tracking-tighter uppercase mb-4 text-slate-900 dark:text-white leading-tight">
                            {limitType === 'product' ? 'Product Limit Reached' : 'Staff Limit Reached'}
                        </h2>
                        
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed max-w-sm mx-auto">
                            Your current merchant account has reached its data capacity. Upgrade your license to unlock unlimited operational scalability.
                        </p>

                        <div className="space-y-4 max-w-sm mx-auto">
                            {!isTrialUsed ? (
                                <button 
                                    onClick={handleActivateTrial}
                                    disabled={loading}
                                    className="w-full h-18 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                                >
                                    {loading ? 'Activating...' : 'Activate 7-Day Trial'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <button 
                                    onClick={() => {
                                        navigate('/dashboard/pricing');
                                        onClose();
                                    }}
                                    className="w-full h-18 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 group"
                                >
                                    Scale Infrastructure <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                            
                            <button 
                                onClick={onClose}
                                className="w-full h-14 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                            >
                                Stay on current tier
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default LimitModal;
