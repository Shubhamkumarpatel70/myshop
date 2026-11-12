const User = require('../models/User');

exports.updateProfile = async (req, res) => {
    try {
        const { shopName, ownerName, email, phone, businessType, address, gstEnabled, gstin, businessState } = req.body;
        
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.shopName = shopName || user.shopName;
        user.ownerName = ownerName || user.ownerName;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.businessType = businessType || user.businessType;
        user.address = address || user.address;
        if (gstEnabled !== undefined || gstin !== undefined || businessState !== undefined) {
            if (req.user.role !== 'shop_owner') return res.status(403).json({ success: false, message: 'Only the shop owner can change GST settings.' });
            if (gstEnabled !== undefined) user.gstEnabled = Boolean(gstEnabled);
            if (gstin !== undefined) user.gstin = String(gstin).trim().toUpperCase();
            if (businessState !== undefined) user.businessState = String(businessState).trim();
            if (user.gstEnabled && !/^[0-9A-Z]{15}$/.test(user.gstin || '')) {
                return res.status(400).json({ success: false, message: 'Enter a valid 15-character GSTIN to enable GST.' });
            }
        }

        const updatedUser = await user.save();
        
        res.json({
            success: true,
            data: {
                _id: updatedUser._id,
                shopName: updatedUser.shopName,
                ownerName: updatedUser.ownerName,
                email: updatedUser.email,
                phone: updatedUser.phone,
                businessType: updatedUser.businessType,
                address: updatedUser.address,
                gstEnabled: updatedUser.gstEnabled,
                gstin: updatedUser.gstin,
                businessState: updatedUser.businessState,
                shopSlug: updatedUser.shopSlug,
                role: updatedUser.role,
                approvalStatus: updatedUser.approvalStatus,
                isPaymentDone: updatedUser.isPaymentDone,
                shopId: updatedUser.shopId
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addStaff = async (req, res) => {
    try {
        const { ownerName, email, phone, password, role, aadharNumber, aadharFront, aadharBack, mPin } = req.body;
        
        if (!['manager', 'cashier'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid staff role. Choose manager or cashier.' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ success: false, message: 'User already exists' });

        const staff = await User.create({
            shopName: req.user.shopName,
            ownerName,
            email,
            phone,
            password,
            mPin,
            businessType: req.user.businessType,
            address: req.user.address,
            role,
            aadharNumber,
            aadharFront,
            aadharBack,
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, data: staff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStaff = async (req, res) => {
    try {
        const filter = req.user.role === 'super_admin' ? { role: { $in: ['manager', 'cashier'] } } : { createdBy: req.user._id };
        const staff = await User.find(filter).populate('createdBy', 'shopName ownerName shopId');
        res.json({ success: true, data: staff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStaffStats = async (req, res) => {
    try {
        const { id } = req.params;
        const Sale = require('../models/Sale');
        
        const sales = await Sale.find({ processedBy: id });
        const totalSales = sales.length;
        const totalRevenue = sales.reduce((acc, curr) => acc + curr.totalAmount, 0);
        
        res.json({
            success: true,
            data: {
                totalSales,
                totalRevenue,
                recentSales: sales.slice(-5).reverse()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPublicUser = async (req, res) => {
    try {
        let user = await User.findOne({ shopSlug: req.params.shopSlug, isSuspended: false }).select('shopName ownerName phone address businessType shopSlug role createdBy');
        if (!user) return res.status(404).json({ success: false, message: 'Shop not found or suspended' });

        // If it's a staff member, we should return the shop owner's details
        if (['manager', 'cashier'].includes(user.role) && user.createdBy) {
            const owner = await User.findById(user.createdBy).select('shopName ownerName phone address businessType shopSlug role');
            if (owner) user = owner;
        }

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.toggleUserSuspension = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        
        user.isSuspended = !user.isSuspended;
        await user.save();
        
        res.json({ success: true, message: `Shop ${user.isSuspended ? 'suspended' : 'activated'} successfully`, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Public: Get all registered shops
exports.getPublicShops = async (req, res) => {
    try {
        const shops = await User.find({ role: 'shop_owner', isSuspended: false })
            .select('shopName address phone profileImage createdAt shopId');
        res.json({ success: true, data: shops });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Public: Get a specific shop's details
exports.getPublicShopDetails = async (req, res) => {
    try {
        const shop = await User.findById(req.params.id)
            .select('shopName address phone profileImage ownerName businessType');
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
        res.json({ success: true, data: shop });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.updatePrinterStatus = async (req, res) => {
    try {
        const ownerId = req.user.role === 'shop_owner' ? req.user._id : req.user.createdBy;
        if (!ownerId) return res.status(403).json({ success: false, message: 'Only shop accounts can register a printer.' });
        const owner = await User.findById(ownerId);
        if (!owner || owner.role !== 'shop_owner') return res.status(404).json({ success: false, message: 'Shop not found.' });
        const { isConnected, printerName, connectionType, paperWidth } = req.body || {};
        if (typeof isConnected !== 'boolean') return res.status(400).json({ success: false, message: 'Printer connection status is required.' });
        const allowed = ['usb-serial', 'system-print', 'bluetooth', 'unknown'];
        owner.printer = { isConfigured: true, isConnected, printerName: String(printerName || '').trim().slice(0, 120), connectionType: allowed.includes(connectionType) ? connectionType : 'unknown', paperWidth: paperWidth === '80' ? '80' : '58', lastSeenAt: new Date(), registeredAt: owner.printer?.registeredAt || new Date() };
        await owner.save();
        res.json({ success: true, message: 'Printer status saved.', data: owner.printer });
    } catch (error) { res.status(500).json({ success: false, message: error.message || 'Could not save printer status.' }); }
};
