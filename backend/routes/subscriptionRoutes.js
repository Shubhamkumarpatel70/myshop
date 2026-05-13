const express = require('express');
const router = express.Router();
const { 
    requestUpgrade, 
    getPendingRequests, 
    verifySubscription, 
    getPublicPlans, 
    activateTrial,
    upsertPlan 
} = require('../controllers/subscriptionController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public
router.get('/plans', getPublicPlans);

// Shop Owner
router.post('/request', protect, requestUpgrade);
router.post('/activate-trial', protect, activateTrial);

// Admin
router.get('/admin/requests', protect, adminOnly, getPendingRequests);
router.post('/admin/verify', protect, adminOnly, verifySubscription);
router.post('/admin/plans', protect, adminOnly, upsertPlan);

module.exports = router;
