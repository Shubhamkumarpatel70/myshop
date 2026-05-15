import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Trash2, Info, AlertTriangle, ShoppingCart, Megaphone, Clock, ShieldAlert } from 'lucide-react';
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

    const getTypeStyles = (type) => {
        switch (type) {
            case 'Stock': return { 
                icon: <AlertTriangle size={16} />, 
                bg: 'bg-amber-50 text-amber-600 border-amber-100',
                label: 'Stock Alert'
            };
            case 'Expiry': return { 
                icon: <Clock size={16} />, 
                bg: 'bg-rose-50 text-rose-600 border-rose-100',
                label: 'Expiry Warning'
            };
            case 'Sale': return { 
                icon: <ShoppingCart size={16} />, 
                bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                label: 'New Sale'
            };
            case 'Broadcast': return { 
                icon: <Megaphone size={16} />, 
                bg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                label: 'Announcement'
            };
            default: return { 
                icon: <ShieldAlert size={16} />, 
                bg: 'bg-slate-50 text-slate-600 border-slate-100',
                label: 'System'
            };
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-[1.25rem] transition-all"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950 shadow-sm">
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
                            className="fixed md:absolute right-4 md:right-0 left-4 md:left-auto top-4 md:top-auto md:mt-4 w-[calc(100%-2rem)] md:w-[32rem] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[1.25rem] shadow-[0_40px_120px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-800 z-50 overflow-hidden flex flex-col h-[calc(100vh-2rem)] md:h-auto md:max-h-[85vh]"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-900/50">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none mb-1">Intelligence</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{unreadCount} Critical Feeds</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button 
                                            onClick={markAllRead}
                                            className="text-[9px] font-black uppercase text-indigo-600 hover:bg-indigo-50 px-4 py-2.5 rounded-[1.25rem] transition-all border border-indigo-100 shrink-0"
                                        >
                                            Dismiss All
                                        </button>
                                    )}
                                    <button onClick={() => setIsOpen(false)} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-[1.25rem] transition-all">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-y-auto custom-scrollbar flex-1 overscroll-contain">
                                {loading && notifications.length === 0 ? (
                                    <div className="p-20 text-center flex flex-col items-center gap-4">
                                        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Intelligence</p>
                                    </div>
                                ) : notifications.length > 0 ? (
                                    <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {notifications.map((notif) => {
                                            const styles = getTypeStyles(notif.type);
                                            return (
                                                <div 
                                                    key={notif._id}
                                                    onClick={() => markRead(notif._id)}
                                                    className={`p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer relative group ${!notif.isRead ? 'bg-indigo-50/20 dark:bg-indigo-500/5' : ''}`}
                                                >
                                                    <div className="flex gap-5">
                                                        <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center shrink-0 border ${styles.bg}`}>
                                                            {styles.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0 space-y-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${styles.bg}`}>
                                                                    {styles.label}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
                                                                    {formatDate(notif.createdAt)}
                                                                </span>
                                                            </div>
                                                            <h4 className={`text-base font-black leading-tight ${!notif.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                                                {notif.title}
                                                            </h4>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                                                {notif.message}
                                                            </p>
                                                            
                                                            <div className="pt-2 flex items-center justify-between">
                                                                {!notif.isRead ? (
                                                                    <span className="text-[9px] font-black uppercase text-indigo-600">New Message</span>
                                                                ) : (
                                                                    <span className="text-[9px] font-black uppercase text-slate-300">Archived</span>
                                                                )}
                                                                <button 
                                                                    onClick={(e) => deleteNotif(notif._id, e)}
                                                                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-50"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-24 text-center space-y-6">
                                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[1.25rem] flex items-center justify-center mx-auto text-slate-200 border border-slate-100">
                                            <Bell size={40} />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Workspace is Silent</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-[200px] mx-auto">All systems operational. No pending alerts or broadcasts.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 shrink-0">
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="w-full py-3.5 bg-slate-900 dark:bg-slate-800 text-[10px] font-black uppercase text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition-all tracking-[0.2em] rounded-[1.25rem] shadow-lg shadow-slate-900/10"
                                >
                                    Synchronize Panel
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
