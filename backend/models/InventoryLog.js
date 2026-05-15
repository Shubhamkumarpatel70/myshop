const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Performed by
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Shop ID (Optional for legacy logs)
    action: { type: String, enum: ['Add', 'Update', 'Delete', 'Sale', 'Restock', 'Adjustment', 'Return'], required: true },
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    batchNumber: { type: String },
    expiryDate: { type: Date },
    price: { type: Number },
    reason: { type: String },
    transactionId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
