const express = require('express');
const router = express.Router();
const { getPaymentConfig, updatePaymentConfig } = require('../controllers/paymentController');
const {
    createRegistrationOrder,
    verifyRegistrationOrder,
    handleCashfreeWebhook,
    createSubscriptionOrder,
    verifySubscriptionOrder,
    getCashfreeStatus,
    getCashfreeCheckoutOrder,
    getCashfreeWebhookEvents
} = require('../controllers/cashfreeController');
const { protect } = require('../middleware/authMiddleware');

// Browser-friendly health check. Cashfree must deliver actual webhook events using POST.
router.get('/cashfree/webhook', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Cashfree webhook endpoint is active.',
        endpoint: '/api/payments/cashfree/webhook',
        acceptedMethod: 'POST',
        note: 'This GET response is only a health check. Cashfree event delivery must use POST with a valid webhook signature.'
    });
});
router.post('/cashfree/webhook', handleCashfreeWebhook);
router.get('/cashfree/status', protect, getCashfreeStatus);
router.get('/cashfree/checkout', protect, getCashfreeCheckoutOrder);
router.get('/cashfree/webhooks', protect, require('../middleware/authMiddleware').admin, getCashfreeWebhookEvents);
router.post('/registration/order', protect, createRegistrationOrder);
router.get('/registration/verify', protect, verifyRegistrationOrder);
router.post('/cashfree/subscription/order', protect, createSubscriptionOrder);
router.get('/cashfree/subscription/verify', protect, verifySubscriptionOrder);

router.use(protect);
router.get('/', getPaymentConfig);
router.post('/', updatePaymentConfig);

module.exports = router;
