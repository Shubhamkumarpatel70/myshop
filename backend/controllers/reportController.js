const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Shift = require('../models/Shift');
const PurchaseOrder = require('../models/PurchaseOrder');

exports.getDashboardStats = async (req, res) => {
    try {
        const filter = req.isAdmin ? {} : { user: req.shopOwnerId };
        const shopFilter = req.isAdmin ? {} : { shop: req.shopOwnerId };
        
        const totalProducts = await Product.countDocuments(filter);
        const totalCategories = await Category.countDocuments(filter);
        const lowStockProducts = await Product.countDocuments({ 
            ...filter,
            $expr: { $lte: ["$quantity", "$lowStockThreshold"] } 
        });
        
        const activeShifts = await Shift.countDocuments({ ...shopFilter, status: 'Open' });
        const pendingPOs = await PurchaseOrder.countDocuments({ ...filter, status: 'Sent' });

        const sales = await Sale.find(filter);
        const totalRevenue = sales.reduce((acc, curr) => acc + curr.totalAmount, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySales = await Sale.find({ ...filter, createdAt: { $gte: today } });
        const todayRevenue = todaySales.reduce((acc, curr) => acc + curr.totalAmount, 0);
        const todayCount = todaySales.length;

        let totalCost = 0;
        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (!item.isReturned) {
                    totalCost += (item.purchasePrice || 0) * item.quantity;
                }
            });
        });
        const totalProfit = totalRevenue - totalCost;
        const totalSalesCount = sales.length;

        // Expired and Expiring
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringProducts = await Product.countDocuments({
            ...filter,
            expiryDate: { $lte: thirtyDaysFromNow, $gte: now }
        });

        const expiringProductsList = await Product.find({
            ...filter,
            expiryDate: { $lte: thirtyDaysFromNow, $gte: now }
        }).sort({ expiryDate: 1 }).limit(5);

        const expiredProducts = await Product.countDocuments({
            ...filter,
            expiryDate: { $lt: now }
        });

        const expiredProductsList = await Product.find({
            ...filter,
            expiryDate: { $lt: now }
        }).sort({ expiryDate: 1 }).limit(5);

        res.json({
            success: true,
            data: {
                totalProducts,
                totalCategories,
                lowStockProducts,
                expiringProducts,
                expiredProducts,
                expiringProductsList,
                expiredProductsList,
                totalRevenue,
                todayRevenue,
                todayCount,
                activeShifts,
                pendingPOs,
                totalProfit,
                totalSalesCount,
                recentTransactions: sales.slice(-5).reverse()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSalesAnalytics = async (req, res) => {
    try {
        const { date, month, period, paymentMethod, shopCategory } = req.query;
        let queryFilter = req.isAdmin ? {} : { user: req.shopOwnerId };
        
        // Admin Filters: Category
        if (req.isAdmin && shopCategory) {
            const shopsInCategory = await User.find({ businessType: shopCategory }).select('_id');
            const shopIds = shopsInCategory.map(s => s._id);
            queryFilter.user = { $in: shopIds };
        }

        // Common Filter: Payment Method
        if (paymentMethod) {
            queryFilter.paymentMethod = paymentMethod;
        }
        let limit = 30;
        
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            queryFilter.createdAt = { $gte: start, $lte: end };
        } else if (month) {
            // format: YYYY-MM
            const [year, monthNum] = month.split('-');
            const start = new Date(year, monthNum - 1, 1);
            const end = new Date(year, monthNum, 0, 23, 59, 59, 999);
            queryFilter.createdAt = { $gte: start, $lte: end };
        } else if (period) {
            const days = parseInt(period) || 30;
            const start = new Date();
            start.setDate(start.getDate() - days);
            queryFilter.createdAt = { $gte: start };
            limit = days;
        }

        const filter = queryFilter;
        
        // Daily Sales
        const dailySales = await Sale.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    total: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: limit }
        ]);

        // Detailed Stats
        const sales = await Sale.find(filter);
        const totalRevenue = sales.reduce((acc, curr) => acc + curr.totalAmount, 0);
        
        let totalCost = 0;
        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (!item.isReturned) {
                    totalCost += (item.purchasePrice || 0) * item.quantity;
                }
            });
        });
        const totalProfit = totalRevenue - totalCost;
        const totalSalesCount = sales.length;
        const avgTicketSize = totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount) : 0;
        const netMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

        // Peak Sales Time & Busiest Day
        const hourCounts = {};
        const dayCounts = {};
        const paymentCounts = {};

        sales.forEach(sale => {
            const date = new Date(sale.createdAt);
            const hour = date.getHours();
            const day = date.toLocaleDateString('en-US', { weekday: 'long' });
            const method = sale.paymentMethod;

            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            dayCounts[day] = (dayCounts[day] || 0) + 1;
            paymentCounts[method] = (paymentCounts[method] || 0) + 1;
        });

        const peakHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b, '17');
        const busiestDay = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b, 'Saturday');
        const slowestDay = Object.keys(dayCounts).length > 0 
            ? Object.keys(dayCounts).reduce((a, b) => dayCounts[a] < dayCounts[b] ? a : b) 
            : 'Monday';
        const topPayment = Object.keys(paymentCounts).reduce((a, b) => paymentCounts[a] > paymentCounts[b] ? a : b, 'Cash');

        // Dynamic Growth Rates (Last 7 Days vs Previous 7 Days)
        const now = new Date();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const prev7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const currentSales = sales.filter(s => s.createdAt >= last7Days);
        const previousSales = sales.filter(s => s.createdAt >= prev7Days && s.createdAt < last7Days);

        const calcGrowth = (curr, prev) => {
            if (prev === 0) return curr > 0 ? 'New' : '0.0';
            return (((curr - prev) / prev) * 100).toFixed(1);
        };

        const revenueGrowth = calcGrowth(
            currentSales.reduce((a, b) => a + b.totalAmount, 0),
            previousSales.reduce((a, b) => a + b.totalAmount, 0)
        );

        const transactionGrowth = calcGrowth(currentSales.length, previousSales.length);
        
        const currentProfit = currentSales.reduce((acc, sale) => {
            const cost = sale.items.reduce((c, i) => c + ((i.purchasePrice || 0) * i.quantity), 0);
            return acc + (sale.totalAmount - cost);
        }, 0);
        const previousProfit = previousSales.reduce((acc, sale) => {
            const cost = sale.items.reduce((c, i) => c + ((i.purchasePrice || 0) * i.quantity), 0);
            return acc + (sale.totalAmount - cost);
        }, 0);
        const profitGrowth = calcGrowth(currentProfit, previousProfit);

        // Low Stock Risk
        const lowStockCount = await Product.countDocuments({ 
            ...filter,
            $expr: { $lte: ["$quantity", "$lowStockThreshold"] } 
        });

        res.json({ 
            success: true, 
            data: {
                dailySales,
                stats: {
                    totalRevenue,
                    totalProfit,
                    netMargin,
                    totalSalesCount,
                    avgTicketSize,
                    revenueGrowth,
                    transactionGrowth,
                    profitGrowth,
                    returningCustomerRate: 15 
                },
                insights: {
                    peakTime: `${peakHour}:00 - ${parseInt(peakHour)+3}:00`,
                    busiestDay,
                    slowestDay,
                    topPayment,
                    lowStockRisk: lowStockCount > 0 ? `Risk of stockout for ${lowStockCount} items` : 'Stock levels healthy'
                }
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdminStats = async (req, res) => {
    try {
        const totalOwners = await User.countDocuments({ role: 'shop_owner' });
        const totalStaff = await User.countDocuments({ role: { $in: ['manager', 'cashier'] } });
        const totalProducts = await Product.countDocuments();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaySalesDocs = await Sale.find({ createdAt: { $gte: today } });
        const todayRevenue = todaySalesDocs.reduce((acc, curr) => acc + curr.totalAmount, 0);
        const todayCount = todaySalesDocs.length;
        const todayProducts = await Product.countDocuments({ createdAt: { $gte: today } });
        
        const activeShifts = await Shift.countDocuments({ status: 'Open' });
        const pendingPOs = await PurchaseOrder.countDocuments({ status: 'Sent' });
        
        const lowStockProducts = await Product.find({ 
            $expr: { $lte: ["$quantity", "$lowStockThreshold"] } 
        }).distinct('user');
        
        const lowStockShops = lowStockProducts.length;

        const sales = await Sale.find();
        const totalRevenue = sales.reduce((acc, curr) => acc + curr.totalAmount, 0);
        
        const shops = await User.find({ role: 'shop_owner' });
        
        const shopsWithStats = await Promise.all(shops.map(async (shop) => {
            if (!shop.shopId) {
                await shop.save();
            }
            const productCount = await Product.countDocuments({ user: shop._id });
            return { ...shop._doc, productCount };
        }));

        res.json({
            success: true,
            data: {
                totalOwners,
                totalStaff,
                totalProducts,
                totalRevenue,
                todayRevenue,
                todayCount,
                activeShifts,
                pendingPOs,
                todayProducts,
                lowStockShops,
                shops: shopsWithStats
            }
        });
    } catch (error) {
        console.error("ADMIN STATS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getGlobalActivity = async (req, res) => {
    try {
        const InventoryLog = require('../models/InventoryLog');
        
        const logs = await InventoryLog.find()
            .populate('product', 'productName')
            .populate('user', 'ownerName shopName')
            .sort({ createdAt: -1 })
            .limit(50);
            
        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
