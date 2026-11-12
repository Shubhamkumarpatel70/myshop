import axios from 'axios';
import toast from 'react-hot-toast';
import { canQueueRequest, enqueueMutation } from './offlineQueue';

const isProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (isProduction ? '/api' : 'http://localhost:5000/api')
});

export const BASE_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : (isProduction ? window.location.origin : 'http://localhost:5000');

api.interceptors.request.use(async (config) => {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
        user = null;
    }
    if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;

    if (!config._skipOfflineQueue && !navigator.onLine && canQueueRequest(config)) {
        const queued = await enqueueMutation(config, user?._id || user?.id || user?.user?._id);
        toast('Saved on this device. It will sync when you are online.', {
            id: `offline-queued-${queued.id}`,
            icon: '⏳',
            duration: 4500
        });
        const error = new Error('This change is saved locally and waiting to sync.');
        error.code = 'ERR_OFFLINE_QUEUED';
        error.queuedMutationId = queued.id;
        error.config = config;
        throw error;
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        const isNetworkError = !error.response || error.code === 'ERR_NETWORK' ||
            error.message?.includes('Network Error') ||
            error.message?.includes('ERR_INTERNET_DISCONNECTED');
        if (isNetworkError && error.code !== 'ERR_OFFLINE_QUEUED') {
            toast.error('Cloud connection lost. Please check your internet.', {
                id: 'network-error',
                duration: 4000
            });
        }
        return Promise.reject(error);
    }
);

export default api;
