import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Mail, User, MessageSquare, Clock, CheckCircle2, AlertCircle, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminQueries = () => {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        fetchQueries();
    }, []);

    const fetchQueries = async () => {
        try {
            const res = await api.get('/queries');
            setQueries(res.data.data);
        } catch (error) {
            toast.error("Failed to load queries");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const res = await api.patch(`/queries/${id}`, { status: newStatus });
            if (res.data.success) {
                toast.success(`Status updated to ${newStatus}`);
                setQueries(queries.map(q => q._id === id ? { ...q, status: newStatus } : q));
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const filteredQueries = queries.filter(q => {
        const matchesSearch = q.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             q.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             q.subject.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Inquiries...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Customer Inquiries</h1>
                    <p className="text-sm text-slate-500 font-medium">Manage and respond to contact form submissions.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                        <input 
                            type="text"
                            placeholder="Search name, email, subject..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
                        {['All', 'Pending', 'Resolved'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    statusFilter === status 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Queries Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredQueries.length > 0 ? filteredQueries.map((query) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={query._id}
                            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{query.name}</h3>
                                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                            <Mail size={12} /> {query.email}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                    query.status === 'Resolved' 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                    {query.status}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare size={14} className="text-indigo-600" />
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Subject</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{query.subject}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                                        {query.message}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Clock size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">
                                            {new Date(query.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        {query.status !== 'Resolved' ? (
                                            <button 
                                                onClick={() => handleStatusUpdate(query._id, 'Resolved')}
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                                            >
                                                <CheckCircle2 size={14} /> Mark Resolved
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleStatusUpdate(query._id, 'Pending')}
                                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                            >
                                                <AlertCircle size={14} /> Reopen
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                                <MessageSquare size={32} />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tight">No inquiries found</h3>
                            <p className="text-slate-500 text-sm mt-1">Queries from the contact form will appear here.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminQueries;
