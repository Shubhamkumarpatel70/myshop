const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getProfile, submitPayment, refresh, checkLockout, toggleStorefront } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const validateRegister = [
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('shopName').notEmpty().withMessage('Shop name is required'),
    body('ownerName').notEmpty().withMessage('Owner name is required'),
    body('phone').isLength({ min: 10 }).withMessage('Valid phone number required')
];

const { storage } = require('../config/cloudinary');
const multer = require('multer');
const kycUpload = multer({ storage });

router.post('/upload-kyc', kycUpload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    res.json({ success: true, url: req.file.path });
});

router.post('/register', validateRegister, register);
router.post('/login', [
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], login);
router.get('/check-lockout', checkLockout);
router.post('/refresh', refresh);
router.get('/profile', protect, getProfile);
router.post('/submit-payment', protect, upload.single('screenshot'), submitPayment);
router.post('/toggle-storefront', protect, toggleStorefront);

module.exports = router;
