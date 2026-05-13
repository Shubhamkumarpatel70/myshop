const Sale = require('../models/Sale');

exports.getCustomers = async (req, res) => {
    try {
        const filter = req.isAdmin ? {} : { user: req.shopOwnerId };
        
        const customers = await Sale.aggregate([
            { $match: filter },
            { $match: { customerPhone: { $exists: true, $ne: '' } } },
            {
                $group: {
                    _id: "$customerPhone",
                    name: { $first: "$customerName" },
                    totalSpent: { $sum: "$totalAmount" },
                    orderCount: { $sum: 1 },
                    lastPurchase: { $max: "$createdAt" },
                    allProducts: { $push: "$items.product" }
                }
            },
            { $sort: { totalSpent: -1 } }
        ]);

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
