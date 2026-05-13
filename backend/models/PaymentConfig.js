const mongoose = require('mongoose');

const paymentConfigSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    upiId: { type: String, required: true },
    merchantName: { type: String, required: true },
    qrCodeImage: { type: String }, // Optional: If they want to upload a specific QR
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('PaymentConfig', paymentConfigSchema);
