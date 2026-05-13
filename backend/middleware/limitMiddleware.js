const Product = require('../models/Product');
const User = require('../models/User');

const PLAN_LIMITS = {
    'Free': {
        maxProducts: 20,
        maxStaff: 0,
        unlimitedCustomers: false
    },
    'Professional': {
        maxProducts: 500,
        maxStaff: 5,
        unlimitedCustomers: true
    },
    'Enterprise': {
        maxProducts: Infinity,
        maxStaff: Infinity,
        unlimitedCustomers: true
    }
};

exports.checkProductLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.shopOwnerId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        const plan = user.subscriptionPlan || 'Free';
        const limit = PLAN_LIMITS[plan].maxProducts;

        if (limit === Infinity) return next();

        const productCount = await Product.countDocuments({ user: req.shopOwnerId });
        
        if (productCount >= limit) {
            return res.status(403).json({
                success: false,
                message: `Upgrade Required: Your ${plan} plan limit of ${limit} products has been reached.`
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.checkStaffLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.shopOwnerId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const plan = user.subscriptionPlan || 'Free';
        const limit = PLAN_LIMITS[plan].maxStaff;

        if (limit === Infinity) return next();

        // Count staff members created by this shop owner
        const staffCount = await User.countDocuments({ createdBy: req.shopOwnerId, role: { $in: ['manager', 'cashier'] } });
        
        if (staffCount >= limit) {
            return res.status(403).json({
                success: false,
                message: `Upgrade Required: Your ${plan} plan allows only ${limit} staff members. Upgrade to Professional or Enterprise!`
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPlanLimits = (plan) => {
    return PLAN_LIMITS[plan] || PLAN_LIMITS['Free'];
};
