const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hasPermission } = require('../utils/permissions');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }

            if (user.isSuspended) {
                return res.status(403).json({ success: false, message: 'Account is suspended' });
            }

            req.user = user;
            
            // Set Shop Context
            req.isAdmin = user.role === 'super_admin';
            
            // For staff roles, shopOwnerId is their creator. For owners/admins, it's their own ID.
            req.shopOwnerId = (user.role === 'manager' || user.role === 'cashier') ? user.createdBy : user._id;
            
            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

const checkPermission = (action) => {
    return (req, res, next) => {
        if (!hasPermission(req.user.role, action)) {
            return res.status(403).json({
                success: false,
                message: `Insufficient permissions. Role '${req.user.role}' cannot perform '${action}'`
            });
        }
        next();
    };
};

const admin = authorize('super_admin');

module.exports = { protect, authorize, admin, checkPermission };
