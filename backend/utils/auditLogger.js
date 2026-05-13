const AuditLog = require('../models/AuditLog');

const logAction = async (req, action, module, details = {}) => {
    try {
        await AuditLog.create({
            user: req.user._id,
            shop: req.shopOwnerId,
            action,
            module,
            details,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });
    } catch (error) {
        console.error('Audit Log Error:', error);
    }
};

module.exports = { logAction };
