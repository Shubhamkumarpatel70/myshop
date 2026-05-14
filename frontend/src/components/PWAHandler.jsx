import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import toast from 'react-hot-toast';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

const PWAHandler = () => {
    const sw = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    if (!sw || !sw.offlineReady || !sw.needUpdate) return null;

    const {
        offlineReady: [offlineReady, setOfflineReady] = [false, () => {}],
        needUpdate: [needUpdate, setNeedUpdate] = [false, () => {}],
        updateServiceWorker,
    } = sw;

    useEffect(() => {
        if (offlineReady) {
            toast.success('App ready to work offline!', {
                icon: <Wifi size={18} className="text-green-500" />,
                duration: 4000,
            });
        }
    }, [offlineReady]);

    useEffect(() => {
        if (needUpdate) {
            toast((t) => (
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">New version available!</span>
                    <button
                        onClick={() => updateServiceWorker(true)}
                        className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                    >
                        <RefreshCw size={14} /> Update
                    </button>
                </div>
            ), {
                duration: Infinity,
                id: 'pwa-update',
            });
        }
    }, [needUpdate, updateServiceWorker]);

    useEffect(() => {
        const handleOnline = () => {
            toast.success('You are back online!', {
                icon: <Wifi size={18} className="text-green-500" />,
                id: 'connectivity-status',
            });
        };
        const handleOffline = () => {
            toast.error('You are offline. Working in cached mode.', {
                icon: <WifiOff size={18} className="text-red-500" />,
                id: 'connectivity-status',
                duration: Infinity,
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return null;
};

export default PWAHandler;
