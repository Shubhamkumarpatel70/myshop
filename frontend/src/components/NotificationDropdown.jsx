import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Trash2, Info, AlertTriangle, ShoppingCart, Megaphone, Clock } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Native date formatter
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

import { requestNotificationPermission, showBrowserNotification } from '../utils/pushNotification';

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get('/notifications');
            const newNotifications = res.data.data;
            
            // Check for brand new unread notifications to trigger Browser Push
            const lastNotifId = localStorage.getItem('last_notification_id');
            const unread = newNotifications.filter(n => !n.isRead);
            
            if (unread.length > 0 && unread[0]._id !== lastNotifId) {
                const latest = unread[0];
                showBrowserNotification(latest.title, latest.message);
                localStorage.setItem('last_notification_id', latest._id);
            }

            setNotifications(newNotifications);
        } catch (error) {
            console.error("Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        requestNotificationPermission();
        fetchNotifications();
        // Refresh every 30 seconds for live feel
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            toast.success("All caught up!");
        } catch (error) {
            toast.error("Action failed");
        }
    };

    const markRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            toast.error("Failed to mark as read");
        }
    };

    const deleteNotif = async (id, e) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(notifications.filter(n => n._id !== id));
            toast.success("Notification removed");
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getIcon = (type) => {
        switch (type) {
            case 'Stock': return <AlertTriangle size={16} className="text-amber-500" />;
            case 'Expiry': return <Clock size={16} className="text-red-500" />;
            case 'Sale': return <ShoppingCart size={16} className="text-emerald-500" />;
            case 'Broadcast': return <Megaphone size={16} className="text-primary-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-3.5 right-3.5 w-4 h-4 bg-indigo-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40 lg:bg-transparent bg-slate-950/20 backdrop-blur-sm lg:backdrop-blur-0" onClick={() => setIsOpen(false)}></div>
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 400 }}
                            className="fixed md:absolute right-4 md:right-0 left-4 md:left-auto top-24 md:top-auto mt-0 md:mt-3 w-auto md:w-[28rem] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_120px_rgba(0,0,0,0.25)] border border-white/20 dark:border-slate-800 z-50 overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight">Notifications</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{unreadCount} Unread Messages</p>
                                </div>
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={markAllRead}
                                        className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-xl transition-all"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {loading && notifications.length === 0 ? (
                                    <div className="p-10 text-center text-slate-400">Loading...</div>
                                ) : notifications.length > 0 ? (
                                    <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {notifications.map((notif) => (
                                            <div 
                                                key={notif._id}
                                                onClick={() => markRead(notif._id)}
                                                className={`p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer relative group ${!notif.isRead ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}
                                            >
                                                <div className="flex gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                        notif.type === 'Expiry' ? 'bg-red-100 dark:bg-red-900/20' : 
                                                        notif.type === 'Stock' ? 'bg-amber-100 dark:bg-amber-900/20' :
                                                        'bg-slate-100 dark:bg-slate-800'
                                                    }`}>
                                                        {getIcon(notif.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <h4 className={`text-sm font-bold truncate ${!notif.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                                                {notif.title}
                                                            </h4>
                                                            <span className="text-[9px] font-bold text-slate-400 shrink-0">
                                                                {formatDate(notif.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                            {notif.message}
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={(e) => deleteNotif(notif._id, e)}
                                                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                {!notif.isRead && (
                                                    <div className="absolute top-5 right-5 w-2 h-2 bg-indigo-500 rounded-full"></div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-200">
                                            <Bell size={32} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">All Caught Up!</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">No new notifications</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-center">
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="text-[10px] font-black uppercase text-slate-500 hover:text-indigo-600 transition-all"
                                >
                                    Close Panel
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationDropdown;
