const express = require('express');
const router = express.Router();
const { 
    updateProfile, addStaff, getStaff, 
    getStaffStats, getPublicUser, toggleUserSuspension 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/public/:shopSlug', getPublicUser);
router.put('/profile', protect, updateProfile);
router.post('/staff', protect, addStaff);
router.get('/staff', protect, getStaff);
router.get('/staff/:id/stats', protect, getStaffStats);
router.put('/:id/suspend', protect, toggleUserSuspension);

module.exports = router;
