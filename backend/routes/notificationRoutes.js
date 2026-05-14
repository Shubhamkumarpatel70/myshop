const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, deleteNotification, sendBroadcast } = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.post('/broadcast', admin, sendBroadcast);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
