const mongoose = require('mongoose');

const registrationPaymentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    cfOrderId: { type: String, default: '' },
    cfPaymentId: { type: String, default: '' },
    paymentSessionId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['ACTIVE', 'SUCCESS', 'FAILED', 'USER_DROPPED', 'EXPIRED'], default: 'ACTIVE', index: true },
    environment: { type: String, enum: ['sandbox', 'production'], required: true },
    paidAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('RegistrationPayment', registrationPaymentSchema);
