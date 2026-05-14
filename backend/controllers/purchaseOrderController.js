const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');

const generatePONumber = () => {
    return 'PO-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
};

exports.getPOs = async (req, res) => {
    try {
        const pos = await PurchaseOrder.find({ user: req.shopOwnerId })
            .populate('supplier', 'name phone email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: pos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createPO = async (req, res) => {
    try {
        const po = await PurchaseOrder.create({
            ...req.body,
            poNumber: generatePONumber(),
            user: req.shopOwnerId
        });
        res.status(201).json({ success: true, data: po });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updatePOStatus = async (req, res) => {
    try {
        const po = await PurchaseOrder.findOneAndUpdate(
            { _id: req.params.id, user: req.shopOwnerId },
            { status: req.body.status },
            { new: true }
        );
        res.json({ success: true, data: po });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deletePO = async (req, res) => {
    try {
        await PurchaseOrder.findOneAndDelete({ _id: req.params.id, user: req.shopOwnerId });
        res.json({ success: true, message: 'PO deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdminPOs = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        const pos = await PurchaseOrder.find()
            .populate('user', 'shopName ownerName shopId')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: pos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
