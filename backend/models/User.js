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
    mPin: { type: String, select: false },
    refreshToken: { type: String, select: false },
    subscriptionPlan: {
        type: String,
        enum: ['Free', 'Professional', 'Enterprise'],
        default: 'Free'
    },
    planExpiresAt: { type: Date },
    planActivatedAt: { type: Date },
    cancellationRequest: {
        status: { type: String, enum: ['None', 'Pending', 'Approved', 'Rejected'], default: 'None' },
        reason: { type: String },
        requestedAt: { type: Date },
        processedAt: { type: Date },
        rejectReason: { type: String },
        refundUtr: { type: String }
    },
    pendingSubscription: {
        plan: { type: String, enum: ['Professional', 'Enterprise'] },
        screenshot: { type: String },
        requestedAt: { type: Date },
        status: { type: String, enum: ['None', 'Pending', 'Rejected'], default: 'None' }
    },
    subscriptionHistory: [{
        plan: String,
        startDate: Date,
        endDate: Date,
        amount: Number,
        paymentRef: String
    }],
    isTrialUsed: { type: Boolean, default: false }
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
userSchema.pre('save', async function () {
    // Generate Shop ID for Shop Owners
    if (this.role === 'shop_owner' && !this.shopId) {
        const namePart = (this.ownerName || 'XXX').substring(0, 3).toUpperCase().padEnd(3, 'X');
        const randomPart = Math.floor(100 + Math.random() * 900); // Generate random 3-digit number
        const date = new Date();
        const datePart = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getFullYear()).slice(-2)}`;

        let baseId = `SS-${namePart}-${randomPart}-${datePart}`;
        let finalId = baseId;

        // Ensure uniqueness for Shop ID
        let idExists = await mongoose.models.User.findOne({ shopId: finalId });
        let counter = 1;
        while (idExists) {
            const nextRandom = Math.floor(100 + Math.random() * 900);
            finalId = `SS-${namePart}-${nextRandom}-${datePart}`;
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

    // Hash password if modified
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    // Hash mPin if modified
    if (this.isModified('mPin')) {
        const salt = await bcrypt.genSalt(10);
        this.mPin = await bcrypt.hash(this.mPin, salt);
    }
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Compare mPin
userSchema.methods.compareMPin = async function (enteredMPin) {
    if (!this.mPin) return false;
    return await bcrypt.compare(enteredMPin, this.mPin);
};

module.exports = mongoose.model('User', userSchema);
