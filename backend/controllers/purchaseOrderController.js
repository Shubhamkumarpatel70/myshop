const mongoose = require('mongoose');
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
    const session = await mongoose.startSession();
    try {
        const { status } = req.body;
        const allowedStatuses = ['Pending', 'Sent', 'Received', 'Cancelled'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Choose a valid order status.' });
        }

        let updatedOrder;
        await session.withTransaction(async () => {
            const po = await PurchaseOrder.findOne({ _id: req.params.id, user: req.shopOwnerId }).session(session);
            if (!po) throw Object.assign(new Error('Purchase order not found.'), { statusCode: 404 });

            // Receive stock once only. Reopening or changing the order status cannot add the same stock twice.
            if (status === 'Received' && !po.receivedAt) {
                const InventoryLog = require('../models/InventoryLog');
                for (const item of po.items) {
                    const product = await Product.findOne({ _id: item.productId, user: req.shopOwnerId }).session(session);
                    if (!product) throw Object.assign(new Error(`Product "${item.productName}" was not found in this shop.`), { statusCode: 404 });

                    const oldQuantity = Number(product.quantity || 0);
                    const receivedQuantity = Number(item.quantity || 0);
                    if (!Number.isFinite(receivedQuantity) || receivedQuantity <= 0) {
                        throw Object.assign(new Error('Every order item must have a quantity greater than zero.'), { statusCode: 400 });
                    }

                    const batchNumber = `PO-${po.poNumber}`;
                    const existingBatch = product.batches.find(batch => batch.batchNumber === batchNumber);
                    if (existingBatch) existingBatch.quantity += receivedQuantity;
                    else product.batches.push({
                        batchNumber,
                        quantity: receivedQuantity,
                        expiryDate: product.expiryDate,
                        price: product.price,
                        purchasePrice: Number(item.expectedPrice || product.purchasePrice || 0),
                        supplier: po.supplierName || ''
                    });

                    product.quantity = oldQuantity + receivedQuantity;
                    if (Number(item.expectedPrice) > 0) product.purchasePrice = Number(item.expectedPrice);
                    await product.save({ session });

                    await InventoryLog.create([{
                        product: product._id,
                        user: req.user._id,
                        shop: req.shopOwnerId,
                        action: 'Restock',
                        reason: `Received from purchase order #${po.poNumber}`,
                        previousQuantity: oldQuantity,
                        newQuantity: product.quantity,
                        price: Number(item.expectedPrice || product.price || 0),
                        batchNumber
                    }], { session });
                }
                po.receivedAt = new Date();
            }

            po.status = status;
            await po.save({ session });
            updatedOrder = po;
        });

        res.json({ success: true, data: updatedOrder });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Could not update purchase order.' });
    } finally {
        await session.endSession();
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
