import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import {
    discardQueuedMutation,
    getQueuedMutations,
    retryQueuedMutations,
    syncQueuedMutations
} from '../utils/offlineQueue';

const OfflineSyncBanner = () => {
    const [online, setOnline] = useState(navigator.onLine);
    const [items, setItems] = useState([]);
    const [syncing, setSyncing] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [userId, setUserId] = useState(null);

    const refresh = useCallback(async () => {
        let user = null;
        try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch { user = null; }
        const id = user?._id || user?.id || user?.user?._id;
        setUserId(id ? String(id) : null);
        setItems(id ? await getQueuedMutations(id) : []);
    }, []);

    useEffect(() => {
        const onOnline = () => { setOnline(true); refresh(); };
        const onOffline = () => setOnline(false);
        const onQueue = () => refresh();
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        window.addEventListener('stock-saathi-queue-updated', onQueue);
        refresh();
        const timer = window.setInterval(refresh, 10000);
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
            window.removeEventListener('stock-saathi-queue-updated', onQueue);
            window.clearInterval(timer);
        };
    }, [refresh]);

    useEffect(() => {
        if (online && items.some(item => item.status === 'pending') && userId && !syncing) {
            handleSync(true);
        }
    }, [online, userId, items.length]);

    const handleSync = async (silent = false) => {
        if (!userId || syncing || !navigator.onLine) return;
        setSyncing(true);
        try {
            const result = await syncQueuedMutations(api, userId);
            const synced = result.filter(item => item.status === 'synced').length;
            const blocked = result.find(item => item.status === 'conflict' || item.status === 'failed');
            if (synced && !silent) toast.success(`${synced} change(s) synced.`);
            if (blocked && !silent) toast.error(`Sync paused: ${blocked.error}`);
            await refresh();
        } finally {
            setSyncing(false);
        }
    };

    const discard = async (id) => {
        await discardQueuedMutation(id);
        await refresh();
    };

    const retry = async () => {
        if (!userId) return;
        await retryQueuedMutations(userId);
        await refresh();
        handleSync();
    };

    if (online && items.length === 0) return null;
    const blocked = items.find(item => item.status === 'conflict' || item.status === 'failed');

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-xl">
            <div className={`rounded-2xl border shadow-xl backdrop-blur-xl ${online ? 'border-amber-300 bg-white/95 text-slate-800' : 'border-slate-700 bg-slate-950/95 text-white'}`}>
                <div className="flex items-center gap-3 p-3">
                    {online ? <Cloud className="h-5 w-5 text-amber-600" /> : <CloudOff className="h-5 w-5 text-rose-400" />}
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">{online ? `${items.length} change(s) waiting to sync` : 'You are offline'}</p>
                        <p className="text-xs opacity-75">{blocked ? 'Sync paused. Review the failed change before continuing.' : online ? 'Your saved changes are stored on this device.' : 'Supported inventory changes will be saved on this device.'}</p>
                    </div>
                    {online && items.some(item => item.status === 'pending') && (
                        <button onClick={() => handleSync()} disabled={syncing} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                            <span className="inline-flex items-center gap-1"><RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} /> Sync</span>
                        </button>
                    )}
                    <button onClick={() => setExpanded(value => !value)} className="rounded-lg p-2 text-xs font-semibold hover:bg-slate-500/10">{expanded ? 'Hide' : 'Details'}</button>
                </div>
                {expanded && items.length > 0 && (
                    <div className="max-h-64 space-y-2 overflow-y-auto border-t border-slate-200/20 p-3">
                        {items.map(item => (
                            <div key={item.id} className="flex items-start gap-2 rounded-xl bg-slate-500/5 p-2">
                                {item.status === 'pending' ? <Cloud className="mt-0.5 h-4 w-4" /> : item.status === 'syncing' ? <RefreshCw className="mt-0.5 h-4 w-4 animate-spin" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />}
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold">{item.method} {item.url}</p>
                                    <p className="text-xs opacity-70">{item.status === 'pending' ? 'Waiting to sync' : item.error || item.status}</p>
                                </div>
                                {(item.status === 'failed' || item.status === 'conflict') && <button onClick={() => discard(item.id)} className="rounded p-1 text-xs text-rose-500">Discard</button>}
                            </div>
                        ))}
                        {blocked && <button onClick={retry} className="w-full rounded-xl border border-current/20 px-3 py-2 text-xs font-bold">Retry queue</button>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OfflineSyncBanner;
