import React, { useState } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { 
    Send, Megaphone, ShieldCheck, 
    AlertCircle, Info, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const Broadcast = () => {
    const [formData, setFormData] = useState({ title: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/notifications/broadcast', formData);
            toast.success("Broadcast sent to all users!");
            setFormData({ title: '', message: '' });
        } catch (error) {
            toast.error("Failed to send broadcast");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-primary-100 dark:bg-primary-900/30 rounded-2xl text-primary-600 mb-4">
                    <Megaphone size={32} />
                </div>
                <h1 className="text-4xl font-black tracking-tight">Broadcast Center</h1>
                <p className="text-secondary-500 mt-2">Send urgent announcements or platform updates to all shop owners and staff members.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-secondary-900 p-8 rounded-[2.5rem] shadow-xl border border-secondary-100 dark:border-secondary-800 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-secondary-700 dark:text-secondary-300 ml-1">Announcement Title</label>
                            <input 
                                type="text" 
                                required
                                placeholder="e.g. Scheduled Maintenance or New Feature!"
                                className="input-field"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-secondary-700 dark:text-secondary-300 ml-1">Message Content</label>
                            <textarea 
                                required
                                rows="6"
                                placeholder="Write your announcement here..."
                                className="input-field py-4"
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                            ></textarea>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full btn btn-primary py-4 rounded-2xl text-lg font-black flex items-center justify-center gap-3 shadow-xl shadow-primary-500/30 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {loading ? "Sending..." : (
                                <>
                                    <Send size={20} /> Send Platform Broadcast
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl">
                        <div className="flex items-center gap-3 text-amber-600 mb-3">
                            <AlertCircle size={20} />
                            <h4 className="font-bold">Guidelines</h4>
                        </div>
                        <ul className="text-xs text-amber-800 dark:text-amber-400 space-y-2 list-disc ml-4">
                            <li>Keep messages clear and concise.</li>
                            <li>Broadcasts appear on all user dashboards.</li>
                            <li>Use for critical updates only.</li>
                        </ul>
                    </div>

                    <div className="p-6 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-3xl">
                        <div className="flex items-center gap-3 text-primary-600 mb-3">
                            <ShieldCheck size={20} />
                            <h4 className="font-bold">Security</h4>
                        </div>
                        <p className="text-xs text-primary-800 dark:text-primary-400">
                            Only administrators can access this center. All broadcasts are logged for security auditing.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Broadcast;
