import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
    Settings, CreditCard, ShieldCheck, 
    Smartphone, QrCode, Save, Info,
    Hammer, AlertTriangle, Activity, RefreshCw, CheckCircle2, Clock3, XCircle, Webhook
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSettings = () => {
    const [settings, setSettings] = useState({
        regFee: 0,
        upiId: '',
        qrCode: '',
        supportPhone: '',
        isPaymentRequired: false,
        paymentVerificationMode: 'manual',
        isMaintenanceMode: false,
        maintenanceTime: '15 Minutes'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [duration, setDuration] = useState('15');
    const [cashfreeStatus, setCashfreeStatus] = useState(null);
    const [webhookEvents, setWebhookEvents] = useState([]);
    const [webhookSummary, setWebhookSummary] = useState({ total: 0, processed: 0, failed: 0, pending: 0 });
    const [webhookLoading, setWebhookLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
        fetchWebhookEvents();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            setSettings(res.data.data);
            try {
                const gateway = await api.get('/payments/cashfree/status');
                setCashfreeStatus(gateway.data?.data || null);
            } catch {
                setCashfreeStatus({ configured: false, missing: ['CASHFREE_CLIENT_ID', 'CASHFREE_CLIENT_SECRET'] });
            }
        } catch (error) {
            toast.error("Failed to fetch settings");
        } finally {
            setLoading(false);
        }
    };

    const fetchWebhookEvents = async () => {
        setWebhookLoading(true);
        try {
            const res = await api.get('/payments/cashfree/webhooks');
            setWebhookEvents(res.data?.data || []);
            setWebhookSummary(res.data?.summary || { total: 0, processed: 0, failed: 0, pending: 0 });
        } catch (error) {
            // This panel is only available to administrators; keep settings usable if logs are unavailable.
            console.warn('Unable to load Cashfree webhook activity.', error);
        } finally {
            setWebhookLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            await api.put('/admin/settings', settings);
            toast.success("Global settings updated successfully");
        } catch (error) {
            toast.error("Update failed");
        } finally {
            setSaving(false);
        }
    };

    const handleMaintenanceToggle = async (checked) => {
        const updatedSettings = { 
            ...settings, 
            isMaintenanceMode: checked,
            maintenanceDuration: duration // Send duration for timer calculation
        };
        setSettings(updatedSettings);
        
        try {
            const res = await api.put('/admin/settings', updatedSettings);
            toast.success(`Maintenance Mode: ${checked ? 'ACTIVE' : 'INACTIVE'}`);
            // Update local state with server calculated time if needed
            if (res.data.success) {
                setSettings(res.data.data);
            }
        } catch (error) {
            toast.error("Failed to toggle maintenance mode");
            setSettings(settings); // Revert on failure
        }
    };

    if (loading) return <div className="animate-pulse h-96 bg-slate-100 rounded-[3rem]"></div>;

    return (
        <div className="space-y-10 max-w-4xl">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                    <Settings size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">System Settings</h1>
                    <p className="text-slate-500 font-medium">Configure global platform parameters and registration workflows.</p>
                </div>
            </div>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Maintenance Mode Section */}
                <div className="md:col-span-2 bg-rose-50 dark:bg-rose-500/5 p-8 rounded-[3rem] border-2 border-rose-100 dark:border-rose-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-rose-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-rose-500/30">
                            <Hammer size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-rose-600">Maintenance Mode</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">When active, all non-admin users will be blocked and redirected to the maintenance page.</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-rose-200 dark:border-rose-500/30">
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Duration (Mins)</p>
                                <input 
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    placeholder="e.g. 15"
                                    className="bg-transparent text-sm font-bold outline-none text-rose-600 w-16"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-rose-200 dark:border-rose-500/30">
                        <span className={`text-xs font-black uppercase tracking-widest ${settings.isMaintenanceMode ? 'text-rose-500' : 'text-slate-400'}`}>
                            {settings.isMaintenanceMode ? 'Active (Offline)' : 'Inactive (Online)'}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={settings.isMaintenanceMode}
                                onChange={(e) => handleMaintenanceToggle(e.target.checked)}
                            />
                            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-rose-500"></div>
                        </label>
                    </div>
                </div>
            </div>
                {/* Registration Fee Section */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
                    <div className="flex items-center gap-3 text-indigo-600">
                        <CreditCard size={20} />
                        <h3 className="font-black uppercase tracking-widest text-sm">Registration Fee</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Require Payment</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={settings.isPaymentRequired}
                                    onChange={(e) => setSettings({...settings, isPaymentRequired: e.target.checked})}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Payment Verification Method</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button type="button" onClick={() => setSettings({...settings, paymentVerificationMode: 'manual'})} className={`rounded-2xl border-2 p-4 text-left transition-all ${(settings.paymentVerificationMode || 'manual') === 'manual' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-700'}`}>
                                    <span className="block text-sm font-black">Manual Verification</span>
                                    <span className="mt-1 block text-xs text-slate-500">UPI / QR + screenshot reviewed by admin</span>
                                </button>
                                <button type="button" onClick={() => setSettings({...settings, paymentVerificationMode: 'cashfree'})} className={`rounded-2xl border-2 p-4 text-left transition-all ${settings.paymentVerificationMode === 'cashfree' ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-700'}`}>
                                    <span className="block text-sm font-black">Cashfree Automatic</span>
                                    <span className="mt-1 block text-xs text-slate-500">Server-side verification via Cashfree</span>
                                </button>
                            </div>
                            <p className="text-xs text-slate-500">Changing this setting affects new registration payments. Existing Cashfree orders remain verifiable.</p>
                            {settings.paymentVerificationMode === 'cashfree' && (
                                <div className={`rounded-xl border p-4 text-sm ${cashfreeStatus?.configured ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'}`}>
                                    <p className="font-bold">{cashfreeStatus?.configured ? 'Cashfree credentials detected' : 'Cashfree credentials missing'}</p>
                                    <p className="mt-1 text-xs leading-5">{cashfreeStatus?.configured
                                        ? `Server credentials are present. Environment: ${cashfreeStatus.environment || 'sandbox'} · API version: ${cashfreeStatus.apiVersion || '2023-08-01'}.`
                                        : `Add these private variables in Render: ${(cashfreeStatus?.missing || ['CASHFREE_CLIENT_ID', 'CASHFREE_CLIENT_SECRET']).join(', ')}. Never add the secret key to frontend code.`}</p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Fee Amount (₹)</label>
                            <input 
                                type="number" 
                                className="input-field"
                                value={settings.regFee}
                                onChange={(e) => setSettings({...settings, regFee: parseInt(e.target.value)})}
                                disabled={!settings.isPaymentRequired}
                            />
                        </div>
                    </div>
                </div>

                {/* Payment Gateway Section */}
                {(settings.paymentVerificationMode || 'manual') === 'manual' && settings.isPaymentRequired && (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
                    <div className="flex items-center gap-3 text-emerald-600">
                        <Smartphone size={20} />
                        <h3 className="font-black uppercase tracking-widest text-sm">Admin Payment Details</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Admin UPI ID</label>
                            <input 
                                type="text" 
                                placeholder="yourname@upi"
                                className="input-field"
                                value={settings.upiId}
                                onChange={(e) => setSettings({...settings, upiId: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Support/Contact Phone</label>
                            <input 
                                type="text" 
                                placeholder="+91 99999 00000"
                                className="input-field"
                                value={settings.supportPhone}
                                onChange={(e) => setSettings({...settings, supportPhone: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                )}

                {(settings.paymentVerificationMode || 'manual') === 'manual' && settings.isPaymentRequired && (
                <div className="md:col-span-2 bg-slate-950 text-white p-8 md:p-12 rounded-[3.5rem] relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="w-48 h-48 bg-white p-4 rounded-3xl flex items-center justify-center shrink-0">
                            {settings.qrCode ? (
                                <img src={settings.qrCode} alt="Admin QR" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-slate-200 flex flex-col items-center gap-2">
                                    <QrCode size={40} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">No QR Uploaded</span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-6 flex-1">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Payment QR Code</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Upload your business QR code. This will be shown to approved shop owners 
                                    when they are prompted to pay the registration fee.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">QR Image URL (Hosting recommended)</label>
                                <input 
                                    type="text" 
                                    placeholder="https://imgur.com/your-qr.png"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all"
                                    value={settings.qrCode}
                                    onChange={(e) => setSettings({...settings, qrCode: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                    {/* Decor */}
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl group-hover:scale-110 transition-transform"></div>
                </div>

                )}
                <div className="md:col-span-2 flex justify-end pt-6">
                    <button 
                        type="submit"
                        disabled={saving}
                        className="px-12 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/30 flex items-center gap-3 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : <><Save size={20} /> Save System Settings</>}
                    </button>
                </div>
            </form>

            <section className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"><Webhook size={23} /></div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Cashfree Webhook Activity</h3>
                            <p className="mt-1 text-xs text-slate-500">Payment, refund, dispute and settlement updates received by StockSaathi.</p>
                        </div>
                    </div>
                    <button type="button" onClick={fetchWebhookEvents} disabled={webhookLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                        <RefreshCw size={15} className={webhookLoading ? 'animate-spin' : ''} /> Refresh events
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        { label: 'Total events', value: webhookSummary.total, icon: Activity, tone: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' },
                        { label: 'Processed', value: webhookSummary.processed, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
                        { label: 'Pending', value: webhookSummary.pending, icon: Clock3, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
                        { label: 'Failed', value: webhookSummary.failed, icon: XCircle, tone: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10' }
                    ].map((item) => (
                        <div key={item.label} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                            <div className={`mb-3 grid h-9 w-9 place-items-center rounded-xl ${item.tone}`}><item.icon size={17} /></div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{item.value}</p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                        </div>
                    ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="hidden grid-cols-[1.2fr_1fr_1fr_0.8fr] gap-3 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:bg-slate-800/70 sm:grid">
                        <span>Event</span><span>Order ID</span><span>Received</span><span>Status</span>
                    </div>
                    {webhookLoading && webhookEvents.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-500">Loading webhook events…</div>
                    ) : webhookEvents.length === 0 ? (
                        <div className="p-8 text-center">
                            <Activity size={28} className="mx-auto mb-2 text-slate-300" />
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No webhook events received yet</p>
                            <p className="mt-1 text-xs text-slate-500">Events will appear here after Cashfree sends them to your webhook URL.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {webhookEvents.map((event) => (
                                <div key={event.eventId} className="grid gap-2 px-4 py-4 sm:grid-cols-[1.2fr_1fr_1fr_0.8fr] sm:items-center sm:gap-3">
                                    <div className="min-w-0">
                                        <p className="break-words text-sm font-bold text-slate-800 dark:text-slate-100">{event.eventType || 'Unknown event'}</p>
                                        <p className="mt-1 text-xs capitalize text-slate-500">{event.summary || event.category || 'Webhook update'}</p>
                                    </div>
                                    <p className="break-all text-xs text-slate-500 sm:font-medium">{event.orderId || '—'}</p>
                                    <p className="text-xs text-slate-500">{event.createdAt ? new Date(event.createdAt).toLocaleString() : '—'}</p>
                                    <div><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${event.status === 'PROCESSED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : event.status === 'FAILED' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'}`}>{event.status || 'RECEIVED'}</span></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <p className="text-[11px] leading-5 text-slate-400">Only verified webhook requests are accepted. Refund, dispute and settlement events are recorded for admin review; they do not automatically reverse a customer payment.</p>
            </section>

            <div className="p-8 bg-indigo-50 dark:bg-indigo-500/5 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-500/20 flex items-start gap-4">
                <Info size={24} className="text-indigo-600 shrink-0" />
                <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-2">Important Note</h4>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                        These settings affect the core onboarding flow for all future shop owners. Ensure your UPI ID 
                        and Registration Fee are accurate before enabling 'Require Payment'.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
