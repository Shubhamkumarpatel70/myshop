const Shift = require('../models/Shift');
const Sale = require('../models/Sale');

exports.openShift = async (req, res) => {
    try {
        const { openingCash } = req.body;
        
        // Check if there is already an open shift for this user
        const existingShift = await Shift.findOne({ user: req.user._id, status: 'Open' });
        if (existingShift) {
            return res.status(400).json({ success: false, message: 'You already have an open shift' });
        }

        const shift = await Shift.create({
            user: req.user._id,
            shop: req.shopOwnerId,
            openingCash: openingCash || 0,
            status: 'Open'
        });

        res.status(201).json({ success: true, data: shift });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.closeShift = async (req, res) => {
    try {
        const { closingCash, notes } = req.body;
        
        const shift = await Shift.findOne({ user: req.user._id, status: 'Open' });
        if (!shift) {
            return res.status(404).json({ success: false, message: 'No open shift found' });
        }

        // Calculate expected cash based on sales during shift
        const sales = await Sale.find({
            processedBy: req.user._id,
            createdAt: { $gte: shift.startTime },
            paymentMethod: 'Cash'
        });

        const totalCashSales = sales.reduce((acc, curr) => acc + curr.totalAmount, 0);
        const expectedCash = shift.openingCash + totalCashSales;

        // Overall stats
        const allSales = await Sale.find({
            processedBy: req.user._id,
            createdAt: { $gte: shift.startTime }
        });

        shift.endTime = new Date();
        shift.closingCash = closingCash || 0;
        shift.expectedCash = expectedCash;
        shift.status = 'Closed';
        shift.totalSales = allSales.reduce((acc, curr) => acc + curr.totalAmount, 0);
        shift.totalTransactions = allSales.length;
        shift.notes = notes;

        await shift.save();

        res.json({ success: true, data: shift });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCurrentShift = async (req, res) => {
    try {
        const shift = await Shift.findOne({ user: req.user._id, status: 'Open' });
        if (shift) {
            // Calculate live revenue
            const sales = await Sale.find({
                processedBy: req.user._id,
                createdAt: { $gte: shift.startTime }
            });

            const totalRevenue = sales.reduce((acc, curr) => acc + curr.totalAmount, 0);
            const cashSales = sales.filter(s => s.paymentMethod === 'Cash').reduce((acc, curr) => acc + curr.totalAmount, 0);
            
            const shiftData = shift.toObject();
            shiftData.currentRevenue = totalRevenue;
            shiftData.expectedCash = shift.openingCash + cashSales;
            
            return res.json({ success: true, data: shiftData });
        }
        res.json({ success: true, data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getShifts = async (req, res) => {
    try {
        const filter = req.isAdmin ? {} : { shop: req.shopOwnerId };
        const shifts = await Shift.find(filter)
            .populate('user', 'ownerName role')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: shifts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
