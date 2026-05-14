import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Lock, Mail, Phone, ShoppingBag, Store, User } from 'lucide-react';
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
        mPin: '',
        businessType: 'General Store',
        address: 'Incomplete',
    });

    const { register } = useAuth();
    const navigate = useNavigate();

    const nextStep = () => {
        if (!formData.shopName || !formData.ownerName) {
            toast.error('Shop name and owner name are required');
            return;
        }
        setStep(2);
    };

    const prevStep = () => setStep(1);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (!/^\d{4}$/.test(formData.mPin)) {
            toast.error('mPIN must be 4 digits');
            return;
        }

        setLoading(true);
        try {
            const res = await register(formData);
            if (res.success) {
                toast.success('Account created successfully');
                navigate('/dashboard');
            } else {
                toast.error(res.message || 'Registration failed');
            }
        } catch {
            toast.error('Unable to register right now');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-100/60 px-4 py-8 text-slate-900 sm:px-6">
            <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:grid-cols-2 lg:p-10">
                <section className="rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-sky-600 p-6 text-white sm:p-8">
                    <Link to="/" className="inline-flex items-center gap-3 text-white">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                            <ShoppingBag size={20} />
                        </span>
                        <span className="font-outfit text-xl font-extrabold tracking-tight">StockSaathi</span>
                    </Link>
                    <h1 className="mt-8 font-outfit text-3xl font-bold leading-tight sm:text-4xl">Create your account</h1>
                    <p className="mt-3 text-sm leading-relaxed text-indigo-100 sm:text-base">
                        Set up your store in a few minutes and start managing billing, stock, and staff from one dashboard.
                    </p>
                    <div className="mt-8 space-y-2 text-sm text-indigo-100">
                        <p>Step 1: Store profile</p>
                        <p>Step 2: Credentials and access setup</p>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 h-1.5 rounded-full bg-slate-200">
                        <motion.div
                            initial={{ width: '50%' }}
                            animate={{ width: `${step === 1 ? 50 : 100}%` }}
                            className="h-full rounded-full bg-indigo-600"
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        <form onSubmit={handleSubmit} className="space-y-4" key={step}>
                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Shop name</label>
                                        <div className="relative">
                                            <Store size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="text"
                                                required
                                                value={formData.shopName}
                                                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                                                placeholder="Your shop name"
                                                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Owner name</label>
                                        <div className="relative">
                                            <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="text"
                                                required
                                                value={formData.ownerName}
                                                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                                placeholder="Full name"
                                                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                                    >
                                        Continue
                                        <ArrowRight size={16} />
                                    </button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                                            <div className="relative">
                                                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                                    placeholder="you@shop.com"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                                            <div className="relative">
                                                <Phone size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                <input
                                                    type="tel"
                                                    required
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                                    placeholder="+91..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                                            <div className="relative">
                                                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                <input
                                                    type="password"
                                                    required
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                                    placeholder="Create password"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm password</label>
                                            <div className="relative">
                                                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                <input
                                                    type="password"
                                                    required
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                                    placeholder="Repeat password"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">4-digit mPIN</label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={4}
                                            value={formData.mPin}
                                            onChange={(e) => setFormData({ ...formData, mPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm tracking-[0.3em] text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                            placeholder="0000"
                                        />
                                    </div>

                                    <div className="grid grid-cols-[44px_1fr] gap-2">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition-colors hover:bg-slate-100"
                                        >
                                            <ArrowLeft size={16} />
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                                        >
                                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create account'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </form>
                    </AnimatePresence>

                    <p className="mt-4 text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                            Login
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
};

export default Register;
