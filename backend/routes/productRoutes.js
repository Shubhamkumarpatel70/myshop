const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct, getPublicProducts } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

router.get('/public/:shopSlug', getPublicProducts);

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/products/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

router.use(protect);

router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    res.json({ success: true, url: `/uploads/products/${req.file.filename}` });
});

router.route('/')
    .get(getProducts)
    .post(createProduct);

router.route('/:id')
    .put(updateProduct)
    .delete(deleteProduct);

module.exports = router;
