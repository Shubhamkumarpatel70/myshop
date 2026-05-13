const express = require('express');
const router = express.Router();
const { openShift, closeShift, getCurrentShift, getShifts } = require('../controllers/shiftController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/open', checkPermission('MANAGE_SHIFT'), openShift);
router.post('/close', checkPermission('MANAGE_SHIFT'), closeShift);
router.get('/current', checkPermission('MANAGE_SHIFT'), getCurrentShift);
router.get('/', checkPermission('VIEW_AUDIT_LOG'), getShifts);

module.exports = router;
