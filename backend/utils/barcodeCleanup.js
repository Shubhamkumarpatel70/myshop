const Barcode = require('../models/Barcode');

const cleanupUnlinkedBarcodes = async () => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Delete barcodes that are still 'Generated' (not 'Linked') and older than 7 days
        const result = await Barcode.deleteMany({
            status: 'Generated',
            createdAt: { $lt: sevenDaysAgo }
        });

        if (result.deletedCount > 0) {
            console.log(`[BarcodeCleanup] Purged ${result.deletedCount} unlinked barcodes older than 7 days.`);
        }
    } catch (error) {
        console.error('[BarcodeCleanup] Error during protocol execution:', error);
    }
};

// Run every 24 hours
const startBarcodeCleanupTask = () => {
    cleanupUnlinkedBarcodes(); // Run once on startup
    setInterval(cleanupUnlinkedBarcodes, 24 * 60 * 60 * 1000); // Repeat every 24 hours
};

module.exports = { startBarcodeCleanupTask };
