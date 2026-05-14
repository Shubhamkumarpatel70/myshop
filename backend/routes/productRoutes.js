const express = require('express');
const router = express.Router();
const { 
    getProducts, createProduct, updateProduct, deleteProduct, 
    getPublicProducts, getPublicProductsByShop 
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

router.get('/public/shop/:shopId', getPublicProductsByShop);
router.get('/public/:shopSlug', getPublicProducts);

const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

router.use(protect);

router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    // Cloudinary returns the secure_url in req.file.path or req.file.secure_url
    res.json({ success: true, url: req.file.path });
});

router.route('/')
    .get(getProducts)
    .post(createProduct);

router.route('/:id')
    .put(updateProduct)
    .delete(deleteProduct);

module.exports = router;
