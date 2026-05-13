const PaymentConfig = require('../models/PaymentConfig');

exports.getPaymentConfig = async (req, res) => {
    try {
        const config = await PaymentConfig.findOne({ user: req.shopOwnerId });
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updatePaymentConfig = async (req, res) => {
    try {
        const { upiId, merchantName } = req.body;
        let config = await PaymentConfig.findOne({ user: req.shopOwnerId });

        if (config) {
            config.upiId = upiId;
            config.merchantName = merchantName;
            await config.save();
        } else {
            config = await PaymentConfig.create({
                user: req.shopOwnerId,
                upiId,
                merchantName
            });
        }

        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
