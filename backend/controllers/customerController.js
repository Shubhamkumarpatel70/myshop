const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const escapeRegex = value => value.replace(/[^a-zA-Z0-9 ]/g, char => '\\' + char);

exports.getCustomers = async (req, res) => {
    try {
        const filter = req.isAdmin ? {} : { user: req.shopOwnerId };
        const customers = await Customer.find(filter).sort({ totalSpent: -1 });
        res.json({ success: true, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.searchCustomers = async (req, res) => {
    try {
        const query = String(req.query.q || '').trim().slice(0, 30);
        if (query.length < 2) return res.json({ success: true, data: [] });
        const safeQuery = escapeRegex(query);
        const filter = { user: req.shopOwnerId, $or: [
            { name: { $regex: safeQuery, $options: 'i' } },
            { phone: { $regex: safeQuery, $options: 'i' } }
        ] };
        const customers = await Customer.find(filter).select('name phone email address totalSpent orderCount').sort({ lastPurchase: -1 }).limit(8);
        res.json({ success: true, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCustomerDetails = async (req, res) => {
    try {
        const { phone } = req.params;
        const filter = req.isAdmin ? { customerPhone: phone } : { user: req.shopOwnerId, customerPhone: phone };
        
        const sales = await Sale.find(filter)
            .populate('items.product', 'productName')
            .sort({ createdAt: -1 });
            
        res.json({ success: true, data: sales });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createCustomer = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;
        
        // Check if exists
        let customer = await Customer.findOne({ phone, user: req.shopOwnerId });
        if (customer) {
            return res.status(400).json({ success: false, message: 'Customer with this phone already exists' });
        }

        customer = await Customer.create({
            name,
            phone,
            email,
            address,
            user: req.shopOwnerId
        });

        res.status(201).json({ success: true, data: customer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findOneAndUpdate(
            { _id: req.params.id, user: req.shopOwnerId },
            req.body,
            { new: true }
        );
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
        res.json({ success: true, data: customer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
