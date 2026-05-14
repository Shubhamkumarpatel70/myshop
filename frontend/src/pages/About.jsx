import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Layers3, ShieldCheck, Users } from 'lucide-react';

const About = () => {
    const pillars = [
        {
            icon: <Layers3 className="h-6 w-6 text-indigo-600" />,
            title: 'Unified Retail Stack',
            description: 'Billing, inventory, customer tracking, and reporting work together in one platform.',
        },
        {
            icon: <ShieldCheck className="h-6 w-6 text-indigo-600" />,
            title: 'Operational Reliability',
            description: 'Built with role-based access and robust workflows to support daily store operations.',
        },
        {
            icon: <BarChart3 className="h-6 w-6 text-indigo-600" />,
            title: 'Actionable Insights',
            description: 'Clear dashboards help you make faster decisions on stock, sales, and profitability.',
        },
    ];

    return (
        <main className="overflow-x-hidden bg-slate-50 pb-20 pt-32 text-slate-900 dark:bg-[#020617] dark:text-white">
            <section className="relative mx-auto max-w-7xl px-4 sm:px-6">
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-indigo-500/12 blur-3xl" />
                    <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
                </div>

                <div className="mx-auto max-w-3xl text-center">
                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center rounded-full border border-indigo-100 bg-white px-4 py-2 text-xs font-semibold text-indigo-700 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                    >
                        About StockSaathi
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-5 font-outfit text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl"
                    >
                        Built to help retail teams run faster and smarter every day
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300"
                    >
                        StockSaathi was created for businesses that have outgrown manual processes and disconnected tools. We focus on practical workflows that reduce errors, save time, and improve decision-making.
                    </motion.p>
                </div>

                <div className="mt-14 grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 lg:grid-cols-2 lg:p-10">
                    <div>
                        <h2 className="font-outfit text-2xl font-bold tracking-tight sm:text-3xl">Our mission</h2>
                        <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
                            Enable every store owner to operate with confidence through real-time visibility, reliable controls, and simple team collaboration.
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                                <p className="text-2xl font-bold">1 Platform</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">For billing + inventory + reports</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                                <p className="text-2xl font-bold">Multi-user</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Owner, manager, cashier roles</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
                        <div className="flex items-center gap-2 text-indigo-300">
                            <Users className="h-5 w-5" />
                            <p className="text-sm font-semibold">Customer-first product direction</p>
                        </div>
                        <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                            We continuously improve the product around real retail use cases: faster checkouts, cleaner stock flow, and clearer business reporting.
                        </p>
                        <Link to="/contact" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100">
                            Talk to the team
                            <ArrowRight size={15} />
                        </Link>
                    </div>
                </div>

                <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {pillars.map((pillar, index) => (
                        <motion.article
                            key={pillar.title}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                            viewport={{ once: true }}
                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                        >
                            <div className="mb-4 inline-flex rounded-xl bg-indigo-50 p-3 dark:bg-indigo-500/15">{pillar.icon}</div>
                            <h3 className="font-outfit text-xl font-bold tracking-tight">{pillar.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{pillar.description}</p>
                        </motion.article>
                    ))}
                </div>
            </section>
        </main>
    );
};

export default About;
