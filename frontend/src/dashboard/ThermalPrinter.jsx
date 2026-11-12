import React, { useEffect, useState } from 'react';
import { Printer, Usb, Bluetooth, CheckCircle2, AlertCircle, RefreshCw, Settings2, ReceiptText, ShieldCheck, TestTube2, Save, Info, Smartphone, Cable } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { connectThermalPrinter, getAuthorizedThermalPrinters, isThermalPrinterSupported, printThermalReceipt } from '../utils/thermalPrinter';

const STORAGE_KEY = 'stocksaathi_thermal_printer_settings';
const defaults = { paperWidth: '58', shopHeader: true, footer: 'Thank you! Visit again.' };

const ThermalPrinter = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState(() => {
        try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
        catch { return defaults; }
    });
    const [connected, setConnected] = useState(false);
    const [printerName, setPrinterName] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [testing, setTesting] = useState(false);
    const [saved, setSaved] = useState(true);
    const supported = isThermalPrinterSupported();

    const update = (key, value) => { setSettings(current => ({ ...current, [key]: value })); setSaved(false); };
    const refreshConnection = async () => {
        try {
            const ports = await getAuthorizedThermalPrinters();
            setConnected(ports.length > 0);
            setPrinterName(ports.length ? 'Previously authorised serial printer' : '');
        } catch { setConnected(false); setPrinterName(''); }
    };
    useEffect(() => { refreshConnection(); }, []);

    const saveSettings = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        setSaved(true);
        toast.success('Printer settings saved on this device.');
    };

    const connect = async () => {
        setConnecting(true);
        try {
            const result = await connectThermalPrinter();
            setConnected(true);
            setPrinterName(result.name);
            toast.success('Printer permission granted. You can now test print.');
        } catch (error) {
            if (error.name !== 'NotFoundError') toast.error(error.message || 'Could not connect printer.');
        } finally { setConnecting(false); }
    };

    const testPrint = async () => {
        setTesting(true);
        const sampleSale = {
            _id: 'TEST-0001', transactionId: 'TEST-0001', createdAt: new Date().toISOString(),
            customerName: 'Walk-in Customer', customerPhone: '9999999999', paymentMethod: 'Cash', totalAmount: 125,
            user: { shopName: settings.shopHeader ? (user?.shopName || 'Your Shop') : 'StockSaathi', address: user?.address || '', phone: user?.phone || '', gstEnabled: Boolean(user?.gstEnabled), gstin: user?.gstin || '' },
            items: [{ productName: 'Test Product A', quantity: 2, price: 50, total: 100 }, { productName: 'Test Product B', quantity: 1, price: 25, total: 25 }]
        };
        try {
            if (supported && connected) {
                await printThermalReceipt(sampleSale, settings.paperWidth === '80' ? 48 : 32);
                toast.success('Test receipt sent to printer.');
            } else {
                const popup = window.open('', '_blank', 'width=420,height=650');
                if (!popup) throw new Error('Allow pop-ups to open the test receipt.');
                const safe = value => String(value || '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
                const width = settings.paperWidth === '80' ? '80mm' : '58mm';
                popup.document.write(`<!doctype html><html><head><title>Thermal printer test</title><style>@page{size:${width} auto;margin:3mm}*{box-sizing:border-box}body{width:${settings.paperWidth === '80' ? '74mm' : '52mm'};margin:0 auto;font:12px/1.45 monospace;color:#111}h2{text-align:center;font-size:15px;margin:0 0 4px}p{margin:3px 0}.center{text-align:center}.line{border-top:1px dashed #111;margin:8px 0}.row{display:flex;justify-content:space-between;gap:8px}.bold{font-weight:bold}.footer{text-align:center;margin-top:12px}</style></head><body><h2>${safe(user?.shopName || 'Your Shop')}</h2><p class="center">THERMAL PRINTER TEST</p><div class="line"></div><p>Connection: System print dialog</p><p>Paper: ${settings.paperWidth}mm</p><p>Date: ${new Date().toLocaleString('en-IN')}</p><div class="line"></div><div class="row"><span>Test Product A x 2</span><b>₹100.00</b></div><div class="row"><span>Test Product B x 1</span><b>₹25.00</b></div><div class="line"></div><div class="row bold"><span>TOTAL</span><span>₹125.00</span></div><p class="footer">${safe(settings.footer)}</p></body></html>`);
                popup.document.close();
                popup.focus();
                popup.print();
                toast.success('Select your thermal printer in the print dialog.');
            }
        } catch (error) { toast.error(error.message || 'Test print failed.'); }
        finally { setTesting(false); }
    };

    return (
        <div className="relative space-y-6 pb-12">
            <div className="pointer-events-none absolute -right-8 -top-8 h-52 w-52 rounded-full bg-violet-400/15 blur-3xl" />
            <div className="pointer-events-none absolute -left-8 top-64 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
            <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-xl sm:p-8">
                <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full border-[24px] border-white/5" />
                <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div className="max-w-xl">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100"><Printer size={14}/> Shop tools · Receipt printing</div>
                        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Thermal Printer</h1>
                        <p className="mt-2 text-sm leading-6 text-indigo-100/80">Connect your receipt printer, choose paper size and test a sample bill before checkout.</p>
                    </div>
                    <div className="flex h-24 w-24 items-center justify-center self-start rounded-[26px] border border-white/15 bg-white/10"><ReceiptText size={42}/></div>
                </div>
                <div className="relative mt-7 flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${connected ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-300/15 text-amber-100'}`}><span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-300' : 'bg-amber-300'}`}/>{connected ? 'Printer authorised' : 'Printer not connected'}</span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white/80"><ShieldCheck size={14}/> Settings stay on this device</span>
                </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
                <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6"><div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Printer connection</h2><p className="mt-1 text-xs text-slate-500">Connect a supported serial printer or use system print.</p></div><span className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-500/10"><Usb size={22}/></span></div>
                    <div className="space-y-4 p-5 sm:p-6">
                        <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60"><div className="rounded-xl bg-white p-2.5 text-indigo-600 shadow-sm dark:bg-slate-900"><Cable size={20}/></div><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900 dark:text-white">Direct USB / Serial</p><p className="mt-1 text-xs leading-5 text-slate-500">Chrome or Edge on HTTPS, with a printer that exposes a serial interface.</p>{printerName && <p className="mt-2 truncate text-xs font-semibold text-emerald-600">{printerName}</p>}</div></div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button onClick={connect} disabled={!supported || connecting} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"><Usb size={17}/>{connecting ? 'Connecting...' : connected ? 'Select / reconnect printer' : 'Connect printer'}</button>
                            <button onClick={refreshConnection} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><RefreshCw size={16}/> Refresh</button>
                        </div>
                        {!supported && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"><AlertCircle size={15} className="mr-1 inline"/> Direct serial connection is unavailable in this browser. Use Android, Windows or macOS system print dialog. Pair Bluetooth printers in device settings first.</div>}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"><Bluetooth size={19} className="mb-2 text-sky-600"/><p className="text-sm font-bold text-slate-800 dark:text-white">Bluetooth</p><p className="mt-1 text-xs leading-5 text-slate-500">Pair your printer in Bluetooth settings, then select it from the print dialog.</p></div>
                            <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"><Smartphone size={19} className="mb-2 text-violet-600"/><p className="text-sm font-bold text-slate-800 dark:text-white">Mobile / USB</p><p className="mt-1 text-xs leading-5 text-slate-500">Use your device print service or a compatible printer app.</p></div>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6"><div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Receipt settings</h2><p className="mt-1 text-xs text-slate-500">Choose your paper roll and receipt layout.</p></div><Settings2 size={22} className="text-violet-600"/></div>
                    <div className="space-y-5 p-5 sm:p-6">
                        <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Paper width</p><div className="grid grid-cols-2 gap-2">{['58','80'].map(width=><button key={width} onClick={()=>update('paperWidth',width)} className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${settings.paperWidth===width?'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200':'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'}`}>{width}mm <span className="block text-[11px] font-medium opacity-70">{width==='58'?'32 characters':'48 characters'}</span></button>)}</div></div>
                        <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><span><span className="block text-sm font-semibold text-slate-800 dark:text-white">Show shop details</span><span className="text-xs text-slate-500">Shop identity on receipt</span></span><input type="checkbox" checked={settings.shopHeader} onChange={e=>update('shopHeader',e.target.checked)} className="h-5 w-5 accent-indigo-600"/></label>
                                                <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-white">Receipt footer</span><input value={settings.footer} onChange={e=>update('footer',e.target.value)} maxLength={80} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"/></label>
                        <div className="flex flex-wrap items-center justify-between gap-3"><span className={`text-xs ${saved?'text-emerald-600':'text-amber-600'}`}>{saved?'All changes saved':'Unsaved changes'}</span><button onClick={saveSettings} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900"><Save size={15}/> Save settings</button></div>
                    </div>
                </section>
            </div>

            <section className="relative overflow-hidden rounded-[24px] border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-5 shadow-sm dark:border-indigo-500/20 dark:from-indigo-950/40 dark:via-slate-900 dark:to-cyan-950/30 sm:p-6">
                <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full border-[18px] border-indigo-200/30 dark:border-indigo-400/10"/>
                <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300"><TestTube2 size={18}/><h2 className="text-lg font-bold">Print a test receipt</h2></div><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">A sample receipt is used. No sale or stock will be created.</p></div><button onClick={testPrint} disabled={testing} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-60"><Printer size={17}/>{testing?'Preparing...':'Test print'}</button></div>
            </section>
            <p className="flex items-start gap-2 px-1 text-xs leading-5 text-slate-500"><Info size={15} className="mt-0.5 shrink-0"/> Direct serial printing needs a compatible ESC/POS printer. Bluetooth printers use the device print service here; silent Bluetooth printing is not available to ordinary web pages.</p>
        </div>
    );
};

export default ThermalPrinter;
