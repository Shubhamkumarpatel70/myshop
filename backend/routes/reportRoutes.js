const express = require('express');
const router = express.Router();
const { getDashboardStats, getSalesAnalytics, getAdminStats, getGlobalActivity } = require('../controllers/reportController');
const { protect, authorize, admin } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/sales', getSalesAnalytics);
router.get('/admin-stats', admin, getAdminStats);
router.get('/activity', admin, getGlobalActivity);

module.exports = router;
