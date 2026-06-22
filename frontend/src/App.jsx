import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import api from './utils/api';
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
import ShopBarcodes from './dashboard/ShopBarcodes';
import AdminPricing from './dashboard/AdminPricing';
import AdminQueries from './dashboard/AdminQueries';
import AdminStaff from './dashboard/AdminStaff';
import AdminPurchaseOrders from './dashboard/AdminPurchaseOrders';
import PODetails from './dashboard/PODetails';
import AdminRevenue from './dashboard/AdminRevenue';
import AdminBarcodes from './dashboard/AdminBarcodes';
import StockLedger from './dashboard/StockLedger';
import SplashScreen from './components/SplashScreen';
import NotFound from './pages/NotFound';
import AccessDenied from './pages/AccessDenied';
import Maintenance from './pages/Maintenance';
import { ShieldAlert, Info } from 'lucide-react';
import { LanguageProvider } from './context/LanguageContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    return user ? children : <Navigate to="/login" />;
};

const RoleProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" />;
    
    // Normalize role comparison
    const roleMap = { 'Admin': 'super_admin', 'Shop Owner': 'shop_owner', 'Staff': 'cashier' };
    const userRole = roleMap[user.role] || user.role;
    
    const isAuthorized = roles.includes(userRole);
    return isAuthorized ? children : <Navigate to="/403" />;
};

