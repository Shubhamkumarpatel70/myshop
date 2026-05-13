const express = require('express');
const router = express.Router();
const { getPaymentConfig, updatePaymentConfig } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getPaymentConfig);
router.post('/', updatePaymentConfig);

module.exports = router;
