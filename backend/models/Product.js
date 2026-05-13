const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    quantity: { type: Number, default: 0 },
    price: { type: Number, default: 0 }, // Selling Price
    purchasePrice: { type: Number, default: 0 }, // Cost Price for P&L
    barcode: { type: String },
    supplier: { type: String },
    expiryDate: { type: Date },
    batches: [{
        batchNumber: { type: String },
        expiryDate: { type: Date },
        quantity: { type: Number, required: true },
        price: { type: Number }, // Selling Price for this batch
        purchasePrice: { type: Number, default: 0 }, // Purchase Price for this batch
        supplier: { type: String },
        createdAt: { type: Date, default: Date.now }
    }],
    lowStockThreshold: { type: Number, default: 10 },
    description: { type: String },
    productImage: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
