import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Contact = () => {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        setLoading(true);
        try {
            const res = await api.post('/queries', data);
            if (res.data.success) {
                toast.success('Message sent. Our team will contact you soon.');
                e.target.reset();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="overflow-x-hidden bg-slate-50 pb-20 pt-32 text-slate-900 dark:bg-[#020617] dark:text-white">
            <section className="relative mx-auto max-w-7xl px-4 sm:px-6">
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-indigo-500/12 blur-3xl" />
                    <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
                </div>

                <div className="mx-auto max-w-3xl text-center">
                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex rounded-full border border-indigo-100 bg-white px-4 py-2 text-xs font-semibold text-indigo-700 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                    >
                        Contact Us
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-5 font-outfit text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl"
                    >
                        Reach our support and sales team
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300"
                    >
                        Tell us about your requirement, and we will help you with onboarding, pricing, or product setup.
                    </motion.p>
                </div>

                <div className="mt-14 grid gap-6 lg:grid-cols-12">
                    <div className="space-y-4 lg:col-span-5">
                        {[
                            { icon: <Mail className="h-5 w-5 text-indigo-600" />, title: 'Email', value: 'support@stocksaathi.com' },
                            { icon: <Phone className="h-5 w-5 text-indigo-600" />, title: 'Phone', value: '+91 90000 00000' },
                            { icon: <MapPin className="h-5 w-5 text-indigo-600" />, title: 'Address', value: 'Mumbai, India' },
                        ].map((item) => (
                            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
                                <div className="mb-3 inline-flex rounded-xl bg-indigo-50 p-2.5 dark:bg-indigo-500/15">{item.icon}</div>
                                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{item.title}</h3>
                                <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{item.value}</p>
                            </div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-7"
                    >
                        <form
                            onSubmit={handleSubmit}
                            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                        placeholder="you@company.com"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Subject</label>
                                <input
                                    type="text"
                                    name="subject"
                                    required
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                    placeholder="What can we help with?"
                                />
                            </div>

                            <div className="mt-4">
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Message</label>
                                <textarea
                                    name="message"
                                    required
                                    rows={6}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                    placeholder="Share your requirements..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        Send Message
                                        <Send size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </section>
        </main>
    );
};

export default Contact;
