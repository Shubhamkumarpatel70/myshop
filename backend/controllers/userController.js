const User = require('../models/User');

exports.updateProfile = async (req, res) => {
    try {
        const { shopName, ownerName, email, phone, businessType, address } = req.body;
        
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.shopName = shopName || user.shopName;
        user.ownerName = ownerName || user.ownerName;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.businessType = businessType || user.businessType;
        user.address = address || user.address;

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
                shopSlug: updatedUser.shopSlug,
                role: updatedUser.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addStaff = async (req, res) => {
    try {
        const { ownerName, email, phone, password, role, aadharNumber, aadharImage } = req.body;
        
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
            businessType: req.user.businessType,
            address: req.user.address,
            role,
            aadharNumber,
            aadharImage,
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, data: staff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStaff = async (req, res) => {
    try {
        const staff = await User.find({ createdBy: req.user._id });
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
