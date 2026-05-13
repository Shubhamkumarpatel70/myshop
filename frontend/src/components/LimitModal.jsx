import React from 'react';
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-lg bg-white dark:bg-slate-950 rounded-[3rem] shadow-2xl overflow-hidden p-10 text-center"
            >
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-indigo-600">
                    <Zap size={40} className="animate-pulse" />
                </div>
                
                <h2 className="text-3xl font-black tracking-tighter uppercase mb-4">
                    {limitType === 'product' ? 'Product Limit Reached' : 'Staff Limit Reached'}
                </h2>
                
                <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                    Your current plan has reached its maximum capacity. To continue expanding your business, you can upgrade or activate your free trial.
                </p>

                <div className="space-y-4">
                    {!isTrialUsed ? (
                        <button 
                            onClick={handleActivateTrial}
                            disabled={loading}
                            className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 group"
                        >
                            {loading ? 'Activating...' : 'Activate 7-Day Free Trial'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <button 
                            onClick={() => {
                                navigate('/dashboard/pricing');
                                onClose();
                            }}
                            className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 group"
                        >
                            Explore Growth Plans <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                    
                    <button 
                        onClick={onClose}
                        className="w-full h-14 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default LimitModal;
