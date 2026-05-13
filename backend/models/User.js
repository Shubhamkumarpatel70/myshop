const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    shopName: { type: String, required: true },
    ownerName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    businessType: {
        type: String,
        required: true,
        enum: ['Medical Store', 'Hardware Store', 'Grocery Store', 'Electronics Store', 'Clothing Store', 'General Store', 'Custom Store']
    },
    address: { type: String, required: true },
    profileImage: { type: String, default: '' },
    aadharNumber: { type: String, default: '' },
    aadharImage: { type: String, default: '' },
    role: {
        type: String,
        enum: ['super_admin', 'shop_owner', 'manager', 'cashier'],
        default: 'shop_owner'
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        default: null 
    },
    isSuspended: { type: Boolean, default: false },
    approvalStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    rejectionReason: { type: String, default: '' },
    isPaymentDone: { type: Boolean, default: false },
    aadharNumber: { type: String },
    aadharImage: { type: String },
    paymentScreenshot: { type: String },
    shopId: { type: String, unique: true, sparse: true },
    shopSlug: { type: String, unique: true },
    refreshToken: { type: String, select: false }
}, { timestamps: true });

// Helper to create slug
const createSlug = (str) => {
    return str
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove non-word chars
        .replace(/[\s_-]+/g, '-')  // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
};

// Hash password and generate slug before saving
userSchema.pre('save', async function() {
    // Generate Shop ID for Shop Owners
    if (this.role === 'shop_owner' && !this.shopId) {
        const namePart = (this.ownerName || 'XXX').substring(0, 3).toUpperCase().padEnd(3, 'X');
        const phonePart = (this.phone || '00').slice(-2);
        const date = new Date();
        const datePart = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getFullYear()).slice(-2)}`;
        
        let baseId = `MS-${namePart}-${phonePart}-${datePart}`;
        let finalId = baseId;
        
        // Ensure uniqueness for Shop ID
        let idExists = await mongoose.models.User.findOne({ shopId: finalId });
        let counter = 1;
        while (idExists) {
            finalId = `${baseId}-${counter}`;
            idExists = await mongoose.models.User.findOne({ shopId: finalId });
            counter++;
        }
        this.shopId = finalId.toUpperCase();
    }

    // Generate Shop Slug
    if (this.isModified('shopName')) {
        this.shopSlug = createSlug(this.shopName);
        
        // Ensure uniqueness for slugs
        let slugExists = await mongoose.models.User.findOne({ shopSlug: this.shopSlug, _id: { $ne: this._id } });
        let counter = 1;
        let originalSlug = this.shopSlug;
        while (slugExists) {
            this.shopSlug = `${originalSlug}-${counter}`;
            slugExists = await mongoose.models.User.findOne({ shopSlug: this.shopSlug, _id: { $ne: this._id } });
            counter++;
        }
    }

    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
