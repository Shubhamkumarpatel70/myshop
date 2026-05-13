const User = require('../models/User');
const GlobalSettings = require('../models/GlobalSettings');

// Get all pending shop owners
exports.getPendingApprovals = async (req, res) => {
    try {
        const pendingShops = await User.find({ 
            role: 'shop_owner', 
            approvalStatus: 'Pending' 
        }).select('-password');
        res.json({ success: true, data: pendingShops });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Approve or Reject a shop
exports.updateApprovalStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const shop = await User.findById(id);
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

        shop.approvalStatus = status;
        if (status === 'Rejected') {
            shop.rejectionReason = reason || 'No reason provided';
            shop.isPaymentDone = false;
        } else {
            shop.rejectionReason = '';
            shop.isPaymentDone = true; // Auto-verify payment on approval
        }

        await shop.save();
        res.json({ success: true, message: `Shop ${status.toLowerCase()} successfully`, data: shop });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Global Settings Management
exports.getGlobalSettings = async (req, res) => {
    try {
        let settings = await GlobalSettings.findOne();
        if (!settings) {
            settings = await GlobalSettings.create({});
        }
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateGlobalSettings = async (req, res) => {
    try {
        const { regFee, upiId, qrCode, supportPhone, isPaymentRequired } = req.body;
        
        let settings = await GlobalSettings.findOne();
        if (!settings) {
            settings = new GlobalSettings();
        }

        settings.regFee = regFee ?? settings.regFee;
        settings.upiId = upiId ?? settings.upiId;
        settings.qrCode = qrCode ?? settings.qrCode;
        settings.supportPhone = supportPhone ?? settings.supportPhone;
        settings.isPaymentRequired = isPaymentRequired ?? settings.isPaymentRequired;
        settings.updatedBy = req.user._id;

        await settings.save();
        res.json({ success: true, message: 'Global settings updated successfully', data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Find shop by Shop ID
exports.getShopById = async (req, res) => {
    try {
        const { shopId } = req.params;
        const shop = await User.findOne({ shopId: shopId.toUpperCase() }).select('-password');
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
        
        res.json({ success: true, data: shop });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Payment verification for shop owner
exports.confirmRegistrationPayment = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        user.isPaymentDone = true;
        await user.save();
        
        res.json({ success: true, message: 'Payment confirmed. Welcome!', data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
