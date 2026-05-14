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

    const login = async (email, password, mPin) => {
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
            return { 
                success: false, 
                message: error.response?.data?.message || "Login failed",
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
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    const updateUser = (userData) => {
        const newUser = { ...user, ...userData };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
