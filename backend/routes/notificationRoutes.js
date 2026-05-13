const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, createBroadcast, markSingleAsRead, deleteNotification } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.put('/mark-read', markAsRead);
router.put('/:id/read', markSingleAsRead);
router.delete('/:id', deleteNotification);
router.post('/broadcast', authorize('super_admin'), createBroadcast);

module.exports = router;
