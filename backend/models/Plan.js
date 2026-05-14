const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // Free, Professional, Enterprise
    price: { type: Number, required: true },
    duration: { type: String, default: 'year' }, // month, year, forever
    description: { type: String },
    maxProducts: { type: Number, default: 50 },
    maxStaff: { type: Number, default: 2 },
    maxBarcodes: { type: Number, default: 30 },
    features: [String],
    isRecommended: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);
