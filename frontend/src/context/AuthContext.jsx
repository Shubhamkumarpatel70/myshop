import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    let parsedUser = JSON.parse(storedUser);
                    
                    // Set token for the initial request
                    if (parsedUser.token) {
                        api.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
                    }

                    // Fetch latest profile to sync state
                    const res = await api.get('/auth/profile');
                    if (res.data.success) {
                        let userData = { ...parsedUser, ...res.data.data };
                        
                        // Normalize legacy roles
                        const roleMap = { 'Admin': 'super_admin', 'Shop Owner': 'shop_owner', 'Staff': 'cashier' };
                        if (roleMap[userData.role]) userData.role = roleMap[userData.role];

                        localStorage.setItem('user', JSON.stringify(userData));
                        setUser(userData);
                    } else {
                        // If profile fetch fails but user exists, just use stored
                        setUser(parsedUser);
                    }
                } catch (error) {
                    console.error("User sync failed:", error);
                    // If 401, clear user
                    if (error.response?.status === 401) {
                        logout();
                    }
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const hashMPin = async (email, mPin) => {
        const msgUint8 = new TextEncoder().encode(email + mPin);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const login = async (email, password, mPin) => {
        // Offline Login Logic
        if (!navigator.onLine && mPin) {
            const cachedUser = JSON.parse(localStorage.getItem('user'));
            if (cachedUser && cachedUser.email === email && cachedUser.offlineHash) {
                const inputHash = await hashMPin(email, mPin);
                if (inputHash === cachedUser.offlineHash) {
                    setUser(cachedUser);
                    return { success: true, offline: true };
                }
            }
            return { success: false, message: "Offline login failed. Check mPin or connect to internet." };
        }

        try {
            const payload = mPin ? { email, mPin } : { email, password };
            const res = await api.post('/auth/login', payload);
            if (res.data.success) {
                const userData = res.data;
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
                api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
                return { success: true };
            }
            return { success: false, message: res.data.message };
        } catch (error) {
            // Automatic fallback if request fails due to network or offline
            const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.message.includes('Network Error');
            
            if (isNetworkError && mPin) {
                const cachedUser = JSON.parse(localStorage.getItem('user'));
                if (cachedUser && cachedUser.email === email && cachedUser.offlineHash) {
                    const inputHash = await hashMPin(email, mPin);
                    if (inputHash === cachedUser.offlineHash) {
                        setUser(cachedUser);
                        return { success: true, offline: true };
                    }
                }
            }

            return { 
                success: false, 
                message: isNetworkError ? "Connection lost. Please check your internet or use mPIN for offline access." : (error.response?.data?.message || "Login failed"),
                attemptsLeft: error.response?.data?.attemptsLeft,
                lockoutUntil: error.response?.data?.lockoutUntil,
                remainingSeconds: error.response?.data?.remainingSeconds,
                isLocked: error.response?.status === 429
            };
        }
    };

    const register = async (formData) => {
        try {
            const res = await api.post('/auth/register', formData);
            if (res.data.success) {
                const userData = res.data;
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
                api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
                return { success: true };
            }
            return { success: false, message: res.data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || "Registration failed" };
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
    };

    const setSession = (userData, token) => {
        const userWithToken = { ...userData, token };
        localStorage.setItem('user', JSON.stringify(userWithToken));
        localStorage.setItem('token', token);
        setUser(userWithToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const updateUser = (userData) => {
        const newUser = { ...user, ...userData };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, setSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
