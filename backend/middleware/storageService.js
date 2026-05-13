const multer = require('multer');
const path = require('path');

// Local Storage Strategy (Current)
const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'uploads/';
        if (file.fieldname === 'screenshot') folder += 'payments/';
        if (file.fieldname === 'image') folder += 'products/';
        if (file.fieldname === 'aadharImage') folder += 'kyc/';
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const uploadLocal = multer({ 
    storage: localStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) return cb(null, true);
        cb(new Error('Only images (JPEG, PNG, WEBP) are allowed'));
    }
});

// Cloudinary Strategy (Template for User to Fill)
// const cloudinary = require('cloudinary').v2;
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// cloudinary.config({ 
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//     api_key: process.env.CLOUDINARY_API_KEY, 
//     api_secret: process.env.CLOUDINARY_API_SECRET 
// });
// const cloudStorage = new CloudinaryStorage({ cloudinary, params: { folder: 'myshop' } });
// const uploadCloud = multer({ storage: cloudStorage });

// Export the active one
module.exports = uploadLocal; 
