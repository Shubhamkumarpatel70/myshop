const express = require('express');
const router = express.Router();
const { requestUpgrade, getPendingRequests, verifySubscription } = require('../controllers/subscriptionController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

// Shop Owner Routes
router.post('/request', requestUpgrade);

// Admin Only Routes
router.get('/admin/requests', adminOnly, getPendingRequests);
router.post('/admin/verify', adminOnly, verifySubscription);

module.exports = router;
