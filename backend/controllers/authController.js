const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate Tokens
const generateTokens = (id) => {
    const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '15m'
    });
    const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_123', {
        expiresIn: '7d'
    });
    return { accessToken, refreshToken };
};

const crypto = require('crypto');

const sendTokenResponse = async (user, statusCode, res) => {
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    const offlineHash = user.mPin ? crypto.createHash('sha256').update(user.email + user.mPin).digest('hex') : null;

    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    };

    res.status(statusCode)
        .cookie('refreshToken', refreshToken, cookieOptions)
        .json({
            success: true,
            _id: user._id,
            shopName: user.shopName,
            ownerName: user.ownerName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            businessType: user.businessType,
            address: user.address,
            shopSlug: user.shopSlug,
            shopId: user.shopId,
            approvalStatus: user.approvalStatus,
            isPaymentDone: user.isPaymentDone,
            createdAt: user.createdAt,
            token: accessToken,
            offlineHash // For offline mPin verification
        });
};

const { validationResult } = require('express-validator');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { shopName, ownerName, email, phone, password, mPin, businessType, address, aadharNumber, aadharFront, aadharBack } = req.body;
 
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
 
        const user = await User.create({
            shopName,
            ownerName,
            email,
            phone,
            password,
            mPin,
            businessType,
            address,
            aadharNumber,
            aadharFront,
            aadharBack
        });

        if (user) {
            await sendTokenResponse(user, 201, res);
        }
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { email, password, mPin } = req.body;
        const user = await User.findOne({ email }).select('+refreshToken +mPin +password +loginAttempts +lockoutUntil');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Check if account is locked
        if (user.lockoutUntil && user.lockoutUntil > Date.now()) {
            const remainingSeconds = Math.ceil((user.lockoutUntil - Date.now()) / 1000);
            const minutesLeft = Math.ceil(remainingSeconds / 60);
            return res.status(429).json({ 
                success: false, 
                message: `Too many login attempts. Please try again after ${minutesLeft} minutes`,
                remainingSeconds,
                lockoutUntil: user.lockoutUntil 
            });
        }

        let isMatch = false;
        if (mPin) {
            isMatch = await user.compareMPin(mPin);
        } else if (password) {
            isMatch = await user.comparePassword(password);
        }

        if (isMatch) {
            if (user.isSuspended) {
                return res.status(403).json({ success: false, message: 'Account is suspended' });
            }
            
            // Reset attempts on success
            user.loginAttempts = 0;
            user.lockoutUntil = null;
            await user.save();

            await sendTokenResponse(user, 200, res);
        } else {
            // Increment attempts
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            
            if (user.loginAttempts >= 3) {
                user.lockoutUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
                await user.save();
                return res.status(429).json({ 
                    success: false, 
                    message: 'Too many login attempts. Please try again after 5 minutes',
                    remainingSeconds: 300,
                    lockoutUntil: user.lockoutUntil
                });
            } else {
                await user.save();
                const attemptsLeft = 3 - user.loginAttempts;
                return res.status(401).json({ 
                    success: false, 
                    message: `Invalid email or password. ${attemptsLeft} attempts left`,
                    attemptsLeft
                });
            }
        }
    } catch (error) {
        if (error.status === 429) {
            return res.status(429).json({ success: false, message: error.message });
        }
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh
// @access  Public
exports.refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token' });

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_123');
        const user = await User.findById(decoded.id).select('+refreshToken');

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
        user.refreshToken = newRefreshToken;
        await user.save();

        const cookieOptions = {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        };

        res.cookie('refreshToken', newRefreshToken, cookieOptions).json({
            success: true,
            token: accessToken
        });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token refresh failed' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            if (user.role === 'shop_owner' && !user.shopId) {
                await user.save();
            }
            res.json({ success: true, data: user });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Check if account is locked
// @route   GET /api/auth/check-lockout
// @access  Public
exports.checkLockout = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ success: false });

        const user = await User.findOne({ email }).select('lockoutUntil');
        if (user && user.lockoutUntil && user.lockoutUntil > Date.now()) {
            const remainingSeconds = Math.ceil((user.lockoutUntil - Date.now()) / 1000);
            return res.json({ 
                success: true, 
                isLocked: true, 
                remainingSeconds,
                lockoutUntil: user.lockoutUntil
            });
        }
        res.json({ success: true, isLocked: false });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

// @desc    Submit payment screenshot
// @route   POST /api/auth/submit-payment
// @access  Private
exports.submitPayment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a screenshot' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.paymentScreenshot = `/uploads/${req.file.filename}`;
        await user.save();

        res.json({ success: true, message: 'Payment screenshot submitted successfully', data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.toggleStorefront = async (req, res) => {
    try {
        const { isActive } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.isStorefrontActive = isActive;
        await user.save();

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
