const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ 
            $or: [
                { user: req.user._id },
                { isBroadcast: true }
            ]
        }).sort({ createdAt: -1 }).limit(20);
        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
        res.json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markSingleAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
        
        notification.isRead = true;
        await notification.save();
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
        
        await notification.deleteOne();
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createBroadcast = async (req, res) => {
    try {
        const { title, message } = req.body;
        const broadcast = await Notification.create({
            title,
            message,
            type: 'Broadcast',
            isBroadcast: true
        });
        res.status(201).json({ success: true, data: broadcast });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
