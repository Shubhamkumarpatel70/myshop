import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
    Settings, CreditCard, ShieldCheck, 
    Smartphone, QrCode, Save, Info,
    Hammer, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSettings = () => {
    const [settings, setSettings] = useState({
        regFee: 0,
        upiId: '',
        qrCode: '',
        supportPhone: '',
        isPaymentRequired: false,
        isMaintenanceMode: false,
        maintenanceTime: '15 Minutes'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [duration, setDuration] = useState('15');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            setSettings(res.data.data);
        } catch (error) {
            toast.error("Failed to fetch settings");
        } finally {
            setLoading(false);
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

                {/* QR Code Section */}
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
