const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Shift = require('../models/Shift');
const InventoryLog = require('../models/InventoryLog');
const Customer = require('../models/Customer');
const User = require('../models/User');
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
        if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ success: false, message: 'Add at least one item before checkout.' });
        const shopSettings = await User.findById(req.shopOwnerId).select('gstEnabled gstin businessState');
        const gstEnabled = Boolean(shopSettings?.gstEnabled);
        const sellerStateCode = String(shopSettings?.gstin || '').slice(0, 2);
        const buyerStateCode = String(req.body.customerStateCode || req.body.customerGSTIN || '').slice(0, 2);
        const isInterState = gstEnabled && (req.body.isInterState === true || Boolean(sellerStateCode && buyerStateCode && sellerStateCode !== buyerStateCode));
        
        // Enforce Shift Management
        const activeShift = await Shift.findOne({ user: req.user._id, status: 'Open' });
        if (!activeShift) {
            return res.status(403).json({ 
                success: false, 
                message: 'No active shift found. Please open a shift before starting sales.' 
            });
        }

        let totalAmount = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) continue;

            if (product.quantity < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${product.productName}` });
            }

            const taxableAmount = Number((Number(item.quantity) * Number(item.price)).toFixed(2));
            const taxRate = gstEnabled ? Math.min(100, Math.max(0, Number(product.taxRate) || 0)) : 0;
            const taxAmount = Number((taxableAmount * taxRate / 100).toFixed(2));
            const cgst = isInterState ? 0 : Number((taxAmount / 2).toFixed(2));
            const sgst = isInterState ? 0 : Number((taxAmount - cgst).toFixed(2));
            const igst = isInterState ? taxAmount : 0;
            const itemTotal = Number((taxableAmount + taxAmount).toFixed(2));
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
                productName: product.productName,
                quantity: item.quantity,
                price: item.price,
                purchasePrice: product.purchasePrice || 0,
                mrp: item.mrp || item.price,
                batchNumber: usedBatchNumber,
                expiryDate: usedExpiryDate,
                discount: item.discount || 0,
                taxRate,
                taxableAmount,
                cgst,
                sgst,
                igst,
                taxAmount,
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
                shop: req.shopOwnerId,
                action: 'Sale',
                previousQuantity: oldQuantity,
                newQuantity: product.quantity,
                batchNumber: usedBatchNumber,
                expiryDate: usedExpiryDate,
                price: item.price,
                reason: `Sold ${item.quantity} units`,
                transactionId: null 
            });
        }

        const subtotalAmount = Number(totalAmount.toFixed(2));
        const requestedDiscountType = ['amount', 'percentage'].includes(req.body.discountType) ? req.body.discountType : 'none';
        const requestedDiscountValue = Number(req.body.discountValue || 0);
        if (!Number.isFinite(requestedDiscountValue) || requestedDiscountValue < 0 || (requestedDiscountType === 'percentage' && requestedDiscountValue > 100)) {
            return res.status(400).json({ success: false, message: 'Enter a valid discount amount or percentage.' });
        }
        const discountAmount = requestedDiscountType === 'percentage'
            ? Number((subtotalAmount * requestedDiscountValue / 100).toFixed(2))
            : Number(Math.min(subtotalAmount, requestedDiscountValue).toFixed(2));
        const finalDiscountType = discountAmount > 0 ? requestedDiscountType : 'none';
        const totalPayable = Number(Math.max(0, subtotalAmount - discountAmount).toFixed(2));
        const paymentParts = Array.isArray(req.body.payments) && req.body.payments.length
            ? req.body.payments.map(payment => ({ mode: payment.mode, amount: Number(payment.amount) }))
            : [{ mode: paymentMethod || 'Cash', amount: totalPayable }];
        const paymentTotal = paymentParts.reduce((sum, payment) => sum + payment.amount, 0);
        if (paymentParts.some(payment => !Number.isFinite(payment.amount) || payment.amount < 0) || Math.abs(paymentTotal - totalPayable) > 0.01) {
            return res.status(400).json({ success: false, message: 'Payment split amounts must add up to the total payable amount.' });
        }

        const sale = await Sale.create({
            items: processedItems,
            totalAmount: totalPayable,
            subtotalAmount,
            discountType: finalDiscountType,
            discountValue: finalDiscountType === 'none' ? 0 : requestedDiscountValue,
            discountAmount,
            taxableAmount: Number(processedItems.reduce((sum, item) => sum + (item.taxableAmount || 0), 0).toFixed(2)),
            taxAmount: Number(processedItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0).toFixed(2)),
            taxType: !gstEnabled ? 'none' : (isInterState ? 'inter-state' : 'intra-state'),
            payments: paymentParts,
            customerName,
            customerPhone,
            customerGSTIN: String(req.body.customerGSTIN || '').trim().toUpperCase(),
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

        // Update Customer Record if phone is provided
        if (customerPhone) {
            try {
                await Customer.findOneAndUpdate(
                    { phone: customerPhone, user: req.shopOwnerId },
                    { 
                        $set: { name: customerName, lastPurchase: new Date() },
                        $inc: { totalSpent: totalPayable, orderCount: 1 }
                    },
                    { upsert: true }
                );
            } catch (custError) {
                console.error("CUSTOMER UPDATE ERROR:", custError);
            }
        }

        // Update Active Shift Totals
        activeShift.totalSales += totalPayable;
        activeShift.totalTransactions += 1;
        paymentParts.forEach(payment => {
            if (payment.mode === 'Cash') {
                activeShift.totalCashSales += payment.amount;
                activeShift.expectedCash += payment.amount;
            } else if (payment.mode === 'UPI' || payment.mode === 'Scan & Pay') {
                activeShift.totalUpiSales += payment.amount;
            } else if (payment.mode === 'Card') {
                activeShift.totalCardSales += payment.amount;
            }
        });
        await activeShift.save();

        await sale.populate([
            { path: 'items.product', select: 'productName' },
            { path: 'user', select: 'shopName address phone gstEnabled gstin businessState' }
        ]);
        res.status(201).json({ success: true, data: sale });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.returnProduct = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { saleId, productId, quantity, returnReason } = req.body;
        if (!saleId || !productId) {
            return res.status(400).json({ success: false, message: 'Sale ID and Product ID are required' });
        }

        let responseMessage = 'Product returned and inventory updated';
        await session.withTransaction(async () => {
            const sale = await Sale.findById(saleId).session(session);
            if (!sale) throw Object.assign(new Error('Sale not found'), { statusCode: 404 });

            if (!req.isAdmin && sale.user.toString() !== req.shopOwnerId.toString()) {
                throw Object.assign(new Error('Not authorized'), { statusCode: 401 });
            }

            const item = sale.items.find(i => {
                if (!i.product) return false;
                const itemId = i.product._id ? i.product._id.toString() : i.product.toString();
                return itemId === String(productId) && !i.isReturned;
            });
            if (!item) throw Object.assign(new Error('Item not found or already fully returned'), { statusCode: 400 });

            const product = await Product.findById(productId).session(session);
            if (!product || product.user.toString() !== sale.user.toString()) {
                throw Object.assign(new Error('Product no longer exists in this shop inventory'), { statusCode: 404 });
            }

            const alreadyReturned = Number(item.returnedQuantity || 0);
            const remainingQty = Number(item.quantity || 0) - alreadyReturned;
            const returnQty = quantity === undefined || quantity === null || quantity === '' ? remainingQty : Number(quantity);
            if (!Number.isInteger(returnQty) || returnQty < 1 || returnQty > remainingQty) {
                throw Object.assign(new Error(`Return quantity must be between 1 and ${remainingQty}.`), { statusCode: 400 });
            }

            item.returnedQuantity = alreadyReturned + returnQty;
            item.isReturned = item.returnedQuantity >= item.quantity;
            item.returnReason = [item.returnReason, returnReason || 'Customer Return'].filter(Boolean).join(' | ');
            sale.status = sale.items.every(i => i.isReturned) ? 'Returned' : 'Partial Return';

            const oldQuantity = product.quantity;
            product.quantity += returnQty;
            const matchingBatch = product.batches?.find(batch => batch.batchNumber && batch.batchNumber === item.batchNumber);
            if (matchingBatch) {
                matchingBatch.quantity += returnQty;
            } else if (product.batches && product.batches.length > 0 && item.batchNumber) {
                product.batches.push({
                    batchNumber: item.batchNumber,
                    quantity: returnQty,
                    expiryDate: item.expiryDate || product.expiryDate || new Date(),
                    price: item.price,
                    purchasePrice: item.purchasePrice || product.purchasePrice || 0
                });
            } else if (product.batches && product.batches.length > 0) {
                product.batches[0].quantity += returnQty;
            } else {
                product.batches = [{
                    batchNumber: item.batchNumber || 'RETURN',
                    quantity: returnQty,
                    expiryDate: item.expiryDate || product.expiryDate || new Date(),
                    price: item.price || product.price,
                    purchasePrice: item.purchasePrice || product.purchasePrice || 0
                }];
            }

            await product.save({ session });
            await sale.save({ session });
            await InventoryLog.create([{
                product: product._id,
                user: req.user._id,
                shop: req.shopOwnerId,
                action: 'Return',
                previousQuantity: oldQuantity,
                newQuantity: product.quantity,
                batchNumber: item.batchNumber || 'Return',
                price: item.price,
                reason: `Returned ${returnQty} unit(s). Reason: ${returnReason || 'No reason provided'}`,
                transactionId: sale.transactionId
            }], { session });

            if (item.isReturned) responseMessage = 'All remaining units returned. Inventory updated.';
            else responseMessage = `${returnQty} unit(s) returned. Remaining returnable quantity: ${Number(item.quantity) - Number(item.returnedQuantity)}.`;
        });

        res.json({ success: true, message: responseMessage });
    } catch (error) {
        console.error('RETURN ERROR:', error);
        res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Return failed' });
    } finally {
        await session.endSession();
    }
};

exports.getSales = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = req.isAdmin ? {} : { user: req.shopOwnerId };

        if (req.query.month) {
            const [year, mon] = req.query.month.split('-');
            filter.createdAt = {
                $gte: new Date(year, mon - 1, 1),
                $lte: new Date(year, mon, 0, 23, 59, 59, 999)
            };
        }

        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            filter.$or = [
                { transactionId: searchRegex },
                { customerName: searchRegex },
                { customerPhone: searchRegex }
            ];
        }

        const total = await Sale.countDocuments(filter);
        const sales = await Sale.find(filter)
            .populate({
                path: 'items.product',
                select: 'productName',
                populate: { path: 'category', select: 'name' }
            })
            .populate('user', 'shopName address phone gstEnabled gstin businessState')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            data: sales,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
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
                .populate({
                    path: 'items.product',
                    populate: { path: 'category', select: 'name' }
                })
                .populate('user', 'shopName');
        }

        if (!sale) {
            sale = await Sale.findOne({ transactionId: id.toUpperCase() })
                .populate({
                    path: 'items.product',
                    populate: { path: 'category', select: 'name' }
                })
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
exports.getPublicSale = async (req, res) => {
    try {
        const id = req.params.id;
        let sale;
        
        const populateOptions = [
            {
                path: 'items.product',
                select: 'productName',
                populate: { path: 'category', select: 'name' }
            },
            {
                path: 'user',
                select: 'shopName address phone gstEnabled gstin businessState'
            }
        ];

        if (mongoose.Types.ObjectId.isValid(id)) {
            sale = await Sale.findById(id).populate(populateOptions);
        }
        
        if (!sale) {
            sale = await Sale.findOne({ transactionId: id.toUpperCase() }).populate(populateOptions);
        }
            
        if (!sale) return res.status(404).json({ success: false, message: 'Transaction ID not found' });
        
        res.json({ success: true, data: sale });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching receipt: ' + error.message });
    }
};
