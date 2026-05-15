const mongoose = require('mongoose');

const globalSettingsSchema = new mongoose.Schema({
    regFee: { type: Number, default: 0 },
    upiId: { type: String, default: '' },
    qrCode: { type: String, default: '' }, // URL to QR image
    supportPhone: { type: String, default: '' },
    isPaymentRequired: { type: Boolean, default: false },
    isMaintenanceMode: { type: Boolean, default: false },
    maintenanceTime: { type: String, default: '15 Minutes' },
    maintenanceUntil: { type: Date },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('GlobalSettings', globalSettingsSchema);
