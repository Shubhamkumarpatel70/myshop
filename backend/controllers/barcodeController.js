const Barcode = require('../models/Barcode');
const User = require('../models/User');

// Generate a valid EAN-13 barcode
exports.generateBarcode = async (req, res) => {
    try {
        let unique = false;
        let barcodeStr = '';
        
        while (!unique) {
            // Generate first 12 digits
            let digits = '';
            for (let i = 0; i < 12; i++) {
                digits += Math.floor(Math.random() * 10).toString();
            }

            // Calculate EAN-13 Checksum
            let sum = 0;
            for (let i = 0; i < 12; i++) {
                let digit = parseInt(digits[i]);
                // Even positions (1-indexed 2,4,6...) are multiplied by 3
                // In 0-indexing, these are indices 1, 3, 5...
                sum += (i % 2 === 0) ? digit : digit * 3;
            }
            let checkDigit = (10 - (sum % 10)) % 10;
            barcodeStr = digits + checkDigit.toString();

            const existing = await Barcode.findOne({ barcode: barcodeStr });
            if (!existing) unique = true;
        }

        const shop = await User.findById(req.shopOwnerId);
        
        // Plan Enforcement Logic
        const planLimits = {
            'Free': 30,
            'Professional': 80,
            'Enterprise': Infinity
        };

        const currentLimit = planLimits[shop.subscriptionPlan] || 30;
        const hasAddon = shop.hasBarcodeAddon;

        if (!hasAddon && shop.barcodeUsedCount >= currentLimit) {
            return res.status(403).json({ 
                success: false, 
                message: `Subscription limit reached (${currentLimit}). Upgrade to Professional or Enterprise for more barcodes, or purchase the Barcode Add-on.` 
            });
        }

        const barcode = await Barcode.create({
            barcode: barcodeStr,
            user: req.shopOwnerId,
            shopName: shop ? shop.shopName : 'Unknown',
            status: 'Generated'
        });

        // Increment Usage
        shop.barcodeUsedCount += 1;
        await shop.save();

        res.status(201).json({ 
            success: true, 
            barcode: barcodeStr,
            usage: {
                used: shop.barcodeUsedCount,
                limit: currentLimit,
                isUnlimited: hasAddon || currentLimit === Infinity
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lookup barcode details for auto-fill
exports.lookupBarcode = async (req, res) => {
    try {
        const { barcode } = req.params;
        const data = await Barcode.findOne({ barcode });
        
        if (!data) {
            return res.status(404).json({ 
                success: false, 
                message: 'Barcode not found in global registry' 
            });
        }

        res.json({ 
            success: true, 
            data: {
                productName: data.productName,
                productImage: data.productImage
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all barcodes for a specific shop
exports.getShopBarcodes = async (req, res) => {
    try {
        const barcodes = await Barcode.find({ user: req.shopOwnerId })
            .sort({ createdAt: -1 });
            
        res.json({ success: true, data: barcodes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all barcodes (Admin Only)
exports.getBarcodes = async (req, res) => {
    try {
        const barcodes = await Barcode.find()
            .sort({ createdAt: -1 })
            .populate('user', 'ownerName shopName');
            
        res.json({ success: true, data: barcodes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteBarcode = async (req, res) => {
    try {
        const barcode = await Barcode.findOne({ 
            _id: req.params.id,
            user: req.shopOwnerId // Ensure ownership
        });

        if (!barcode) {
            return res.status(404).json({ success: false, message: 'Barcode not found or unauthorized' });
        }

        await Barcode.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Barcode deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Internal utility to register/update barcode metadata
exports.registerMetadata = async (barcodeStr, productName, productImage, userId) => {
    try {
        const shop = await User.findById(userId);
        await Barcode.findOneAndUpdate(
            { barcode: barcodeStr },
            { 
                productName, 
                productImage, 
                user: userId,
                shopName: shop ? shop.shopName : 'Unknown',
                status: 'Linked'
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('Error registering barcode metadata:', error);
    }
};
