const mongoose = require('mongoose');

const barcodeSchema = new mongoose.Schema({
    barcode: { 
        type: String, 
        required: true, 
        unique: true,
        index: true
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    productName: { 
        type: String,
        trim: true
    },
    productImage: { 
        type: String,
        default: ''
    },
    shopName: { 
        type: String 
    },
    status: { 
        type: String, 
        enum: ['Generated', 'Linked'], 
        default: 'Generated' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Barcode', barcodeSchema);
