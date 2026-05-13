import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, MessageSquare, Send, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Contact = () => {
    const handleSubmit = (e) => {
        e.preventDefault();
        toast.success("Message sent! We'll get back to you soon.");
        e.target.reset();
    };

    return (
        <div className="pt-20 pb-32">
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6">Get in Touch</h1>
                    <p className="text-xl text-secondary-500 max-w-2xl mx-auto">
                        Have questions about StockSaathi? Our team is here to help you scale your business.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div className="flex gap-6">
                            <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center text-primary-600 flex-shrink-0">
                                <Mail size={28} />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold">Email Us</h4>
                                <p className="text-secondary-500">support@myshop.com</p>
                                <p className="text-secondary-500">sales@myshop.com</p>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="w-14 h-14 bg-accent-50 dark:bg-accent-900/20 rounded-2xl flex items-center justify-center text-accent-600 flex-shrink-0">
                                <Phone size={28} />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold">Call Us</h4>
                                <p className="text-secondary-500">+1 (234) 567-890</p>
                                <p className="text-secondary-500">Mon-Fri, 9am - 6pm</p>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center text-primary-600 flex-shrink-0">
                                <MapPin size={28} />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold">Visit Us</h4>
                                <p className="text-secondary-500">123 Business Avenue, Suite 100</p>
                                <p className="text-secondary-500">Tech City, 54321</p>
                            </div>
                        </div>

                        <div className="card mt-12 bg-secondary-900 text-white border-none">
                            <div className="flex gap-4 mb-4">
                                <HelpCircle className="text-primary-400" />
                                <h4 className="font-bold">Need instant help?</h4>
                            </div>
                            <p className="text-secondary-400 text-sm mb-6">
                                Check our documentation for quick answers to common questions.
                            </p>
                            <button className="text-sm font-bold text-primary-400 hover:underline">
                                Browse Help Center →
                            </button>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-2 card shadow-2xl"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Full Name</label>
                                    <input type="text" required className="input-field" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Email Address</label>
                                    <input type="email" required className="input-field" placeholder="john@example.com" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Subject</label>
                                <input type="text" required className="input-field" placeholder="How can we help?" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Message</label>
                                <textarea required className="input-field h-40 pt-4" placeholder="Tell us more about your business needs..."></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary w-full py-4 text-lg font-bold">
                                Send Message <Send size={20} />
                            </button>
                        </form>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
