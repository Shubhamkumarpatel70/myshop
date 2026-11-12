const express = require('express');
const router = express.Router();
const { 
    requestUpgrade, 
    requestAddon,
    getPendingRequests, 
    verifySubscription, 
    getPublicPlans, 
    activateTrial,
    upsertPlan,
    requestCancellation,
    processCancellation,
    updateRefundUtr,
    getSubscriptions,
    updateSubscription,
    terminateSubscription,
    toggleSuspension,
    getRevenueStats,
    deletePlan,
    getSubscriptionPayments,
    getAddons,
    getPublicAddons,
    upsertAddon,
    deleteAddon
} = require('../controllers/subscriptionController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public
router.get('/plans', getPublicPlans);
router.get('/addons', protect, getPublicAddons);

// Shop Owner
router.post('/request', protect, requestUpgrade);
router.post('/request-addon', protect, requestAddon);
router.post('/activate-trial', protect, activateTrial);
router.post('/cancel', protect, requestCancellation);

// Admin
router.get('/admin/requests', protect, adminOnly, getPendingRequests);
router.post('/admin/verify', protect, adminOnly, verifySubscription);
router.post('/admin/plans', protect, adminOnly, upsertPlan);
router.get('/admin/addons', protect, adminOnly, getAddons);
router.post('/admin/addons', protect, adminOnly, upsertAddon);
router.delete('/admin/addons/:id', protect, adminOnly, deleteAddon);
router.delete('/admin/plans/:id', protect, adminOnly, deletePlan);
router.get('/admin/all', protect, adminOnly, getSubscriptions);
router.get('/admin/payments', protect, adminOnly, getSubscriptionPayments);
router.post('/admin/process-cancel', protect, adminOnly, processCancellation);
router.post('/admin/refund', protect, adminOnly, updateRefundUtr);
router.put('/admin/update', protect, adminOnly, updateSubscription);
router.post('/admin/terminate', protect, adminOnly, terminateSubscription);
router.post('/admin/toggle-suspension', protect, adminOnly, toggleSuspension);
router.get('/admin/revenue', protect, adminOnly, getRevenueStats);

module.exports = router;
