import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Lock, Mail, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
    const [loginMethod, setLoginMethod] = useState('password');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [mpin, setMpin] = useState(['', '', '', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleMpinChange = (index, value) => {
        if (value.length > 1) return;
        const next = [...mpin];
        next[index] = value.replace(/\D/g, '');
        setMpin(next);
        if (value && index < 3) document.getElementById(`mpin-${index + 1}`)?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !mpin[index] && index > 0) {
            document.getElementById(`mpin-${index - 1}`)?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const mpinValue = loginMethod === 'mpin' ? mpin.join('') : null;
            const result = await login(formData.email, formData.password, mpinValue);
            if (result.success) {
                toast.success('Login successful');
                navigate('/dashboard');
            } else {
                toast.error(result.message || 'Invalid credentials');
            }
        } catch {
            toast.error('Unable to login right now');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-100/60 px-4 py-8 text-slate-900 sm:px-6">
            <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center gap-8 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:grid-cols-2 lg:p-10">
                <section className="rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-sky-600 p-6 text-white sm:p-8">
                    <Link to="/" className="inline-flex items-center gap-3 text-white">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                            <ShoppingBag size={20} />
                        </span>
                        <span className="font-outfit text-xl font-extrabold tracking-tight">StockSaathi</span>
                    </Link>
                    <h1 className="mt-8 font-outfit text-3xl font-bold leading-tight sm:text-4xl">Welcome back</h1>
                    <p className="mt-3 text-sm leading-relaxed text-indigo-100 sm:text-base">
                        Securely access your dashboard to manage billing, stock, and team operations.
                    </p>
                    <ul className="mt-8 space-y-2 text-sm text-indigo-100">
                        <li>Role-based access for staff and owners</li>
                        <li>Fast checkout and live stock sync</li>
                        <li>Reports and daily business insights</li>
                    </ul>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex rounded-lg border border-slate-200 bg-slate-100 p-1">
                        <button
                            type="button"
                            onClick={() => setLoginMethod('password')}
                            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${loginMethod === 'password' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            Password
                        </button>
                        <button
                            type="button"
                            onClick={() => setLoginMethod('mpin')}
                            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${loginMethod === 'mpin' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            mPIN
                        </button>
                    </div>

                    <motion.form onSubmit={handleSubmit} className="space-y-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                            <div className="relative">
                                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="owner@shop.com"
                                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {loginMethod === 'password' ? (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                                <div className="relative">
                                    <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Enter password"
                                        className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">4-digit mPIN</label>
                                <div className="flex justify-between gap-2 sm:gap-3">
                                    {mpin.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`mpin-${index}`}
                                            type="text"
                                            maxLength="1"
                                            inputMode="numeric"
                                            required
                                            value={digit}
                                            onChange={(e) => handleMpinChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            className="h-12 w-full rounded-lg border border-slate-300 bg-white text-center text-xl font-bold text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Login'}
                            {!isSubmitting && <ArrowRight size={16} />}
                        </button>
                    </motion.form>

                    <p className="mt-4 text-center text-sm text-slate-500">
                        New to StockSaathi?{' '}
                        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                            Create account
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
};

export default Login;
