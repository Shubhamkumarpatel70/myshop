import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Database, RefreshCw, Server, Clock, ShieldAlert } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const SystemHealth = () => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checkedAt, setCheckedAt] = useState(null);

    const loadHealth = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/health');
            setHealth(response.data?.data || null);
            setCheckedAt(new Date());
        } catch (error) {
            setHealth(error.response?.data?.data || { status: 'degraded', database: 'unavailable' });
            setCheckedAt(new Date());
            toast.error('Health check could not reach the API.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadHealth(); }, [loadHealth]);

    const healthy = health?.status === 'healthy';
    const metrics = [
        { label: 'Database', value: health?.database || 'Checking', icon: Database },
        { label: 'API response', value: Number.isFinite(health?.apiResponseMs) ? health.apiResponseMs + ' ms' : 'Unavailable', icon: Activity },
        { label: 'Server uptime', value: Number.isFinite(health?.uptimeSeconds) ? Math.floor(health.uptimeSeconds / 3600) + 'h ' + Math.floor((health.uptimeSeconds % 3600) / 60) + 'm' : 'Unavailable', icon: Server },
        { label: 'Last backup', value: health?.lastBackupAt ? new Date(health.lastBackupAt).toLocaleString() : 'Not configured', icon: Clock }
    ];

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Platform monitoring</p>
                    <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">System Health</h1>
                    <p className="mt-1 text-sm text-slate-500">Live database connectivity and API availability.</p>
                </div>
                <button onClick={loadHealth} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <section className={'rounded-2xl border p-5 ' + (healthy ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10' : 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10')}>
                <div className="flex items-center gap-3">
                    {healthy ? <Activity className="text-emerald-600" /> : <ShieldAlert className="text-amber-600" />}
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white">{loading ? 'Checking services…' : healthy ? 'All monitored services are healthy' : 'Service health needs attention'}</p>
                        <p className="text-xs text-slate-500">Last checked: {checkedAt ? checkedAt.toLocaleString() : 'Not checked yet'}</p>
                    </div>
                </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map(metric => {
                    const Icon = metric.icon;
                    return <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{metric.label}</p><Icon size={18} className="text-indigo-500" /></div>
                        <p className="mt-4 break-words text-xl font-black text-slate-900 dark:text-white">{loading ? '…' : metric.value}</p>
                    </article>;
                })}
            </div>
            <p className="text-xs text-slate-500">Backup monitoring is not connected yet. “Not configured” is shown instead of reporting a guessed backup time.</p>
        </div>
    );
};

export default SystemHealth;
