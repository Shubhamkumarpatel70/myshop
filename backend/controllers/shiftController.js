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
        const enteredClosingCash = Number(closingCash);
        if (!Number.isFinite(enteredClosingCash) || enteredClosingCash < 0) {
            return res.status(400).json({ success: false, message: 'Enter a valid closing cash amount.' });
        }

        const shift = await Shift.findOne({ user: req.user._id, status: 'Open' });
        if (!shift) {
            return res.status(404).json({ success: false, message: 'No open shift found' });
        }

        const endedAt = new Date();
        const sales = await Sale.find({
            processedBy: req.user._id,
            createdAt: { $gte: shift.startTime, $lte: endedAt }
        });

        // Count split payments correctly, including mixed Cash + UPI/Card sales.
        const getPaymentTotal = (sale, modes) => {
            if (Array.isArray(sale.payments) && sale.payments.length) {
                return sale.payments.reduce((sum, payment) =>
                    sum + (modes.includes(payment.mode) ? Number(payment.amount || 0) : 0), 0);
            }
            return modes.includes(sale.paymentMethod) ? Number(sale.totalAmount || 0) : 0;
        };
        const cashSales = sales.reduce((sum, sale) => sum + getPaymentTotal(sale, ['Cash']), 0);
        const upiSales = sales.reduce((sum, sale) => sum + getPaymentTotal(sale, ['UPI', 'Scan & Pay']), 0);
        const cardSales = sales.reduce((sum, sale) => sum + getPaymentTotal(sale, ['Card']), 0);
        const expectedCash = Number((Number(shift.openingCash || 0) + cashSales).toFixed(2));

        shift.endTime = endedAt;
        shift.closingCash = enteredClosingCash;
        shift.cashChange = Number((enteredClosingCash - Number(shift.openingCash || 0)).toFixed(2));
        shift.expectedCash = expectedCash;
        shift.status = 'Closed';
        shift.totalCashSales = cashSales;
        shift.totalUpiSales = upiSales;
        shift.totalCardSales = cardSales;
        shift.totalSales = sales.reduce((acc, curr) => acc + curr.totalAmount, 0);
        shift.totalTransactions = sales.length;
        shift.notes = notes;

        await shift.save();

        // Send notification to owner
        const { sendNotification } = require('../utils/notificationUtils');
        const User = require('../models/User');
        const staffMember = await User.findById(req.user._id);
        
        await sendNotification(
            req.shopOwnerId,
            'Shift Closed',
            `Staff ${staffMember.ownerName} has closed their shift. Total Sales: ₹${shift.totalSales.toLocaleString()}. Expected Cash: ₹${shift.expectedCash.toLocaleString()}.`,
            'Sale'
        );

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

            const totalRevenue = sales.reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);
            const cashSales = sales.reduce((sum, sale) => {
                if (Array.isArray(sale.payments) && sale.payments.length) {
                    return sum + sale.payments.reduce((partSum, payment) =>
                        partSum + (payment.mode === 'Cash' ? Number(payment.amount || 0) : 0), 0);
                }
                return sum + (sale.paymentMethod === 'Cash' ? Number(sale.totalAmount || 0) : 0);
            }, 0);

            const shiftData = shift.toObject();
            shiftData.currentRevenue = totalRevenue;
            shiftData.currentCashSales = cashSales;
            shiftData.expectedCash = Number((Number(shift.openingCash || 0) + cashSales).toFixed(2));
            shiftData.cashChange = null;
            
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
        
        if (req.query.month) {
            const [year, mon] = req.query.month.split('-');
            filter.createdAt = {
                $gte: new Date(year, mon - 1, 1),
                $lte: new Date(year, mon, 0, 23, 59, 59, 999)
            };
        }

        const shifts = await Shift.find(filter)
            .populate('user', 'ownerName role')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: shifts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
