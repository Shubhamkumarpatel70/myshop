import React from 'react';
import { ShoppingBag, Mail, Phone, MapPin, Share2, Globe, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-secondary-950 border-t border-secondary-200 dark:border-secondary-900 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="bg-primary-600 p-1.5 rounded-lg">
                                <ShoppingBag className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">MY <span className="text-primary-600">SHOP</span></span>
                        </Link>
                        <p className="text-secondary-500 dark:text-secondary-400 leading-relaxed">
                            Smart inventory management for small businesses. Simplify your workflow, track stock efficiently, and grow your business with MY SHOP.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="p-2 bg-secondary-100 dark:bg-secondary-900 rounded-lg hover:bg-primary-600 hover:text-white transition-all"><MessageCircle className="w-5 h-5" /></a>
                            <a href="#" className="p-2 bg-secondary-100 dark:bg-secondary-900 rounded-lg hover:bg-primary-600 hover:text-white transition-all"><Share2 className="w-5 h-5" /></a>
                            <a href="#" className="p-2 bg-secondary-100 dark:bg-secondary-900 rounded-lg hover:bg-primary-600 hover:text-white transition-all"><Globe className="w-5 h-5" /></a>
                            <a href="#" className="p-2 bg-secondary-100 dark:bg-secondary-900 rounded-lg hover:bg-primary-600 hover:text-white transition-all"><LinkIcon className="w-5 h-5" /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-bold mb-6">Quick Links</h4>
                        <ul className="space-y-4">
                            <li><Link to="/" className="text-secondary-500 hover:text-primary-600 transition-colors">Home</Link></li>
                            <li><Link to="/about" className="text-secondary-500 hover:text-primary-600 transition-colors">About Us</Link></li>
                            <li><Link to="/contact" className="text-secondary-500 hover:text-primary-600 transition-colors">Contact</Link></li>
                            <li><Link to="/login" className="text-secondary-500 hover:text-primary-600 transition-colors">Login</Link></li>
                            <li><Link to="/register" className="text-secondary-500 hover:text-primary-600 transition-colors">Register</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-lg font-bold mb-6">Support</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-secondary-500 hover:text-primary-600 transition-colors">Documentation</a></li>
                            <li><a href="#" className="text-secondary-500 hover:text-primary-600 transition-colors">Help Center</a></li>
                            <li><a href="#" className="text-secondary-500 hover:text-primary-600 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="text-secondary-500 hover:text-primary-600 transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="text-secondary-500 hover:text-primary-600 transition-colors">FAQ</a></li>
                        </ul>
                    </div>

                    {/* Contact Details */}
                    <div>
                        <h4 className="text-lg font-bold mb-6">Contact Us</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-secondary-500">
                                <MapPin className="w-5 h-5 text-primary-600 flex-shrink-0" />
                                <span>123 Business Avenue, Suite 100, Tech City, 54321</span>
                            </li>
                            <li className="flex items-center gap-3 text-secondary-500">
                                <Phone className="w-5 h-5 text-primary-600 flex-shrink-0" />
                                <span>+1 (234) 567-890</span>
                            </li>
                            <li className="flex items-center gap-3 text-secondary-500">
                                <Mail className="w-5 h-5 text-primary-600 flex-shrink-0" />
                                <span>support@myshop.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-secondary-100 dark:border-secondary-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-secondary-400 text-sm">
                        &copy; {new Date().getFullYear()} MY SHOP. All rights reserved.
                    </p>
                    <p className="text-secondary-400 text-sm flex items-center gap-1">
                        Made with <span className="text-red-500">&hearts;</span> for small businesses.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
