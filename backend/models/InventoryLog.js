const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['Add', 'Update', 'Delete', 'Sale', 'Restock'], required: true },
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    reason: { type: String },
    transactionId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
