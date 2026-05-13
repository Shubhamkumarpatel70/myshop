const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['Stock', 'Expiry', 'Sale', 'System', 'Broadcast'], default: 'System' },
    isBroadcast: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
