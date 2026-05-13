import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShoppingBag, ArrowRight, ArrowLeft, 
    Store, User, Mail, Phone, Lock, 
    CheckCircle2, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        shopName: '',
        ownerName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        // These will be collected during onboarding in dashboard
        businessType: 'General Store',
        address: 'Incomplete' 
    });

    const { register } = useAuth();
    const navigate = useNavigate();

    const nextStep = () => {
        if (step === 1 && (!formData.shopName || !formData.ownerName)) return toast.error("Please fill in your names");
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return toast.error("Passwords do not match");
        }
        
        setLoading(true);
        try {
            const res = await register(formData);
            if (res.success) {
                toast.success("Welcome aboard!");
                navigate('/dashboard');
            } else {
                toast.error(res.message || "Registration failed");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const stepVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 }
    };

    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <Link to="/" className="inline-flex items-center gap-3 mb-6">
                    <img src="/favicon.png" alt="StockSaathi" className="w-10 h-10 object-contain" />
                    <span className="text-3xl font-black tracking-tight dark:text-white">Stock<span className="text-primary-600">Saathi</span></span>
                </Link>
                <h2 className="text-3xl font-extrabold text-secondary-900 dark:text-white">
                    Create Your Account
                </h2>
                <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">
                    Join 500+ businesses scaling with StockSaathi.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
                <div className="bg-white dark:bg-secondary-900 py-10 px-8 shadow-2xl rounded-[2.5rem] border border-secondary-100 dark:border-secondary-800 relative overflow-hidden">
                    
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-secondary-100 dark:bg-secondary-800">
                        <motion.div 
                            className="h-full bg-primary-600"
                            initial={{ width: '50%' }}
                            animate={{ width: `${(step / 2) * 100}%` }}
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    variants={stepVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-6"
                                >
                                    <div>
                                        <label className="block text-sm font-bold text-secondary-700 dark:text-secondary-300 mb-2 uppercase tracking-wide">
                                            Shop Name
                                        </label>
                                        <div className="relative">
                                            <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                                            <input
                                                type="text" required className="input-field pl-12 py-4"
                                                placeholder="e.g. Metro Medicals"
                                                value={formData.shopName}
                                                onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-secondary-700 dark:text-secondary-300 mb-2 uppercase tracking-wide">
                                            Owner Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                                            <input
                                                type="text" required className="input-field pl-12 py-4"
                                                placeholder="Your Full Name"
                                                value={formData.ownerName}
                                                onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={nextStep}
                                        className="btn btn-primary w-full py-4 text-lg font-bold"
                                    >
                                        Continue <ArrowRight size={20} />
                                    </button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    variants={stepVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-[10px] font-bold text-secondary-500 uppercase mb-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                                            <input
                                                type="email" required className="input-field pl-10 py-3 text-sm"
                                                placeholder="email@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-secondary-500 uppercase mb-1">Mobile Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                                            <input
                                                type="tel" required className="input-field pl-10 py-3 text-sm"
                                                placeholder="+1 234 567 890"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-secondary-500 uppercase mb-1">Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                                                <input
                                                    type="password" required className="input-field pl-10 py-3 text-sm"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-secondary-500 uppercase mb-1">Confirm</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                                                <input
                                                    type="password" required className="input-field pl-10 py-3 text-sm"
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-4">
                                        <button type="button" onClick={prevStep} className="btn btn-secondary w-1/4 py-4 font-bold">
                                            <ArrowLeft size={20} />
                                        </button>
                                        <button 
                                            type="submit" 
                                            disabled={loading}
                                            className="btn btn-primary flex-1 py-4 text-lg font-bold disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : 'Create StockSaathi Account'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </form>
                    </AnimatePresence>

                    <div className="mt-8 pt-8 border-t border-secondary-100 dark:border-secondary-800 text-center">
                        <p className="text-secondary-500 dark:text-secondary-400">
                            Already have a shop?{' '}
                            <Link to="/login" className="text-primary-600 font-bold hover:underline">
                                Login Here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
