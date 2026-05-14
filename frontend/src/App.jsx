import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PWAHandler from './components/PWAHandler';
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
import ReceiptLookup from './pages/ReceiptLookup';
import ShopFinder from './pages/ShopFinder';
import PaymentSettings from './dashboard/PaymentSettings';
import AdminApprovals from './dashboard/AdminApprovals';
import AdminSettings from './dashboard/AdminSettings';
import Account from './dashboard/Account';
import AdminShopFinder from './dashboard/AdminShopFinder';
import AdminOrderFinder from './dashboard/AdminOrderFinder';
import Shifts from './dashboard/Shifts';
import Customers from './dashboard/Customers';
import Suppliers from './dashboard/Suppliers';
import PurchaseOrders from './dashboard/PurchaseOrders';
import Pricing from './dashboard/Pricing';
import AdminSubscriptions from './dashboard/AdminSubscriptions';
import AdminPricing from './dashboard/AdminPricing';
import AdminQueries from './dashboard/AdminQueries';
import AdminStaff from './dashboard/AdminStaff';
import AdminPurchaseOrders from './dashboard/AdminPurchaseOrders';
import PODetails from './dashboard/PODetails';
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
            <PWAHandler />
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<><Navbar /><div className="pt-28"><Home /></div><Footer /></>} />
                <Route path="/about" element={<><Navbar /><div className="pt-28"><About /></div><Footer /></>} />
                <Route path="/contact" element={<><Navbar /><div className="pt-28"><Contact /></div><Footer /></>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/pricing" element={<><Navbar /><div className="max-w-7xl mx-auto px-4 pt-32 pb-12"><Pricing /></div><Footer /></>} />
                <Route path="/shop/:shopSlug" element={<PublicShop />} />
                <Route path="/public-shop/:shopId" element={<PublicShop />} />
                <Route path="/shops" element={<><Navbar /><ShopFinder /><Footer /></>} />
                <Route path="/lookup-receipt" element={<><Navbar /><div className="pt-28"><ReceiptLookup /></div><Footer /></>} />

                {/* Dashboard Routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Overview />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="share" element={<MyShop />} />
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
                    <Route path="suppliers" element={<Suppliers />} />
                    <Route path="purchase-orders" element={<PurchaseOrders />} />
                    <Route path="pricing" element={<Pricing />} />
                    <Route path="admin/subscriptions" element={<AdminSubscriptions />} />
                    <Route path="admin/pricing" element={<AdminPricing />} />
                    <Route path="admin/queries" element={<AdminQueries />} />
                    <Route path="admin/staff" element={<AdminStaff />} />
                    <Route path="admin/purchase-orders" element={<AdminPurchaseOrders />} />
                    <Route path="admin/purchase-orders/:id" element={<PODetails />} />
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
