const express = require('express');
const router = express.Router();
const { getCustomers, getCustomerDetails, createCustomer, updateCustomer } = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getCustomers);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.get('/:phone', getCustomerDetails);

module.exports = router;
