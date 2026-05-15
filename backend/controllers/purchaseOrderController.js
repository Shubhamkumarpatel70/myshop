const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

const generatePONumber = () => {
    return 'PO-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
};

exports.getPOs = async (req, res) => {
    try {
        const pos = await PurchaseOrder.find({ user: req.shopOwnerId })
            .populate('supplier', 'name phone email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: pos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createPO = async (req, res) => {
    try {
        const po = await PurchaseOrder.create({
            ...req.body,
            poNumber: generatePONumber(),
            user: req.shopOwnerId
        });
        res.status(201).json({ success: true, data: po });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updatePOStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const po = await PurchaseOrder.findOne({ _id: req.params.id, user: req.shopOwnerId });
        
        if (!po) return res.status(404).json({ success: false, message: 'PO not found' });

        // If marking as received, update inventory
        if (status === 'Received' && po.status !== 'Received') {
            const InventoryLog = require('../models/InventoryLog');
            
            for (const item of po.items) {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.quantity += item.quantity;
                    // If PO has updated price, update product cost price
                    if (item.expectedPrice > 0) {
                        product.purchasePrice = item.expectedPrice;
                    }
                    await product.save();

                    // Log the inventory change
                    // Log the inventory change for Stock Ledger
                    await InventoryLog.create({
                        product: product._id,
                        user: req.user._id,
                        shop: req.shopOwnerId,
                        action: 'Restock',
                        reason: `Received from PO #${po.poNumber}`,
                        previousQuantity: product.quantity - item.quantity,
                        newQuantity: product.quantity,
                        price: item.expectedPrice || product.price,
                        batchNumber: 'PO-' + (po.poNumber.split('-')[1] || 'Batch')
                    });
                }
            }
        }

        po.status = status;
        await po.save();
        
        res.json({ success: true, data: po });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updatePO = async (req, res) => {
    try {
        const po = await PurchaseOrder.findOneAndUpdate(
            { _id: req.params.id, user: req.shopOwnerId },
            { ...req.body },
            { new: true }
        );
        if (!po) return res.status(404).json({ success: false, message: 'PO not found' });
        res.json({ success: true, data: po });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deletePO = async (req, res) => {
    try {
        await PurchaseOrder.findOneAndDelete({ _id: req.params.id, user: req.shopOwnerId });
        res.json({ success: true, message: 'PO deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdminPOs = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        const pos = await PurchaseOrder.find()
            .populate('user', 'shopName ownerName shopId')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: pos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPOById = async (req, res) => {
    try {
        const filter = req.user.role === 'super_admin' ? { _id: req.params.id } : { _id: req.params.id, user: req.shopOwnerId };
        const po = await PurchaseOrder.findOne(filter)
            .populate('user', 'shopName ownerName shopId address phone')
            .populate('supplier', 'name phone email address');
        
        if (!po) return res.status(404).json({ success: false, message: 'PO not found' });
        res.json({ success: true, data: po });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
