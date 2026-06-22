const Product = require('../models/Product');
const User = require('../models/User');

const PLAN_LIMITS = {
    'Free': {
        products: 50,
        staff: 1
    },
    'Professional': {
        products: 5000,
        staff: 10
    },
    'Enterprise': {
        products: Infinity,
        staff: Infinity
    }
};

exports.checkProductLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        const plan = user.subscriptionPlan || 'Free';
        const limit = PLAN_LIMITS[plan].products;

        const productCount = await Product.countDocuments({ user: req.user.id });

        if (productCount >= limit) {
            return res.status(403).json({
                success: false,
                message: `Upgrade Required: Your ${plan} plan is limited to ${limit} products.`,
                limitReached: true,
                plan: plan
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.checkStaffLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        const plan = user.subscriptionPlan || 'Free';
        let limit = PLAN_LIMITS[plan].staff;

        // Apply Team Expansion Add-on
        if (user.hasStaffAddon) {
            limit += 5;
        }

        const staffCount = await User.countDocuments({ createdBy: req.user.id });

        if (staffCount >= limit) {
            return res.status(403).json({
                success: false,
                message: `Upgrade Required: Your ${plan} plan is limited to ${limit} staff members.`,
                limitReached: true,
                plan: plan
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
