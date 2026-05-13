const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }, // Selling Price
    purchasePrice: { type: Number }, // Cost Price at time of sale
    mrp: { type: Number },
    batchNumber: { type: String },
    expiryDate: { type: Date },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    isReturned: { type: Boolean, default: false },
    returnReason: { type: String }
});

const saleSchema = new mongoose.Schema({
    items: [saleItemSchema],
    totalAmount: { type: Number, required: true },
    customerName: { type: String, default: 'Guest' },
    customerPhone: { type: String },
    paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Scan & Pay', 'Udhar'], default: 'Cash' },
    utrNumber: { type: String },
    status: { type: String, enum: ['Completed', 'Returned', 'Partial Return'], default: 'Completed' },
    transactionId: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
