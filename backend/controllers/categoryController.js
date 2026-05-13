const Category = require('../models/Category');

exports.getCategories = async (req, res) => {
    try {
        const filter = req.isAdmin ? {} : { user: req.shopOwnerId };
        const categories = await Category.find(filter);
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const category = await Category.create({
            name,
            description,
            user: req.shopOwnerId
        });
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        let category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        
        if (!req.isAdmin && category.user.toString() !== req.shopOwnerId.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

        if (!req.isAdmin && category.user.toString() !== req.shopOwnerId.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await category.deleteOne();
        res.json({ success: true, message: 'Category removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
