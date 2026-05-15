const Notification = require('../models/Notification');

/**
 * Automatically delete notifications based on their type and age:
 * - Critical (Expiry, System): 3 days
 * - Stock Related (Stock): 2 days
 * - Promotional (Sale, Broadcast): 1 day
 */
const cleanupNotifications = async () => {
    try {
        const now = new Date();

        // 1. Promotional: Delete if older than 1 day
        const promoCutoff = new Date(now);
        promoCutoff.setDate(now.getDate() - 1);
        await Notification.deleteMany({
            type: { $in: ['Sale', 'Broadcast'] },
            createdAt: { $lt: promoCutoff }
        });

        // 2. Stock Related: Delete if older than 2 days
        const stockCutoff = new Date(now);
        stockCutoff.setDate(now.getDate() - 2);
        await Notification.deleteMany({
            type: 'Stock',
            createdAt: { $lt: stockCutoff }
        });

        // 3. Critical: Delete if older than 3 days
        const criticalCutoff = new Date(now);
        criticalCutoff.setDate(now.getDate() - 3);
        await Notification.deleteMany({
            type: { $in: ['Expiry', 'System'] },
            createdAt: { $lt: criticalCutoff }
        });

        console.log('[NotificationCleanup] Purge cycle completed.');
    } catch (error) {
        console.error('[NotificationCleanup] Error during purge cycle:', error);
    }
};

// Run every 24 hours
const startNotificationCleanupTask = () => {
    cleanupNotifications(); // Run once on startup
    setInterval(cleanupNotifications, 24 * 60 * 60 * 1000); // Repeat every 24 hours
};

module.exports = { startNotificationCleanupTask };
