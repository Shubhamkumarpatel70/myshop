import React from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    BarChart3,
    CheckCircle2,
    Clock3,
    Globe2,
    ScanLine,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Users2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
    const features = [
        {
            icon: <ScanLine className="h-6 w-6 text-indigo-600" />,
            title: 'Inventory Intelligence',
            description: 'Track stock movement in real time and receive low-stock recommendations before shelf-outs happen.',
        },
        {
            icon: <BarChart3 className="h-6 w-6 text-indigo-600" />,
            title: 'Revenue Analytics',
            description: 'Daily sales, margin, and top-SKU performance in one place with export-ready reports.',
        },
        {
            icon: <ShieldCheck className="h-6 w-6 text-indigo-600" />,
            title: 'Role-Based Access',
            description: 'Owner, manager, and cashier permissions so every user sees only what they need.',
        },
        {
            icon: <Globe2 className="h-6 w-6 text-indigo-600" />,
            title: 'Multi-Store Sync',
            description: 'Operate multiple outlets from a single dashboard with live updates across branches.',
        },
        {
            icon: <Clock3 className="h-6 w-6 text-indigo-600" />,
            title: 'Fast Billing Flow',
            description: 'Checkout screens are optimized for speed with keyboard-first input and barcode support.',
        },
        {
            icon: <Users2 className="h-6 w-6 text-indigo-600" />,
            title: 'Customer Insights',
            description: 'Build repeat business with customer history, purchase trends, and targeted follow-ups.',
        },
    ];

    const highlights = [
        { value: '99.9%', label: 'Uptime' },
        { value: '< 2s', label: 'Checkout Speed' },
        { value: '30+', label: 'Business Reports' },
        { value: '24/7', label: 'Cloud Access' },
    ];

    return (
        <main className="overflow-x-hidden bg-slate-50 text-slate-900 transition-colors duration-500 dark:bg-[#020617] dark:text-white">
            <section className="relative pt-32 sm:pt-36">
                <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:pb-24">
                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-xs font-semibold text-indigo-700 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                        >
                            <Sparkles className="h-4 w-4" />
                            Trusted by growing retail teams
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="font-outfit text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white"
                        >
                            Professional POS & inventory software built for modern stores
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300"
                        >
                            Manage billing, stock, teams, and reports from one platform. Designed for fast daily operations and long-term scalability.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col gap-3 sm:flex-row"
                        >
                            <Link
                                to="/register"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(79,70,229,0.35)] transition-colors hover:bg-indigo-700"
                            >
                                Start Free Trial
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                to="/pricing"
                                className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                            >
                                View Pricing
                            </Link>
                        </motion.div>

                        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
                            {highlights.map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-900"
                                >
                                    <p className="font-outfit text-xl font-bold text-slate-900 dark:text-white">{item.value}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900 sm:p-6"
                    >
                        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                                    <ShoppingBag className="h-4 w-4" />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Today&apos;s Summary</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Live store performance</p>
                                </div>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                Live
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Sales</p>
                                    <p className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">$12,640</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Orders</p>
                                    <p className="font-outfit text-2xl font-bold text-slate-900 dark:text-white">286</p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Stock Health</p>
                                    <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">93%</p>
                                </div>
                                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div className="h-full w-[93%] rounded-full bg-indigo-600" />
                                </div>
                            </div>

                            <ul className="space-y-2 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                                {['Low stock alerts: 4', 'Pending invoices: 6', 'Cashier shifts active: 9'].map((item) => (
                                    <li key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                </div>

                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -left-24 top-16 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
                    <div className="absolute -right-24 top-28 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
                </div>
            </section>

            <section className="border-y border-slate-200/70 bg-white py-16 dark:border-slate-800 dark:bg-slate-950/30 sm:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="mb-10 flex flex-col justify-between gap-6 sm:mb-12 lg:flex-row lg:items-end">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Capabilities</p>
                            <h2 className="mt-2 font-outfit text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                Everything your store needs in one workflow
                            </h2>
                        </div>
                        <p className="max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            Replace disconnected tools with one reliable stack for billing, stock, and reporting.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, index) => (
                            <motion.article
                                key={feature.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.06 }}
                                viewport={{ once: true, margin: '-60px' }}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:p-6"
                            >
                                <div className="mb-4 inline-flex rounded-xl bg-indigo-50 p-3 dark:bg-indigo-500/15">
                                    {feature.icon}
                                </div>
                                <h3 className="mb-2 font-outfit text-xl font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{feature.description}</p>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16 sm:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.35)] sm:p-10 lg:p-14"
                    >
                        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                            <div>
                                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">Get Started</p>
                                <h2 className="font-outfit text-3xl font-bold tracking-tight sm:text-4xl">
                                    Launch your digital retail operation in days, not months
                                </h2>
                                <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base">
                                    Move from spreadsheets and manual billing to a reliable system with clear visibility and real-time control.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Link
                                    to="/register"
                                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
                                >
                                    Create Account
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    to="/contact"
                                    className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-white/30 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                                >
                                    Talk to Sales
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
};

export default Home;
