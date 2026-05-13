import axios from 'axios';

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

export default api;
