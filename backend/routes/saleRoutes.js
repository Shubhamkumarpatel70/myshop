const express = require('express');
const router = express.Router();
const { createSale, getSales, getSaleById, returnProduct, getPublicSale } = require('../controllers/saleController');
const { protect } = require('../middleware/authMiddleware');

router.get('/public/:id', getPublicSale);

router.use(protect);

router.route('/')
    .post(createSale)
    .get(getSales);

router.post('/return-product', returnProduct);
router.get('/:id', getSaleById);

module.exports = router;
