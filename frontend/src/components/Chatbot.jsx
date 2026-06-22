import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MessageSquare, X, Send, Sparkles, 
    Zap, Package, Clock, ShieldCheck, 
    ArrowRight, Bot, User, HelpCircle
} from 'lucide-react';

const Chatbot = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { 
            id: 1, 
            type: 'bot', 
            text: `Hello ${user?.ownerName || 'Partner'}! I'm your StockSaathi AI Assistant. How can I help optimize your shop operations today?`,
            time: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    const suggestions = [
        { label: 'How to add products?', icon: <Package size={14} /> },
        { label: 'What is Barcode Booster?', icon: <Zap size={14} /> },
        { label: 'How to close shift?', icon: <Clock size={14} /> },
        { label: 'Security features?', icon: <ShieldCheck size={14} /> }
    ];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (text) => {
        if (!text.trim()) return;

        const newUserMessage = {
            id: Date.now(),
            type: 'user',
            text: text,
            time: new Date()
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');
        setIsTyping(true);

        // Simulate AI Response Logic
        setTimeout(() => {
            let responseText = "I'm analyzing your request... As an AI Assistant, I can help you with inventory, sales tracking, and platform features. Could you be more specific?";
            
            const lowerText = text.toLowerCase();
            if (lowerText.includes('product') || lowerText.includes('add')) {
                responseText = "To add a product, go to the 'Inventory' tab and click 'New Product'. You can also use our 'Vision Uplink' to scan barcodes and auto-fill details!";
            } else if (lowerText.includes('barcode') || lowerText.includes('booster')) {
                responseText = "The Barcode Booster is a premium add-on that enables global product identification. It pre-fills details like name and image just by scanning the barcode!";
            } else if (lowerText.includes('shift')) {
                responseText = "You can manage shifts in the 'Shifts' section. Make sure to 'Open Drawer' at the start of the day and 'Reconcile' at the end to keep your cash registry accurate.";
            } else if (lowerText.includes('security') || lowerText.includes('privacy')) {
                responseText = "StockSaathi uses enterprise-grade encryption. You can also toggle 'Privacy Mode' (Shield icon) in the top bar to blur sensitive financial data on your screen.";
            } else if (lowerText.includes('hello') || lowerText.includes('hi')) {
                responseText = `Hi ${user?.ownerName}! Ready to grow your ${user?.shopName || 'business'} today?`;
            }

            const botResponse = {
                id: Date.now() + 1,
                type: 'bot',
                text: responseText,
                time: new Date()
            };

            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div className="fixed bottom-24 right-6 z-[100] lg:bottom-6 lg:right-6">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="mb-4 w-[calc(100vw-3rem)] sm:w-[400px] h-[550px] max-h-[70vh] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 bg-indigo-600 text-white flex items-center justify-between relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/30">
                                    <Bot size={22} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-tight">StockSaathi AI</h3>
                                    <div className="flex items-center gap-1.5 opacity-80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Active & Ready</p>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="relative z-10 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all"
                            >
                                <X size={20} />
                            </button>
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                        </div>

                        {/* Messages Area */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
                        >
                            {messages.map((msg) => (
                                <div 
                                    key={msg.id}
                                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex gap-3 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${msg.type === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            {msg.type === 'user' ? <User size={14} /> : <Bot size={14} />}
                                        </div>
                                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                            msg.type === 'user' 
                                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10' 
                                                : 'bg-slate-50 dark:bg-slate-800 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-800/50'
                                        }`}>
                                            {msg.text}
                                            <p className={`text-[9px] mt-2 font-bold uppercase opacity-50 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                                                {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <Bot size={14} className="text-slate-500" />
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800/50 flex gap-1">
                                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Suggestions */}
                        {messages.length < 5 && (
                            <div className="px-6 py-4 flex flex-wrap gap-2 border-t border-slate-50 dark:border-slate-800/50">
                                {suggestions.map((s, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleSend(s.label)}
                                        className="px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 rounded-xl transition-all flex items-center gap-2"
                                    >
                                        {s.icon} {s.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-6 pt-0">
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend(inputValue);
                                }}
                                className="relative group"
                            >
                                <input 
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Type your query..."
                                    className="w-full h-14 pl-6 pr-14 rounded-[1.25rem] bg-slate-50 dark:bg-slate-800 border-none outline-none text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 transition-all dark:text-white"
                                />
                                <button 
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-90 disabled:opacity-50"
                                    disabled={!inputValue.trim() || isTyping}
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                            <p className="text-[9px] text-center mt-4 font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-600">Powered by StockSaathi Intelligence</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all duration-300 ${
                    isOpen ? 'bg-slate-900 rotate-90' : 'bg-indigo-600 hover:shadow-indigo-500/40'
                }`}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white dark:border-slate-900"></span>
                    </span>
                )}
            </motion.button>
        </div>
    );
};

export default Chatbot;
