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
    getCashfreeCheckoutOrder
} = require('../controllers/cashfreeController');
const { protect } = require('../middleware/authMiddleware');

router.post('/cashfree/webhook', handleCashfreeWebhook);
router.get('/cashfree/status', protect, getCashfreeStatus);
router.get('/cashfree/checkout', protect, getCashfreeCheckoutOrder);
router.post('/registration/order', protect, createRegistrationOrder);
router.get('/registration/verify', protect, verifyRegistrationOrder);
router.post('/cashfree/subscription/order', protect, createSubscriptionOrder);
router.get('/cashfree/subscription/verify', protect, verifySubscriptionOrder);

router.use(protect);
router.get('/', getPaymentConfig);
router.post('/', updatePaymentConfig);

module.exports = router;
