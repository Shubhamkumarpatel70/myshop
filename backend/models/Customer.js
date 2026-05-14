const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    totalSpent: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    lastPurchase: { type: Date, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Shop Owner
}, { timestamps: true });

// Ensure unique phone number per shop
customerSchema.index({ phone: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);
