const User = require('../models/User');

// @desc    Request a subscription upgrade (Manual Payment)
// @route   POST /api/subscriptions/request
exports.requestUpgrade = async (req, res) => {
    try {
        const { plan, screenshot } = req.body;
        
        if (!['Professional', 'Enterprise'].includes(plan)) {
            return res.status(400).json({ success: false, message: 'Invalid plan selected' });
        }

        const user = await User.findById(req.user._id);
        
        user.pendingSubscription = {
            plan,
            screenshot,
            requestedAt: new Date(),
            status: 'Pending'
        };

        await user.save();

        res.json({ 
            success: true, 
            message: 'Upgrade request submitted! Admin will verify your payment shortly.' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all pending subscription requests (Admin Only)
// @route   GET /api/subscriptions/admin/requests
exports.getPendingRequests = async (req, res) => {
    try {
        const requests = await User.find({ 'pendingSubscription.status': 'Pending' })
            .select('shopName ownerName phone email pendingSubscription subscriptionPlan');
            
        res.json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Approve/Reject subscription (Admin Only)
// @route   POST /api/subscriptions/admin/verify
exports.verifySubscription = async (req, res) => {
    try {
        const { userId, status, reason, months = 12 } = req.body;
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (status === 'Approved') {
            const requestedPlan = user.pendingSubscription.plan;
            
            // Update User Plan
            user.subscriptionPlan = requestedPlan;
            
            // Calculate Expiry (default 1 year)
            const expiry = new Date();
            expiry.setMonth(expiry.getMonth() + months);
            user.planExpiresAt = expiry;

            // Add to History
            user.subscriptionHistory.push({
                plan: requestedPlan,
                startDate: new Date(),
                endDate: expiry,
                paymentRef: 'Manual Admin Approval'
            });

            user.pendingSubscription.status = 'None';
        } else {
            user.pendingSubscription.status = 'Rejected';
            // Optional: store rejection reason
        }

        await user.save();

        res.json({ 
            success: true, 
            message: `Subscription ${status === 'Approved' ? 'activated' : 'rejected'} successfully.` 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
