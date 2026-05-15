const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { 
    getPendingApprovals, 
    updateApprovalStatus, 
    getGlobalSettings, 
    updateGlobalSettings,
    confirmRegistrationPayment,
    getShopById,
    impersonateUser
} = require('../controllers/adminController');

// Publicly accessible settings (for maintenance check and payment info)
router.get('/settings', getGlobalSettings);

// All other routes here are protected
router.use(protect);

// Shop owner specific
router.post('/confirm-payment', confirmRegistrationPayment);

// Admin only routes
router.get('/pending-approvals', admin, getPendingApprovals);
router.put('/approvals/:id', admin, updateApprovalStatus);
router.get('/shop-lookup/:shopId', admin, getShopById);
router.post('/impersonate/:id', admin, impersonateUser);
router.put('/settings', admin, updateGlobalSettings);

module.exports = router;
