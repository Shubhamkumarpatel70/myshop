const Notification = require('../models/Notification');

/**
 * Send a notification to a specific user
 * @param {string} userId - ID of the user to receive the notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (Stock, Expiry, Sale, System, Broadcast)
 */
const sendNotification = async (userId, title, message, type = 'System') => {
    try {
        await Notification.create({
            user: userId,
            title,
            message,
            type
        });
    } catch (error) {
        console.error('Failed to send notification:', error);
    }
};

module.exports = { sendNotification };
