const Supplier = require('../models/Supplier');

exports.getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({ user: req.shopOwnerId });
        res.json({ success: true, data: suppliers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.create({ ...req.body, user: req.shopOwnerId });
        res.status(201).json({ success: true, data: supplier });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findOneAndUpdate(
            { _id: req.params.id, user: req.shopOwnerId },
            req.body,
            { new: true }
        );
        res.json({ success: true, data: supplier });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteSupplier = async (req, res) => {
    try {
        await Supplier.findOneAndDelete({ _id: req.params.id, user: req.shopOwnerId });
        res.json({ success: true, message: 'Supplier deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
