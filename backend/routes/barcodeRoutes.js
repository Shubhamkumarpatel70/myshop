const express = require('express');
const router = express.Router();
const { generateBarcode, lookupBarcode, getBarcodes, getShopBarcodes, deleteBarcode } = require('../controllers/barcodeController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateBarcode);
router.get('/shop', protect, getShopBarcodes);
router.get('/lookup/:barcode', protect, lookupBarcode);
router.delete('/:id', protect, deleteBarcode);
router.get('/admin', protect, admin, getBarcodes);

module.exports = router;
