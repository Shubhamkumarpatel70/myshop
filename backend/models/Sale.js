const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }, // Selling Price
    purchasePrice: { type: Number }, // Cost Price at time of sale
    mrp: { type: Number },
    batchNumber: { type: String },
    expiryDate: { type: Date },
    discount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    isReturned: { type: Boolean, default: false },
    returnedQuantity: { type: Number, default: 0, min: 0 },
    returnReason: { type: String }
});

const saleSchema = new mongoose.Schema({
    items: [saleItemSchema],
    totalAmount: { type: Number, required: true },
    subtotalAmount: { type: Number, default: 0 },
    discountType: { type: String, enum: ['none', 'amount', 'percentage'], default: 'none' },
    discountValue: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    customerName: { type: String, default: 'Guest' },
    customerPhone: { type: String },
    customerGSTIN: { type: String, default: '' },
    paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Scan & Pay', 'Udhar'], default: 'Cash' },
    payments: [{ mode: { type: String, enum: ['Cash', 'UPI', 'Card', 'Scan & Pay', 'Udhar'] }, amount: { type: Number, min: 0 } }],
    taxableAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    taxType: { type: String, enum: ['none', 'intra-state', 'inter-state'], default: 'none' },
    utrNumber: { type: String },
    status: { type: String, enum: ['Completed', 'Returned', 'Partial Return'], default: 'Completed' },
    transactionId: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
