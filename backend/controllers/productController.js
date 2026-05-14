const Product = require('../models/Product');
const User = require('../models/User');
const InventoryLog = require('../models/InventoryLog');
const { sendNotification } = require('../utils/notificationUtils');

exports.getProducts = async (req, res) => {
    try {
        let filter = req.isAdmin ? {} : { user: req.shopOwnerId };
        
        // Allow Admin to filter by specific shop/user
        if (req.isAdmin && req.query.user) {
            filter = { user: req.query.user };
        }
        
        const products = await Product.find(filter).populate('category', 'name');
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { productName, barcode, category, quantity, price, purchasePrice, expiryDate, supplier, description, lowStockThreshold, batchNumber } = req.body;
        
        let product = await Product.findOne({ 
            user: req.shopOwnerId,
            $or: [
                { productName: productName },
                { barcode: barcode && barcode !== '' ? barcode : '---' }
            ]
        });

        if (product) {
            // Check if this batch already exists (same batch number AND same expiry)
            const existingBatchIndex = product.batches.findIndex(b => 
                (batchNumber && b.batchNumber === batchNumber) ||
                (b.expiryDate && expiryDate && new Date(b.expiryDate).toDateString() === new Date(expiryDate).toDateString())
            );

            if (existingBatchIndex > -1) {
                product.batches[existingBatchIndex].quantity += quantity;
                product.batches[existingBatchIndex].purchasePrice = purchasePrice || product.batches[existingBatchIndex].purchasePrice;
            } else {
                product.batches.push({ batchNumber, expiryDate, quantity, price, purchasePrice, supplier });
            }

            const oldQuantity = product.quantity;
            product.quantity += quantity;
            product.purchasePrice = purchasePrice || product.purchasePrice; // Update main cost price to latest
            
            // Set main expiry to earliest
            const sortedBatches = [...product.batches].filter(b => b.expiryDate).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
            if (sortedBatches.length > 0) product.expiryDate = sortedBatches[0].expiryDate;
            
            await product.save();

            await InventoryLog.create({
                product: product._id,
                user: req.user._id,
                action: 'Update',
                previousQuantity: oldQuantity,
                newQuantity: product.quantity,
                reason: 'Added new batch: ' + (batchNumber || 'N/A')
            });
        } else {
            product = await Product.create({
                ...req.body,
                user: req.shopOwnerId,
                batches: [{ batchNumber, expiryDate, quantity, price, purchasePrice, supplier }]
            });

            await InventoryLog.create({
                product: product._id,
                user: req.user._id,
                action: 'Add',
                previousQuantity: 0,
                newQuantity: product.quantity,
                reason: 'Initial stock'
            });
        }

        res.status(201).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        if (!req.isAdmin && product.user.toString() !== req.shopOwnerId.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const oldQuantity = product.quantity;
        product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (req.body.quantity !== undefined && req.body.quantity !== oldQuantity) {
            await InventoryLog.create({
                product: product._id,
                user: req.user._id,
                action: 'Update',
                previousQuantity: oldQuantity,
                newQuantity: product.quantity,
                reason: req.body.updateReason || 'Manual update'
            });

            if (req.user.role === 'Staff') {
                await sendNotification(
                    req.shopOwnerId,
                    'Inventory Updated by Staff',
                    `Staff ${req.user.ownerName} updated the quantity of "${product.productName}" from ${oldQuantity} to ${product.quantity}.`,
                    'Stock'
                );
            }
        }

        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        if (!req.isAdmin && product.user.toString() !== req.shopOwnerId.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await product.deleteOne();
        res.json({ success: true, message: 'Product removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPublicProducts = async (req, res) => {
    try {
        const user = await User.findOne({ shopSlug: req.params.shopSlug, isSuspended: false });
        if (!user) return res.status(404).json({ success: false, message: 'Shop not found or suspended' });

        // Products are always linked to the shop owner's ID
        const ownerId = user.role === 'Staff' ? user.createdBy : user._id;

        const products = await Product.find({ user: ownerId })
            .select('productName price quantity productImage description category')
            .populate('category', 'name');
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPublicProductsByShop = async (req, res) => {
    try {
        const products = await Product.find({ user: req.params.shopId })
            .select('productName category sellingPrice quantity unit lowStockThreshold productImage')
            .populate('category', 'name');
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
