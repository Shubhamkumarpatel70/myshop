const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    openingCash: {
        type: Number,
        required: true,
        default: 0
    },
    closingCash: {
        type: Number,
        default: 0
    },
    expectedCash: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Open', 'Closed'],
        default: 'Open'
    },
    totalSales: {
        type: Number,
        default: 0
    },
    totalTransactions: {
        type: Number,
        default: 0
    },
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);
