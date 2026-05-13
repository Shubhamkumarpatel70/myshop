const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { 
    getPendingApprovals, 
    updateApprovalStatus, 
    getGlobalSettings, 
    updateGlobalSettings,
    confirmRegistrationPayment,
    getShopById
} = require('../controllers/adminController');

// All routes here are protected
router.use(protect);

// Shop owner specific
router.post('/confirm-payment', confirmRegistrationPayment);

// Admin only routes
router.get('/pending-approvals', admin, getPendingApprovals);
router.put('/approvals/:id', admin, updateApprovalStatus);
router.get('/shop-lookup/:shopId', admin, getShopById);
router.get('/settings', getGlobalSettings); // Everyone needs to see settings for payment
router.put('/settings', admin, updateGlobalSettings);

module.exports = router;
