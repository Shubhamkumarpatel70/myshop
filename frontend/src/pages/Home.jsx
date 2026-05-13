import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, TrendingUp, Shield, Smartphone, ArrowRight, BarChart2, Package, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
    const features = [
        {
            icon: <Package className="w-6 h-6 text-primary-600" />,
            title: "Inventory Tracking",
            description: "Real-time tracking of products, categories, and stock levels with automated alerts."
        },
        {
            icon: <TrendingUp className="w-6 h-6 text-accent-600" />,
            title: "Sales Analytics",
            description: "Detailed insights into your revenue, sales trends, and top-performing products."
        },
        {
            icon: <Shield className="w-6 h-6 text-primary-600" />,
            title: "Secure Access",
            description: "Role-based access control and secure JWT authentication for your staff."
        },
        {
            icon: <Smartphone className="w-6 h-6 text-accent-600" />,
            title: "Mobile Ready",
            description: "Manage your business on the go with our fully responsive mobile interface."
        },
        {
            icon: <BarChart2 className="w-6 h-6 text-primary-600" />,
            title: "Smart Reports",
            description: "Generate PDF and Excel reports for sales and inventory with a single click."
        },
        {
            icon: <Layers className="w-6 h-6 text-accent-600" />,
            title: "Multi-Business",
            description: "Tailored for various business types including Medical, Hardware, and Grocery stores."
        }
    ];

    const businessTypes = [
        "Medical Store", "Hardware Store", "Grocery Store", "Electronics Store", "Clothing Store", "General Store"
    ];

    return (
        <div className="overflow-hidden">
            {/* Hero Section */}
            <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-bold mb-8"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                            </span>
                            Trusted by 500+ Small Businesses
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8"
                        >
                            Smart Inventory for <br />
                            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Growing Businesses</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="max-w-2xl mx-auto text-xl text-secondary-500 dark:text-secondary-400 mb-10"
                        >
                            Streamline your operations, reduce waste, and increase profits with StockSaathi's intelligent inventory management system.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            <Link to="/register" className="btn btn-primary px-8 py-4 text-lg">
                                Start Your Free Trial <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link to="/about" className="btn btn-secondary px-8 py-4 text-lg">
                                See How It Works
                            </Link>
                        </motion.div>
                    </div>
                </div>
                
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-300 rounded-full blur-[128px] animate-pulse"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-300 rounded-full blur-[128px] animate-pulse"></div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-secondary-50 dark:bg-secondary-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything You Need</h2>
                        <p className="text-secondary-500 dark:text-secondary-400">Powerful features to help you manage your shop efficiently.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="card hover:shadow-lg hover:-translate-y-1 transition-all"
                            >
                                <div className="mb-6">{feature.icon}</div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-secondary-500 dark:text-secondary-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Business Types Section */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Tailored for Your Business</h2>
                        <p className="text-secondary-500">Whatever you sell, we've got you covered.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                        {businessTypes.map((type, index) => (
                            <span key={index} className="px-6 py-3 bg-white dark:bg-secondary-900 rounded-full border border-secondary-200 dark:border-secondary-800 shadow-sm font-medium">
                                {type}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden bg-primary-600 rounded-[2.5rem] p-12 md:p-24 text-center text-white">
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-6xl font-extrabold mb-8">Ready to Transform Your Shop?</h2>
                            <p className="text-xl text-primary-100 mb-12 max-w-2xl mx-auto">
                                Join hundreds of shop owners who are saving hours every week on inventory management.
                            </p>
                            <Link to="/register" className="inline-flex items-center gap-2 px-10 py-5 bg-white text-primary-600 rounded-2xl font-bold text-xl hover:bg-primary-50 transition-colors">
                                Get Started Now <ArrowRight className="w-6 h-6" />
                            </Link>
                        </div>
                        {/* Abstract Decorations */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
