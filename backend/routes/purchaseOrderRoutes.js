const express = require('express');
const router = express.Router();
const { getPOs, createPO, updatePOStatus, deletePO, getAdminPOs } = require('../controllers/purchaseOrderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/admin', getAdminPOs);
router.get('/', getPOs);
router.post('/', createPO);
router.patch('/:id/status', updatePOStatus);
router.delete('/:id', deletePO);

module.exports = router;
