const User = require('../models/User');
const Plan = require('../models/Plan');

// @desc    Get all active plans (Public)
exports.getPublicPlans = async (req, res) => {
    try {
        const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
        res.json({ success: true, data: plans });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Activate 7-Day Pro Trial
// @route   POST /api/subscriptions/activate-trial
exports.activateTrial = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (user.isTrialUsed) {
            return res.status(400).json({ success: false, message: 'You have already used your free trial.' });
        }

        // Set to Professional for 7 days
        user.subscriptionPlan = 'Professional';
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 7);
        user.planExpiresAt = expiry;
        user.isTrialUsed = true;

        await user.save();

        res.json({ 
            success: true, 
            message: '7-Day Professional Trial Activated! Enjoy unlimited potential.',
            data: user 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create/Update Plan (Admin)
exports.upsertPlan = async (req, res) => {
    try {
        const { name, price, description, maxProducts, maxStaff, features, isRecommended } = req.body;
        
        const plan = await Plan.findOneAndUpdate(
            { name },
            { name, price, description, maxProducts, maxStaff, features, isRecommended },
            { upsert: true, new: true }
        );

        res.json({ success: true, data: plan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.requestUpgrade = async (req, res) => {
    try {
        const { plan, screenshot } = req.body;
        const user = await User.findById(req.user._id);
        
        user.pendingSubscription = {
            plan,
            screenshot,
            requestedAt: new Date(),
            status: 'Pending'
        };

        await user.save();
        res.json({ success: true, message: 'Upgrade request submitted!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPendingRequests = async (req, res) => {
    try {
        const requests = await User.find({ 'pendingSubscription.status': 'Pending' })
            .select('shopName ownerName phone email pendingSubscription subscriptionPlan');
        res.json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.verifySubscription = async (req, res) => {
    try {
        const { userId, status, months = 12 } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (status === 'Approved') {
            const requestedPlan = user.pendingSubscription.plan;
            user.subscriptionPlan = requestedPlan;
            const expiry = new Date();
            expiry.setMonth(expiry.getMonth() + months);
            user.planExpiresAt = expiry;
            user.subscriptionHistory.push({
                plan: requestedPlan,
                startDate: new Date(),
                endDate: expiry,
                paymentRef: 'Manual Admin Approval'
            });
            user.pendingSubscription.status = 'None';
        } else {
            user.pendingSubscription.status = 'Rejected';
        }

        await user.save();
        res.json({ success: true, message: `Subscription ${status} successfully.` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
