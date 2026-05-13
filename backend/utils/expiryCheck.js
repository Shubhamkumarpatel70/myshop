const Product = require('../models/Product');
const { sendNotification } = require('./notificationUtils');

const checkExpiringProducts = async () => {
    try {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        // Find products with batches expiring within 30 days
        const products = await Product.find({
            'batches.expiryDate': {
                $gte: today,
                $lte: thirtyDaysFromNow
            }
        });

        for (const product of products) {
            // Find specific expiring batches
            const expiringBatches = product.batches.filter(b => 
                b.expiryDate >= today && b.expiryDate <= thirtyDaysFromNow
            );

            if (expiringBatches.length > 0) {
                const batchList = expiringBatches.map(b => b.batchNumber || 'N/A').join(', ');
                await sendNotification(
                    product.user,
                    'Expiry Warning',
                    `Product "${product.productName}" has batches (${batchList}) expiring within 30 days.`,
                    'Expiry'
                );
            }
        }
        console.log(`[ExpiryCheck] Processed ${products.length} products with near-expiry batches.`);
    } catch (error) {
        console.error('[ExpiryCheck] Error:', error);
    }
};

module.exports = { checkExpiringProducts };
