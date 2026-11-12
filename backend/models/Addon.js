const mongoose = require('mongoose');

const addonSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    price: { type: Number, required: true, min: 1 },
    billingLabel: { type: String, default: 'One-time payment', trim: true, maxlength: 40 },
    features: [{ type: String, trim: true, maxlength: 120 }],
    activationKey: { type: String, enum: ['barcode', 'team', 'none'], default: 'none' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Addon', addonSchema);
