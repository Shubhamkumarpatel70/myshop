const mongoose = require('mongoose');

const webhookLogSchema = new mongoose.Schema({
    eventId: { type: String, required: true, unique: true },
    orderId: { type: String, index: true },
    eventType: { type: String, default: 'UNKNOWN' },
    category: { type: String, enum: ['payment', 'refund', 'dispute', 'settlement', 'payout', 'incident', 'other'], default: 'other', index: true },
    summary: { type: String, default: '' },
    status: { type: String, enum: ['RECEIVED', 'PROCESSED', 'FAILED'], default: 'RECEIVED' },
    payload: { type: mongoose.Schema.Types.Mixed },
    processedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('WebhookLog', webhookLogSchema);
