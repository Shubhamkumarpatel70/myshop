import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            let parsedUser = JSON.parse(storedUser);
            
            // Normalize legacy roles to new RBAC roles
            const roleMap = {
                'Admin': 'super_admin',
                'Shop Owner': 'shop_owner',
                'Staff': 'cashier'
            };
            
            if (roleMap[parsedUser.role]) {
                parsedUser.role = roleMap[parsedUser.role];
                localStorage.setItem('user', JSON.stringify(parsedUser));
            }

            setUser(parsedUser);
            axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
            api.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            if (res.data.success) {
                const userData = res.data;
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
                api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
                return { success: true };
            }
            return { success: false, message: res.data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || "Login failed" };
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
