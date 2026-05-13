const express = require('express');
const router = express.Router();
const { 
    requestUpgrade, 
    getPendingRequests, 
    verifySubscription, 
    getPublicPlans, 
    activateTrial,
    upsertPlan,
    requestCancellation,
    processCancellation,
    updateRefundUtr,
    getSubscriptions
} = require('../controllers/subscriptionController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public
router.get('/plans', getPublicPlans);

// Shop Owner
router.post('/request', protect, requestUpgrade);
router.post('/activate-trial', protect, activateTrial);
router.post('/cancel', protect, requestCancellation);

// Admin
router.get('/admin/requests', protect, adminOnly, getPendingRequests);
router.post('/admin/verify', protect, adminOnly, verifySubscription);
router.post('/admin/plans', protect, adminOnly, upsertPlan);
router.get('/admin/all', protect, adminOnly, getSubscriptions);
router.post('/admin/process-cancel', protect, adminOnly, processCancellation);
router.post('/admin/refund', protect, adminOnly, updateRefundUtr);

module.exports = router;
