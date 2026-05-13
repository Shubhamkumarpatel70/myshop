const Product = require('../models/Product');
const User = require('../models/User');
const Plan = require('../models/Plan');

// Fallback limits if DB is empty
const DEFAULT_LIMITS = {
    'Free': { maxProducts: 50, maxStaff: 2 },
    'Professional': { maxProducts: 1000, maxStaff: 10 },
    'Enterprise': { maxProducts: Infinity, maxStaff: Infinity }
};

const getPlanLimits = async (planName) => {
    try {
        const plan = await Plan.findOne({ name: planName, isActive: true });
        if (plan) {
            return {
                maxProducts: plan.maxProducts,
                maxStaff: plan.maxStaff
            };
        }
        return DEFAULT_LIMITS[planName] || DEFAULT_LIMITS['Free'];
    } catch (error) {
        return DEFAULT_LIMITS['Free'];
    }
};

exports.checkProductLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.shopOwnerId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        const planName = user.subscriptionPlan || 'Free';
        const limits = await getPlanLimits(planName);
        const limit = limits.maxProducts;

        if (limit === 0 || limit === Infinity) return next();

        const productCount = await Product.countDocuments({ user: req.shopOwnerId });
        
        if (productCount >= limit) {
            return res.status(403).json({
                success: false,
                errorCode: 'LIMIT_REACHED',
                limitType: 'product',
                isTrialUsed: user.isTrialUsed,
                message: `Limit Reached: Your ${planName} plan limit of ${limit} products has been reached.`
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

        const planName = user.subscriptionPlan || 'Free';
        const limits = await getPlanLimits(planName);
        const limit = limits.maxStaff;

        if (limit === 0 || limit === Infinity) return next();

        const staffCount = await User.countDocuments({ createdBy: req.shopOwnerId, role: { $in: ['manager', 'cashier'] } });
        
        if (staffCount >= limit) {
            return res.status(403).json({
                success: false,
                errorCode: 'LIMIT_REACHED',
                limitType: 'staff',
                isTrialUsed: user.isTrialUsed,
                message: `Limit Reached: Your ${planName} plan allows only ${limit} staff members.`
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
