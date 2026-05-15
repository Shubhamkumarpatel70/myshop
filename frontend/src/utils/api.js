import axios from 'axios';
import toast from 'react-hot-toast';

const isProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (isProduction ? '/api' : 'http://localhost:5000/api')
});

export const BASE_URL = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : (isProduction ? window.location.origin : 'http://localhost:5000');

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('ERR_INTERNET_DISCONNECTED');
        
        if (isNetworkError) {
            // Only show toast if browser thinks it's online but request failed (flaky connection)
            // or if it's a critical error. Use an ID to prevent stacking.
            toast.error("Cloud connection lost. Working in offline mode.", { 
                id: 'network-error',
                duration: 4000
            });
            error.message = "Network connection lost. Please check your internet.";
        }
        
        return Promise.reject(error);
    }
);

export default api;
