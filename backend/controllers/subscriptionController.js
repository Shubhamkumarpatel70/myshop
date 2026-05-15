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
        const { name, price, description, maxProducts, maxStaff, maxBarcodes, features, isRecommended } = req.body;
        
        const plan = await Plan.findOneAndUpdate(
            { name },
            { name, price, description, maxProducts, maxStaff, maxBarcodes, features, isRecommended },
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
        const { userId, status, months = 12, reason = '' } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (status === 'Approved') {
            const requestedPlan = user.pendingSubscription.plan;
            const isAddon = user.pendingSubscription.isAddon;

            if (isAddon && requestedPlan === 'Barcode Booster') {
                user.hasBarcodeAddon = true;
                user.subscriptionPlan = 'Enterprise'; // Automatically upgrade label to Enterprise as requested
            } else {
                user.subscriptionPlan = requestedPlan;
                const now = new Date();
                const expiry = new Date();
                expiry.setMonth(expiry.getMonth() + months);
                user.planExpiresAt = expiry;
                user.planActivatedAt = now;
                user.subscriptionHistory.push({
                    plan: requestedPlan,
                    startDate: now,
                    endDate: expiry,
                    paymentRef: 'Manual Admin Approval'
                });
            }
            user.pendingSubscription.status = 'None';
            user.pendingSubscription.rejectReason = '';
        } else {
            user.pendingSubscription.status = 'Rejected';
            user.pendingSubscription.rejectReason = reason;
        }

        await user.save();
        res.json({ success: true, message: `Subscription ${status} successfully.` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Request Cancellation
exports.requestCancellation = async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findById(req.user._id);

        if (user.subscriptionPlan === 'Free') {
            return res.status(400).json({ success: false, message: 'You are on the Free plan.' });
        }

        user.cancellationRequest = {
            status: 'Pending',
            reason,
            requestedAt: new Date()
        };

        await user.save();
        res.json({ success: true, message: 'Cancellation request submitted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin: Process Cancellation
exports.processCancellation = async (req, res) => {
    try {
        const { userId, status, rejectReason } = req.body;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.cancellationRequest.status = status;
        user.cancellationRequest.processedAt = new Date();

        if (status === 'Approved') {
            // Plan stays until refund is finished or terminated? 
            // User requested: "if approve then dynamic show your refund initiated within 5-7 days"
            // "and in admin dashboard show refund button when click then show a popup model with utr number"
            user.cancellationRequest.rejectReason = '';
        } else {
            user.cancellationRequest.rejectReason = rejectReason;
        }

        await user.save();
        res.json({ success: true, message: `Cancellation ${status} successfully.` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin: Update Refund UTR
exports.updateRefundUtr = async (req, res) => {
    try {
        const { userId, utr } = req.body;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.cancellationRequest.refundUtr = utr;
        // Upon refund, maybe terminate the plan?
        user.subscriptionPlan = 'Free';
        user.planExpiresAt = null;

        await user.save();
        res.json({ success: true, message: 'Refund UTR updated and plan terminated.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin: Update Subscription (Manual)
exports.updateSubscription = async (req, res) => {
    try {
        const { userId, plan, expiresAt } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (plan) user.subscriptionPlan = plan;
        if (expiresAt) user.planExpiresAt = new Date(expiresAt);

        await user.save();
        res.json({ success: true, message: 'Subscription updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin: Terminate Subscription
exports.terminateSubscription = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.subscriptionPlan = 'Free';
        user.planExpiresAt = null;
        user.planActivatedAt = null;

        await user.save();
        res.json({ success: true, message: 'Subscription terminated. User reset to Free plan.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin: Toggle User Suspension
exports.toggleSuspension = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.isSuspended = !user.isSuspended;
        await user.save();
        res.json({ success: true, message: `Account ${user.isSuspended ? 'suspended' : 'unsuspended'} successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin: Get All Subscriptions
exports.getSubscriptions = async (req, res) => {
    try {
        const users = await User.find({ role: 'shop_owner' })
            .select('shopName ownerName phone email subscriptionPlan planExpiresAt planActivatedAt cancellationRequest isSuspended pendingSubscription');
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin: Get Revenue Stats
exports.getRevenueStats = async (req, res) => {
    try {
        const users = await User.find({ role: 'shop_owner' });
        
        let totalEarnings = 0;
        let planDistribution = { 'Free': 0, 'Professional': 0, 'Enterprise': 0 };
        let activeSubscriptions = 0;

        users.forEach(user => {
            // Plan distribution
            planDistribution[user.subscriptionPlan] = (planDistribution[user.subscriptionPlan] || 0) + 1;
            
            if (user.subscriptionPlan !== 'Free') activeSubscriptions++;

            // Sum historical earnings
            if (user.subscriptionHistory) {
                user.subscriptionHistory.forEach(h => {
                    totalEarnings += (h.amount || 0);
                });
            }
        });

        res.json({ 
            success: true, 
            data: {
                totalEarnings,
                planDistribution,
                activeSubscriptions,
                totalShops: users.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// @desc    Request Add-on (e.g., Barcodes)
exports.requestAddon = async (req, res) => {
    try {
        const { addon, screenshot } = req.body;
        const user = await User.findById(req.user._id);
        
        user.pendingSubscription = {
            plan: addon, // Using plan field to store addon name for simplicity
            screenshot,
            requestedAt: new Date(),
            status: 'Pending',
            isAddon: true // New field to distinguish
        };

        await user.save();
        res.json({ success: true, message: `${addon} request submitted!` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin: Delete Plan
exports.deletePlan = async (req, res) => {
    try {
        const { id } = req.params;
        await Plan.findByIdAndDelete(id);
        res.json({ success: true, message: 'Plan deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
