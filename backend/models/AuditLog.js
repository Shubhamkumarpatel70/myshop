const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    action: {
        type: String,
        required: true
    },
    module: {
        type: String,
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: String,
    userAgent: String
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
