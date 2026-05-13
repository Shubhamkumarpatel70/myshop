const express = require('express');
const router = express.Router();
const { getCustomers, getCustomerDetails } = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getCustomers);
router.get('/:phone', getCustomerDetails);

module.exports = router;
