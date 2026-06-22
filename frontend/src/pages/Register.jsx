import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Lock, Mail, Phone, ShoppingBag, Store, User, Upload, ShieldCheck, Eye, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Register = () => {
    const { t } = useLanguage();
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
        aadharNumber: '',
        aadharFront: '',
        aadharBack: '',
    });

    const [uploading, setUploading] = useState({ front: false, back: false });

    const { register } = useAuth();
    const navigate = useNavigate();

    const uploadToCloudinary = async (file, side) => {
        const uploadData = new FormData();
        uploadData.append('image', file);
        setUploading(prev => ({ ...prev, [side]: true }));
        try {
            const res = await api.post('/auth/upload-kyc', uploadData);
            setFormData(prev => ({ ...prev, [side === 'front' ? 'aadharFront' : 'aadharBack']: res.data.url }));
            toast.success(`${side === 'front' ? 'Front' : 'Back'} Image Uploaded`);
        } catch (error) {
            toast.error("Upload failed");
        } finally {
            setUploading(prev => ({ ...prev, [side]: false }));
        }
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.shopName || !formData.ownerName) {
                toast.error('Shop name and owner name are required');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!formData.email || !formData.phone || !formData.password || !formData.confirmPassword || !formData.mPin) {
                toast.error('All fields are required');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                toast.error('Passwords do not match');
                return;
            }
            if (!/^\d{4}$/.test(formData.mPin)) {
                toast.error('mPIN must be 4 digits');
                return;
            }
            setStep(3);
        }
    };

    const prevStep = () => setStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.aadharFront || !formData.aadharBack) {
            toast.error('Please upload both Aadhar front and back images');
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
        <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
            <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-8 lg:grid-cols-2 lg:p-10">
                <section className="rounded-2xl bg-indigo-600 p-6 text-white sm:p-8">
                    <Link to="/" className="inline-flex items-center gap-3 text-white">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                            <ShoppingBag size={20} />
                        </span>
                        <span className="font-outfit text-xl font-extrabold tracking-tight">StockSaathi</span>
                    </Link>
                    <h1 className="mt-8 font-outfit text-3xl font-bold leading-tight sm:text-4xl">{t("Create your account")}</h1>
                    <p className="mt-3 text-sm leading-relaxed text-indigo-100 sm:text-base">
                        {t("Set up your store in a few minutes and start managing billing, stock, and staff from one dashboard.")}
                    </p>
                    <div className="mt-8 space-y-2 text-sm text-indigo-100">
                        <p className={step === 1 ? "font-bold text-white underline" : ""}>{t("Step 1: Store profile")}</p>
                        <p className={step === 2 ? "font-bold text-white underline" : ""}>{t("Step 2: Credentials and access")}</p>
                        <p className={step === 3 ? "font-bold text-white underline" : ""}>{t("Step 3: Identity Verification (KYC)")}</p>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 h-1.5 rounded-full bg-slate-200">
                        <motion.div
                            initial={{ width: '33%' }}
                            animate={{ width: `${step === 1 ? 33 : step === 2 ? 66 : 100}%` }}
                            className="h-full rounded-full bg-indigo-600"
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        <form onSubmit={handleSubmit} className="space-y-4" key={step}>
                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">{t("Shop name")}</label>
                                        <div className="relative">
                                            <Store size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="text"
                                                required
                                                value={formData.shopName}
                                                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                                                placeholder={t("Your shop name")}
                                                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">{t("Owner name")}</label>
                                        <div className="relative">
                                            <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="text"
                                                required
                                                value={formData.ownerName}
                                                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                                placeholder={t("Full name")}
                                                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[1.25rem] bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                                    >
                                        {t("Continue")}
                                        <ArrowRight size={16} />
                                    </button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">{t("Email")}</label>
                                            <div className="relative">
                                                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                                    placeholder={t("you@shop.com")}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">{t("Phone")}</label>
                                            <div className="relative">
                                                <Phone size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                <input
                                                    type="tel"
                                                    required
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                                    placeholder={t("+91...")}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">{t("Password")}</label>
                                            <div className="relative">
                                                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                <input
                                                    type="password"
                                                    required
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                                    placeholder={t("Create password")}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">{t("Confirm password")}</label>
                                            <div className="relative">
                                                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                <input
                                                    type="password"
                                                    required
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                                    placeholder={t("Repeat password")}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">{t("4-digit mPIN")}</label>
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
                                            className="inline-flex h-11 items-center justify-center rounded-[1.25rem] border border-slate-300 text-slate-700 transition-colors hover:bg-slate-100"
                                        >
                                            <ArrowLeft size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-[1.25rem] bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                                        >
                                            {t("Continue")}
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                                    <div className="flex flex-col items-center justify-center p-6 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-500/20 mb-4">
                                        <ShieldCheck size={40} className="text-indigo-600 mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{t("Identity Verification Required")}</p>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">{t("Aadhar Card Number")}</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.aadharNumber}
                                            onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                                            placeholder={t("12-digit Aadhar Number")}
                                            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t("Aadhar Front")}</p>
                                            <div className="relative group aspect-[4/3] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex flex-col items-center justify-center gap-2 transition-all hover:border-indigo-500/50 cursor-pointer">
                                                {formData.aadharFront ? (
                                                    <img src={formData.aadharFront} alt="Front" className="w-full h-full object-cover" />
                                                ) : (
                                                    <>
                                                        <Upload size={20} className="text-slate-400 group-hover:text-indigo-600" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t("Upload")}</span>
                                                    </>
                                                )}
                                                <input type="file" accept="image/*" onChange={(e) => uploadToCloudinary(e.target.files[0], 'front')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                {uploading.front && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 size={16} className="animate-spin text-indigo-600" /></div>}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t("Aadhar Back")}</p>
                                            <div className="relative group aspect-[4/3] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex flex-col items-center justify-center gap-2 transition-all hover:border-indigo-500/50 cursor-pointer">
                                                {formData.aadharBack ? (
                                                    <img src={formData.aadharBack} alt="Back" className="w-full h-full object-cover" />
                                                ) : (
                                                    <>
                                                        <Upload size={20} className="text-slate-400 group-hover:text-indigo-600" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t("Upload")}</span>
                                                    </>
                                                )}
                                                <input type="file" accept="image/*" onChange={(e) => uploadToCloudinary(e.target.files[0], 'back')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                {uploading.back && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 size={16} className="animate-spin text-indigo-600" /></div>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-[44px_1fr] gap-2">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="inline-flex h-11 items-center justify-center rounded-[1.25rem] border border-slate-300 text-slate-700 transition-colors hover:bg-slate-100"
                                        >
                                            <ArrowLeft size={16} />
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || uploading.front || uploading.back}
                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-[1.25rem] bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                                        >
                                            {loading ? <Loader2 size={18} className="animate-spin" /> : t("Complete Registration")}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </form>
                    </AnimatePresence>

                    <p className="mt-4 text-center text-sm text-slate-500">
                        {t("Already have an account?")}{' '}
                        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                            {t("Login")}
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
};

export default Register;