const AppContent = () => {
    const [showSplash, setShowSplash] = useState(true);
    const [maintenance, setMaintenance] = useState({ 
        active: false, 
        time: '15 Minutes',
        until: null
    });
    const { user, loading } = useAuth();
    const location = useLocation();

    useEffect(() => {
        const checkMaintenance = async () => {
            try {
                const res = await api.get('/admin/settings');
                if (res.data.success) {
                    setMaintenance({
                        active: !!res.data.data.isMaintenanceMode,
                        time: res.data.data.maintenanceTime || '15 Minutes',
                        until: res.data.data.maintenanceUntil
                    });
                }
            } catch (err) {
                // Silent if offline to avoid spamming console/toasts
                if (navigator.onLine) console.error("Maintenance check failed");
            }
        };
        
        checkMaintenance();
        const interval = setInterval(checkMaintenance, 30000); // Poll every 30s
        const timer = setTimeout(() => setShowSplash(false), 800);
        
        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, []);

    if (showSplash) return <SplashScreen />;
    
    // Global Maintenance Redirect (Except for Super Admin)
    const roleMap = { 'Admin': 'super_admin', 'Shop Owner': 'shop_owner', 'Staff': 'cashier' };
    const userRole = user ? (roleMap[user.role] || user.role) : null;
    const isSuperAdmin = userRole === 'super_admin';
    
    const isAuthPath = location.pathname === '/login' || location.pathname === '/register';
    
    if (maintenance.active && !isSuperAdmin && location.pathname !== '/maintenance' && !isAuthPath) {
        return <Navigate to="/maintenance" replace />;
    }

    // Redirect AWAY from maintenance if it's inactive
    if (!maintenance.active && location.pathname === '/maintenance') {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen flex flex-col relative">
            {/* Admin-only Maintenance Banner */}
            {maintenance.active && isSuperAdmin && (
                <div className="bg-rose-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 sticky top-0 z-[9999] shadow-lg animate-pulse">
                    <ShieldAlert size={14} />
                    <span>Live System Maintenance is ACTIVE ({maintenance.time}) — Public access is currently blocked</span>
                </div>
            )}
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
                <Route path="/invoice/:id" element={<><Navbar /><div className="pt-28"><ReceiptLookup /></div><Footer /></>} />

                {/* Dashboard Routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Overview />} />
                    <Route path="overview" element={<Overview />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="share" element={<MyShop />} />
                    <Route path="categories" element={<Categories />} />
                    <Route path="barcodes" element={<ShopBarcodes />} />
                    <Route path="staff" element={<Staff />} />
                    <Route path="shops" element={<Shops />} />
                    <Route path="activity" element={<Activity />} />
                    <Route path="broadcast" element={<Broadcast />} />
                    <Route path="admin/inventory" element={
                        <RoleProtectedRoute roles={['super_admin']}>
                            <AdminInventory />
                        </RoleProtectedRoute>
                    } />
                    <Route path="admin/sales" element={
                        <RoleProtectedRoute roles={['super_admin']}>
                            <AdminSales />
                        </RoleProtectedRoute>
                    } />
                    <Route path="admin/approvals" element={
                        <RoleProtectedRoute roles={['super_admin']}>
                            <AdminApprovals />
                        </RoleProtectedRoute>
                    } />
                    <Route path="admin/settings" element={
                        <RoleProtectedRoute roles={['super_admin']}>
                            <AdminSettings />
                        </RoleProtectedRoute>
                    } />
                    <Route path="admin/shop-finder" element={
                        <RoleProtectedRoute roles={['super_admin']}>
                            <AdminShopFinder />
                        </RoleProtectedRoute>
                    } />
                    <Route path="admin/order-finder" element={
                        <RoleProtectedRoute roles={['super_admin']}>
                            <AdminOrderFinder />
                        </RoleProtectedRoute>
                    } />
                    <Route path="sales" element={<Sales />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="payment-settings" element={<PaymentSettings />} />
                    <Route path="account" element={<Account />} />
                    <Route path="shifts" element={<Shifts />} />
                    <Route path="ledger" element={<StockLedger />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="suppliers" element={
                        <RoleProtectedRoute roles={['shop_owner', 'manager']}>
                            <Suppliers />
                        </RoleProtectedRoute>
                    } />
                    <Route path="purchase-orders" element={
                        <RoleProtectedRoute roles={['shop_owner', 'manager']}>
                            <PurchaseOrders />
                        </RoleProtectedRoute>
                    } />
                    <Route path="purchase-orders/:id" element={
                        <RoleProtectedRoute roles={['shop_owner', 'manager']}>
                            <PODetails />
                        </RoleProtectedRoute>
                    } />
                    <Route path="pricing" element={
                        <RoleProtectedRoute roles={['shop_owner']}>
                            <Pricing />
                        </RoleProtectedRoute>
                    } />
                    <Route path="admin/subscriptions" element={
                        <RoleProtectedRoute roles={['super_admin']}>
                            <AdminSubscriptions />
                        </RoleProtectedRoute>
                    } />
                    <Route path="admin/pricing" element={
                        <RoleProtectedRoute roles={['super_admin']}>
                            <AdminPricing />
                        </RoleProtectedRoute>
                    } />
                    <Route path="admin/queries" element={
                        <RoleProtectedRoute roles={['super_admin']}>
                            <AdminQueries />
                        </RoleProtectedRoute>
                    } />
                    <Route path="admin/staff" element={
                        <RoleProtectedRoute roles={['super_admin']}>
                            <AdminStaff />
                        </RoleProtectedRoute>
                    } />
                    <Route path="admin/purchase-orders" element={
                        <RoleProtectedRoute roles={['super_admin']}>
                            <AdminPurchaseOrders />
                        </RoleProtectedRoute>
                    } />
                    <Route path="admin/purchase-orders/:id" element={
                        <RoleProtectedRoute roles={['super_admin']}>
                            <PODetails />
                        </RoleProtectedRoute>
                    } />
                    <Route path="admin/revenue" element={
                        <RoleProtectedRoute roles={['super_admin']}>
                            <AdminRevenue />
                        </RoleProtectedRoute>
                    } />
                    <Route path="admin/barcodes" element={
                        <RoleProtectedRoute roles={['super_admin']}>
                            <AdminBarcodes />
                        </RoleProtectedRoute>
                    } />
                </Route>

                {/* 404 Catch-all */}
                <Route path="*" element={<NotFound />} />
                <Route path="/403" element={<AccessDenied />} />
                <Route path="/maintenance" element={<Maintenance time={maintenance.time} until={maintenance.until} />} />
            </Routes>
            <Toaster position="top-right" />
        </div>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <LanguageProvider>
                <Router>
                    <AppContent />
                </Router>
            </LanguageProvider>
        </AuthProvider>
    );
};

export default App;
