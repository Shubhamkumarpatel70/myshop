const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const { sendNotification } = require('../utils/notificationUtils');

const generateTransactionId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result.toUpperCase();
};

exports.createSale = async (req, res) => {
    try {
        const { items, customerName, customerPhone, paymentMethod } = req.body;
        
        let totalAmount = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) continue;

            if (product.quantity < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${product.productName}` });
            }

            const itemTotal = item.quantity * item.price;
            totalAmount += itemTotal;

            // Update product quantity (Deduct from earliest batches first - FIFO)
            let remainingToDeduct = item.quantity;
            let usedBatchNumber = 'N/A';
            let usedExpiryDate = null;
            
            product.batches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
            
            for (let batch of product.batches) {
                if (remainingToDeduct <= 0) break;
                if (batch.quantity > 0) {
                    const deduct = Math.min(batch.quantity, remainingToDeduct);
                    batch.quantity -= deduct;
                    remainingToDeduct -= deduct;
                    // Capture the batch info (using the first batch we deduct from for simplicity in snapshot)
                    if (usedBatchNumber === 'N/A') {
                        usedBatchNumber = batch.batchNumber;
                        usedExpiryDate = batch.expiryDate;
                    }
                }
            }

            processedItems.push({
                product: product._id,
                quantity: item.quantity,
                price: item.price,
                purchasePrice: product.purchasePrice || 0,
                mrp: item.mrp || item.price,
                batchNumber: usedBatchNumber,
                expiryDate: usedExpiryDate,
                discount: item.discount || 0,
                total: itemTotal
            });

            const oldQuantity = product.quantity;
            product.quantity -= item.quantity;
            await product.save();

            // Send notification if stock is low
            if (product.quantity <= (product.lowStockThreshold || 10)) {
                await sendNotification(
                    req.shopOwnerId, 
                    'Low Stock Alert', 
                    `Product "${product.productName}" is running low on stock. Only ${product.quantity} units left.`,
                    'Stock'
                );
            }

            // Log inventory
            await InventoryLog.create({
                product: product._id,
                user: req.user._id,
                action: 'Sale',
                previousQuantity: oldQuantity,
                newQuantity: product.quantity,
                reason: `Sold ${item.quantity} units`,
                transactionId: null // Will update after sale creation if possible, or just use a placeholder
            });
        }

        const sale = await Sale.create({
            items: processedItems,
            totalAmount,
            customerName,
            customerPhone,
            paymentMethod,
            utrNumber: req.body.utrNumber,
            transactionId: generateTransactionId(),
            user: req.shopOwnerId,
            processedBy: req.user._id
        });

        // Update logs with real sale ID
        await InventoryLog.updateMany(
            { user: req.user._id, action: 'Sale', createdAt: { $gte: sale.createdAt } },
            { transactionId: sale.transactionId }
        );

        // Notify Shop Owner if a Staff member made the sale
        if (req.user.role === 'Staff') {
            await sendNotification(
                req.shopOwnerId,
                'New Sale Processed',
                `Staff ${req.user.ownerName} processed a new sale of ₹${sale.totalAmount.toLocaleString()}. Transaction ID: ${sale.transactionId}`,
                'Sale'
            );
        }

        res.status(201).json({ success: true, data: sale });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.returnProduct = async (req, res) => {
    try {
        const { saleId, productId, quantity, returnReason } = req.body;
        console.log("Returning Product:", { saleId, productId, quantity, returnReason });

        if (!saleId || !productId) {
            return res.status(400).json({ success: false, message: 'Sale ID and Product ID are required' });
        }

        const sale = await Sale.findById(saleId);
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

        // Authorization check
        if (!req.isAdmin && sale.user.toString() !== req.shopOwnerId.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const item = sale.items.find(i => {
            if (!i.product) return false;
            const itemId = i.product._id ? i.product._id.toString() : i.product.toString();
            return itemId === productId && !i.isReturned;
        });
        
        if (!item) return res.status(400).json({ success: false, message: 'Item not found or already returned' });

        const returnQty = parseInt(quantity) || item.quantity;
        item.isReturned = true;
        item.returnReason = returnReason || 'Customer Return';
        sale.status = 'Partial Return';
        if (sale.items.every(i => i.isReturned)) sale.status = 'Returned';
        
        await sale.save();

        const product = await Product.findById(productId);
        if (product) {
            const oldQuantity = product.quantity;
            product.quantity += returnQty;
            
            // Add back to the first available batch or create one if none exist
            if (product.batches && product.batches.length > 0) {
                product.batches[0].quantity += returnQty;
            } else {
                product.batches = [{
                    quantity: returnQty,
                    expiryDate: product.expiryDate || new Date(),
                    price: product.price
                }];
            }
            
            await product.save();

            await InventoryLog.create({
                product: product._id,
                user: req.user._id,
                action: 'Restock',
                previousQuantity: oldQuantity,
                newQuantity: product.quantity,
                reason: `Returned from sale. Reason: ${returnReason || 'No reason provided'}`,
                transactionId: sale._id
            });
        }

        res.json({ success: true, message: 'Product returned and inventory updated' });
    } catch (error) {
        console.error("RETURN ERROR:", error);
        res.status(500).json({ success: false, message: 'Return failed: ' + error.message });
    }
};

exports.getSales = async (req, res) => {
    try {
        const filter = req.isAdmin ? {} : { user: req.shopOwnerId };
        const sales = await Sale.find(filter)
            .populate('items.product', 'productName')
            .populate('user', 'shopName')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: sales });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSaleById = async (req, res) => {
    try {
        const id = req.params.id;
        let sale;
        
        if (mongoose.Types.ObjectId.isValid(id)) {
            sale = await Sale.findById(id)
                .populate('items.product')
                .populate('user', 'shopName');
        }
        
        if (!sale) {
            sale = await Sale.findOne({ transactionId: id.toUpperCase() })
                .populate('items.product')
                .populate('user', 'shopName');
        }
            
        if (!sale) return res.status(404).json({ success: false, message: 'Transaction ID not found' });
        
        if (!req.isAdmin && sale.user._id.toString() !== req.shopOwnerId.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        res.json({ success: true, data: sale });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Invalid Transaction ID: ' + error.message });
    }
};
