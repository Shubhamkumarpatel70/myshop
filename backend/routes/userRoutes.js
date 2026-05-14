const express = require('express');
const router = express.Router();
const { 
    updateProfile, addStaff, getStaff, 
    getStaffStats, getPublicUser, toggleUserSuspension,
    getPublicShops, getPublicShopDetails
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { checkStaffLimit } = require('../middleware/limitMiddleware');

router.get('/public/shops', getPublicShops);
router.get('/public/shops/:id', getPublicShopDetails);
router.get('/public/:shopSlug', getPublicUser);
router.put('/profile', protect, updateProfile);
router.post('/staff', protect, checkStaffLimit, addStaff);
router.get('/staff', protect, getStaff);
router.get('/staff/:id/stats', protect, getStaffStats);
router.put('/:id/suspend', protect, toggleUserSuspension);

module.exports = router;
