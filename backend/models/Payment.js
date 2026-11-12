const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    paymentId: { type: String, required: true, unique: true },
    cashfreeOrderId: { type: String, required: true, unique: true },
    cashfreePaymentId: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    amount: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'USER_DROPPED'], default: 'PENDING' },
    paymentDate: { type: Date },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },
    idempotencyKey: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
