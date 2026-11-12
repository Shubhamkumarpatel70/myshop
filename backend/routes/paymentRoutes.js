const express = require('express');
const router = express.Router();
const { getPaymentConfig, updatePaymentConfig } = require('../controllers/paymentController');
const {
    createRegistrationOrder,
    verifyRegistrationOrder,
    handleCashfreeWebhook
} = require('../controllers/cashfreeController');
const { protect } = require('../middleware/authMiddleware');

router.post('/cashfree/webhook', handleCashfreeWebhook);
router.post('/registration/order', protect, createRegistrationOrder);
router.get('/registration/verify', protect, verifyRegistrationOrder);

router.use(protect);
router.get('/', getPaymentConfig);
router.post('/', updatePaymentConfig);

module.exports = router;
