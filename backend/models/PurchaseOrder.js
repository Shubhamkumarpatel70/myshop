const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
    poNumber: { type: String, required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }, // Optional reference
    supplierName: { type: String }, // For manual entry
    supplierPhone: { type: String },
    supplierEmail: { type: String },
    items: [{
        productName: { type: String, required: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true },
        expectedPrice: { type: Number },
        total: { type: Number }
    }],
    totalAmount: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['Pending', 'Sent', 'Received', 'Cancelled'], 
        default: 'Pending' 
    },
    expectedDelivery: { type: Date },
    notes: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Shop Owner
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
