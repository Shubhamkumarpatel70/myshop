const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactPerson: { type: String },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    gstin: { type: String },
    category: { type: String }, // What they supply
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Shop Owner
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
