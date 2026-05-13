import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import Overview from './dashboard/Overview';
import Inventory from './dashboard/Inventory';
import Categories from './dashboard/Categories';
import Sales from './dashboard/Sales';
import Reports from './dashboard/Reports';
import Staff from './dashboard/Staff';
import Shops from './dashboard/Shops';
import Activity from './dashboard/Activity';
import Broadcast from './dashboard/Broadcast';
import AdminInventory from './dashboard/AdminInventory';
import AdminSales from './dashboard/AdminSales';
import MyShop from './dashboard/MyShop';
import PublicShop from './dashboard/PublicShop';
import PaymentSettings from './dashboard/PaymentSettings';
import AdminApprovals from './dashboard/AdminApprovals';
import AdminSettings from './dashboard/AdminSettings';
import Account from './dashboard/Account';
import AdminShopFinder from './dashboard/AdminShopFinder';
import AdminOrderFinder from './dashboard/AdminOrderFinder';
import Shifts from './dashboard/Shifts';
import Customers from './dashboard/Customers';
import Pricing from './dashboard/Pricing';
import AdminSubscriptions from './dashboard/AdminSubscriptions';
import SplashScreen from './components/SplashScreen';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    return user ? children : <Navigate to="/login" />;
};

const AppContent = () => {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (showSplash) return <SplashScreen />;

    return (
        <div className="min-h-screen flex flex-col">
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
                <Route path="/about" element={<><Navbar /><About /><Footer /></>} />
                <Route path="/contact" element={<><Navbar /><Contact /><Footer /></>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/shop/:shopSlug" element={<PublicShop />} />

                {/* Dashboard Routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Overview />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="my-shop" element={<MyShop />} />
                    <Route path="categories" element={<Categories />} />
                    <Route path="staff" element={<Staff />} />
                    <Route path="shops" element={<Shops />} />
                    <Route path="activity" element={<Activity />} />
                    <Route path="broadcast" element={<Broadcast />} />
                    <Route path="admin/inventory" element={<AdminInventory />} />
                    <Route path="admin/sales" element={<AdminSales />} />
                    <Route path="admin/approvals" element={<AdminApprovals />} />
                    <Route path="admin/settings" element={<AdminSettings />} />
                    <Route path="admin/shop-finder" element={<AdminShopFinder />} />
                    <Route path="admin/order-finder" element={<AdminOrderFinder />} />
                    <Route path="sales" element={<Sales />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="payment-settings" element={<PaymentSettings />} />
                    <Route path="account" element={<Account />} />
                    <Route path="shifts" element={<Shifts />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="pricing" element={<Pricing />} />
                    <Route path="admin/subscriptions" element={<AdminSubscriptions />} />
                </Route>
            </Routes>
            <Toaster position="top-right" />
        </div>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
};

export default App;
