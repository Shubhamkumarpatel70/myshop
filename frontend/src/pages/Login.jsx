import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
    const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'mpin'
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [mpin, setMpin] = useState(['', '', '', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleMpinChange = (index, value) => {
        if (value.length > 1) return;
        const newMpin = [...mpin];
        newMpin[index] = value;
        setMpin(newMpin);

        // Auto focus next
        if (value && index < 3) {
            const nextInput = document.getElementById(`mpin-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !mpin[index] && index > 0) {
            const prevInput = document.getElementById(`mpin-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const mpinValue = loginMethod === 'mpin' ? mpin.join('') : null;
            const result = await login(formData.email, formData.password, mpinValue);
            
            if (result.success) {
                toast.success('Welcome back!');
                navigate('/dashboard');
            } else {
                toast.error(result.message || 'Invalid credentials');
            }
        } catch (error) {
            toast.error('An error occurred during login');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-950 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center gap-3 mb-6">
                        <img src="/favicon.png" alt="StockSaathi" className="w-10 h-10 object-contain" />
                        <span className="text-3xl font-bold tracking-tight">Stock<span className="text-primary-600">Saathi</span></span>
                    </Link>
                    <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Welcome Back</h1>
                    <p className="text-secondary-500 dark:text-secondary-400 mt-2">Access your shop dashboard securely.</p>
                </div>

                <div className="card shadow-2xl relative overflow-hidden">
                    {/* Login Method Toggle */}
                    <div className="flex bg-secondary-100 dark:bg-secondary-800 p-1 rounded-2xl mb-8">
                        <button 
                            onClick={() => setLoginMethod('password')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${loginMethod === 'password' ? 'bg-white dark:bg-secondary-900 shadow-sm text-primary-600' : 'text-secondary-500'}`}
                        >
                            Password
                        </button>
                        <button 
                            onClick={() => setLoginMethod('mpin')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${loginMethod === 'mpin' ? 'bg-white dark:bg-secondary-900 shadow-sm text-primary-600' : 'text-secondary-500'}`}
                        >
                            mPin
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-secondary-500 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                <input
                                    type="email"
                                    required
                                    className="input-field pl-12 h-14"
                                    placeholder="owner@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        {loginMethod === 'password' ? (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className="flex justify-between mb-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary-500">Security Password</label>
                                    <a href="#" className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:underline">Reset?</a>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                    <input
                                        type="password"
                                        required={loginMethod === 'password'}
                                        className="input-field pl-12 h-14"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-4"
                            >
                                <label className="block text-[10px] font-black uppercase tracking-widest text-secondary-500 text-center">Enter 4-Digit Security mPin</label>
                                <div className="flex justify-center gap-4">
                                    {mpin.map((digit, i) => (
                                        <input
                                            key={i}
                                            id={`mpin-${i}`}
                                            type="text"
                                            maxLength="1"
                                            inputMode="numeric"
                                            className="w-14 h-16 text-center text-2xl font-black bg-secondary-50 dark:bg-secondary-800 border-2 border-secondary-100 dark:border-secondary-700 rounded-2xl focus:border-primary-600 focus:ring-0 transition-all"
                                            value={digit}
                                            onChange={(e) => handleMpinChange(i, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(i, e) }
                                            required={loginMethod === 'mpin'}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary w-full h-14 font-black uppercase tracking-widest shadow-xl shadow-primary-500/20"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Access Dashboard <ArrowRight className="w-5 h-5 ml-2" /></>}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-secondary-500">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary-600 font-bold hover:underline">
                                Create a Shop
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
