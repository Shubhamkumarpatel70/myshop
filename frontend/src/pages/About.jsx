import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Users, Zap, CheckCircle2 } from 'lucide-react';

const About = () => {
    return (
        <div className="pt-20 pb-32">
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-extrabold mb-6"
                    >
                        Empowering Small Businesses <br />
                        <span className="text-primary-600 font-black">With Smart Technology</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-secondary-500 max-w-3xl mx-auto"
                    >
                        StockSaathi was born out of a simple mission: to give small shop owners the same powerful tools that big retail chains use, without the complexity or high costs.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl font-bold mb-6">Why We Started</h2>
                        <p className="text-secondary-500 leading-relaxed mb-6">
                            Running a small business is hard. Between managing stock, tracking sales, and dealing with suppliers, shop owners often find themselves overwhelmed by manual paperwork.
                        </p>
                        <p className="text-secondary-500 leading-relaxed mb-8">
                            We saw local medical stores, grocery shops, and clothing boutiques struggling with expired stock and lost revenue simply because they didn't have an easy way to track their inventory.
                        </p>
                        <div className="space-y-4">
                            {[
                                "Built for non-technical users",
                                "Focused on affordability",
                                "Designed for real-world shop workflows",
                                "Always accessible, everywhere"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={20} />
                                    <span className="font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="aspect-square bg-primary-600 rounded-[3rem] rotate-3 absolute inset-0 -z-10 opacity-10 scale-105"></div>
                        <div className="bg-white dark:bg-secondary-900 p-12 rounded-[3rem] shadow-2xl border border-secondary-100 dark:border-secondary-800">
                            <Zap className="text-primary-600 w-12 h-12 mb-6" />
                            <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                            <p className="text-secondary-500 leading-relaxed">
                                To be the operating system for small businesses globally, helping them transition from manual entries to automated success.
                            </p>
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="card text-center p-10">
                        <Shield className="w-10 h-10 text-primary-600 mx-auto mb-6" />
                        <h4 className="text-xl font-bold mb-3">Security First</h4>
                        <p className="text-secondary-500">Your data is encrypted and backed up daily. You are in control of who sees your business numbers.</p>
                    </div>
                    <div className="card text-center p-10">
                        <Users className="w-10 h-10 text-accent-600 mx-auto mb-6" />
                        <h4 className="text-xl font-bold mb-3">Community Driven</h4>
                        <p className="text-secondary-500">We listen to our users. Most of our features are requested by real shop owners like you.</p>
                    </div>
                    <div className="card text-center p-10">
                        <Target className="w-10 h-10 text-primary-600 mx-auto mb-6" />
                        <h4 className="text-xl font-bold mb-3">100% Focused</h4>
                        <p className="text-secondary-500">We don't do everything. We just do inventory and sales management better than anyone else.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
