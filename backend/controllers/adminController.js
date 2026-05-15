const User = require('../models/User');
const GlobalSettings = require('../models/GlobalSettings');
const jwt = require('jsonwebtoken');

// Helper to generate tokens (copied from authController for now, better to utility it later)
const generateTokens = (id) => {
    const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h' // Longer for support
    });
    const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_123', {
        expiresIn: '7d'
    });
    return { accessToken, refreshToken };
};

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
        const { regFee, upiId, qrCode, supportPhone, isPaymentRequired, maintenanceTime, maintenanceDuration } = req.body;
        
        let settings = await GlobalSettings.findOne();
        if (!settings) {
            settings = new GlobalSettings();
        }

        settings.regFee = regFee ?? settings.regFee;
        settings.upiId = upiId ?? settings.upiId;
        settings.qrCode = qrCode ?? settings.qrCode;
        settings.supportPhone = supportPhone ?? settings.supportPhone;
        settings.isPaymentRequired = typeof req.body.isPaymentRequired !== 'undefined' ? req.body.isPaymentRequired : settings.isPaymentRequired;
        
        // Handle Maintenance Logic
        if (typeof req.body.isMaintenanceMode !== 'undefined') {
            settings.isMaintenanceMode = req.body.isMaintenanceMode;
            // If turning on maintenance and duration provided, calculate end time
            if (settings.isMaintenanceMode && maintenanceDuration) {
                const endTime = new Date();
                endTime.setMinutes(endTime.getMinutes() + parseInt(maintenanceDuration));
                settings.maintenanceUntil = endTime;
                settings.maintenanceTime = `${maintenanceDuration} Minutes`;
            }
        }
        
        if (maintenanceTime) settings.maintenanceTime = maintenanceTime;
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
// Impersonate a shop owner (Admin Only)
exports.impersonateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const targetUser = await User.findById(id);
        
        if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });
        
        // Cannot impersonate another super admin
        if (targetUser.role === 'super_admin') {
            return res.status(403).json({ success: false, message: 'Security Breach: Cannot impersonate root admin' });
        }

        const { accessToken, refreshToken } = generateTokens(targetUser._id);

        targetUser.refreshToken = refreshToken;
        await targetUser.save();

        const cookieOptions = {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        };

        res.cookie('token', refreshToken, cookieOptions);
        
        res.json({ 
            success: true, 
            token: accessToken,
            user: {
                _id: targetUser._id,
                ownerName: targetUser.ownerName,
                shopName: targetUser.shopName,
                email: targetUser.email,
                role: targetUser.role
            },
            isImpersonating: true
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
