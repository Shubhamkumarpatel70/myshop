const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        // Auto-delete expired notifications
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

        await Notification.deleteMany({
            $or: [
                { type: 'Broadcast', createdAt: { $lt: oneDayAgo } },
                { type: 'Stock', createdAt: { $lt: twoDaysAgo } },
                { type: 'Expiry', createdAt: { $lt: threeDaysAgo } }, // Critical/Expiry
                { type: 'System', createdAt: { $lt: threeDaysAgo } }, // Critical/System
                { type: { $nin: ['Broadcast', 'Stock', 'Expiry', 'System'] }, createdAt: { $lt: twoDaysAgo } }
            ]
        });

        const notifications = await Notification.find({ 
            $or: [
                { user: req.shopOwnerId },
                { isBroadcast: true }
            ]
        }).sort({ createdAt: -1 }).limit(50);
        
        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { _id: req.params.id, user: req.shopOwnerId },
            { isRead: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.shopOwnerId, isRead: false },
            { isRead: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, user: req.shopOwnerId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send Broadcast to all users (Admin Only)
exports.sendBroadcast = async (req, res) => {
    try {
        const { title, message, type } = req.body;
        
        const broadcast = await Notification.create({
            title,
            message,
            type: type || 'Broadcast',
            isBroadcast: true
        });

        res.status(201).json({ success: true, data: broadcast });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
