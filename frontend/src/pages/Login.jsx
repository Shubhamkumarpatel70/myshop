import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Lock, Mail, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
    const [loginMethod, setLoginMethod] = useState('password');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [mpin, setMpin] = useState(['', '', '', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [timeLeft, setTimeLeft] = React.useState(0);
    const { login } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    // Check for existing lockout on mount
    React.useEffect(() => {
        const lockoutUntil = localStorage.getItem('loginLockout');
        if (lockoutUntil) {
            const remaining = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 1000);
            if (remaining > 0) setTimeLeft(remaining);
        }
    }, []);

    // Countdown Timer Effect
    React.useEffect(() => {
        if (timeLeft <= 0) {
            localStorage.removeItem('loginLockout');
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    // Check lockout for specific email (Debounced)
    React.useEffect(() => {
        const checkEmailLockout = async () => {
            if (!formData.email || !formData.email.includes('@')) return;
            try {
                const res = await api.get(`/auth/check-lockout?email=${formData.email}`);
                if (res.data.success && res.data.isLocked) {
                    const serverSeconds = res.data.remainingSeconds;
                    const serverLockout = res.data.lockoutUntil;
                    
                    localStorage.setItem('loginLockout', serverLockout.toString());
                    setTimeLeft(serverSeconds);
                    setFailedAttempts(3);
                } else if (res.data.success && !res.data.isLocked) {
                    if (timeLeft > 0) setTimeLeft(0);
                }
            } catch (err) {
                console.error("Lockout check failed");
            }
        };

        const timeoutId = setTimeout(checkEmailLockout, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.email]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

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
        if (timeLeft > 0) return;
        
        setIsSubmitting(true);
        try {
            const mpinValue = loginMethod === 'mpin' ? mpin.join('') : null;
            const result = await login(formData.email, formData.password, mpinValue);
            
            if (result.success) {
                toast.success(t('Login successful'));
                localStorage.removeItem('loginLockout');
                setFailedAttempts(0);
                navigate('/dashboard');
            } else {
                if (result.isLocked) {
                    const serverSeconds = result.remainingSeconds || 300;
                    const serverLockout = result.lockoutUntil || (Date.now() + serverSeconds * 1000);
                    
                    localStorage.setItem('loginLockout', serverLockout.toString());
                    setTimeLeft(serverSeconds);
                    setFailedAttempts(3);
                    toast.error(result.message || t('Account locked'));
                } else {
                    const remaining = result.attemptsLeft !== undefined ? result.attemptsLeft : 3 - (failedAttempts + 1);
                    setFailedAttempts(3 - remaining);
                    toast.error(result.message || `${t('Invalid credentials')}. ${remaining} ${t('attempts left')}`);
                }
            }
        } catch {
            toast.error(t('Unable to login right now'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
            <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center gap-8 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8 lg:grid-cols-2 lg:p-10">
                <section className="rounded-2xl bg-indigo-600 p-6 text-white sm:p-8">
                    <Link to="/" className="inline-flex items-center gap-3 text-white">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                            <ShoppingBag size={20} />
                        </span>
                        <span className="font-outfit text-xl font-extrabold tracking-tight">StockSaathi</span>
                    </Link>
                    <h1 className="mt-8 font-outfit text-3xl font-bold leading-tight sm:text-4xl">{t('Welcome back')}</h1>
                    <p className="mt-3 text-sm leading-relaxed text-indigo-100 sm:text-base">
                        {t('Securely access your dashboard to manage billing, stock, and team operations.')}
                    </p>
                    <ul className="mt-8 space-y-2 text-sm text-indigo-100">
                        <li>{t('Role-based access for staff and owners')}</li>
                        <li>{t('Fast checkout and live stock sync')}</li>
                        <li>{t('Reports and daily business insights')}</li>
                    </ul>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex rounded-lg border border-slate-200 bg-slate-100 p-1">
                        <button
                            type="button"
                            onClick={() => setLoginMethod('password')}
                            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${loginMethod === 'password' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            {t('Password')}
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
                            <label className="mb-1 block text-sm font-medium text-slate-700">{t('Email Address')}</label>
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
                                <label className="mb-1 block text-sm font-medium text-slate-700">{t('Password')}</label>
                                <div className="relative">
                                    <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={t('Enter password')}
                                        className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">{t('4-digit mPIN')}</label>
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
                                            className="h-12 w-full rounded-[1.25rem] border border-slate-300 bg-white text-center text-xl font-bold text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || timeLeft > 0}
                            className={`mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[1.25rem] text-sm font-black uppercase tracking-widest text-white transition-all shadow-lg disabled:opacity-60 group border border-transparent ${
                                timeLeft > 0 
                                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' 
                                : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                        >
                            {isSubmitting ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : timeLeft > 0 ? (
                                `${t('Locked')}: ${formatTime(timeLeft)}`
                            ) : (
                                <>
                                    {t('Login')} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </motion.form>

                    <p className="mt-4 text-center text-sm text-slate-500">
                        {t("Don't have an account?")}{' '}
                        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                            {t('Register here')}
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
};

export default Login;
