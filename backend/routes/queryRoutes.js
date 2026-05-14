const express = require('express');
const router = express.Router();
const Query = require('../models/Query');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Submit a query
// @route   POST /api/queries
// @access  Public
router.post('/', async (req, res) => {
    try {
        const query = await Query.create(req.body);
        res.status(201).json({
            success: true,
            data: query
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Get all queries
// @route   GET /api/queries
// @access  Private/Admin
router.get('/', protect, authorize('super_admin'), async (req, res) => {
    try {
        const queries = await Query.find().sort('-createdAt');
        res.status(200).json({
            success: true,
            count: queries.length,
            data: queries
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// @desc    Update query status
// @route   PATCH /api/queries/:id
// @access  Private/Admin
router.patch('/:id', protect, authorize('super_admin'), async (req, res) => {
    try {
        const query = await Query.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true, runValidators: true }
        );

        if (!query) {
            return res.status(404).json({
                success: false,
                message: 'Query not found'
            });
        }

        res.status(200).json({
            success: true,
            data: query
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
