const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');

exports.bulkImportProducts = async (req, res) => {
    try {
        const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
        if (!rows.length) return res.status(400).json({ success: false, message: 'No product rows supplied.' });
        if (rows.length > 500) return res.status(400).json({ success: false, message: 'Maximum 500 rows per import.' });

        const owner = await User.findById(req.shopOwnerId).select('subscriptionPlan');
        if (!owner) return res.status(404).json({ success: false, message: 'Shop owner not found.' });
        const limits = { Free: 50, Professional: 5000, Enterprise: Infinity };
        const limit = limits[owner.subscriptionPlan || 'Free'] ?? 50;
        const startingCount = await Product.countDocuments({ user: req.shopOwnerId });
        const categories = await Category.find({ user: req.shopOwnerId }).select('_id name');
        const categoryMap = new Map();
        categories.forEach(category => {
            categoryMap.set(String(category._id), String(category._id));
            categoryMap.set(String(category.name).trim().toLowerCase(), String(category._id));
        });

        const results = [];
        let imported = 0;
        let created = 0;
        for (let index = 0; index < rows.length; index += 1) {
            const row = rows[index] || {};
            const rowNumber = index + 2;
            const productName = String(row.productName || row['Product Name'] || '').trim();
            const rawCategory = String(row.category || row.categoryId || row['Category'] || row['Category ID'] || '').trim();
            const categoryId = categoryMap.get(rawCategory) || categoryMap.get(rawCategory.toLowerCase());
            const quantity = Number(row.quantity ?? row.Quantity);
            const price = Number(row.price ?? row['Selling Price']);
            const purchasePrice = Number(row.purchasePrice ?? row['Purchase Price'] ?? 0);
            const taxRate = Number(row.taxRate ?? row['GST Rate (%)'] ?? 0);
            const threshold = Number(row.lowStockThreshold ?? row['Low Stock Threshold'] ?? 10);
            const errors = [];
            if (!productName) errors.push('Product name is required.');
            if (!categoryId) errors.push('Category must match a category name or ID in this shop.');
            if (!Number.isFinite(quantity) || quantity < 0) errors.push('Quantity must be zero or greater.');
            if (!Number.isFinite(price) || price < 0) errors.push('Selling price must be zero or greater.');
            if (!Number.isFinite(purchasePrice) || purchasePrice < 0) errors.push('Purchase price must be zero or greater.');
            if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) errors.push('GST rate must be between 0 and 100.');
            if (!Number.isFinite(threshold) || threshold < 0) errors.push('Low stock threshold must be zero or greater.');
            if (errors.length) {
                results.push({ row: rowNumber, productName, status: 'failed', errors });
                continue;
            }

            try {
                const barcode = String(row.barcode || row.Barcode || '').trim();
                let existing = null;
                if (barcode) existing = await Product.findOne({ user: req.shopOwnerId, barcode });
                if (!existing) existing = await Product.findOne({ user: req.shopOwnerId, productName });
                if (!existing && startingCount + created >= limit) {
                    results.push({ row: rowNumber, productName, status: 'failed', errors: ['Your product plan limit has been reached.'] });
                    continue;
                }
                if (existing) {
                    existing.quantity = Number(existing.quantity || 0) + quantity;
                    existing.price = price;
                    existing.purchasePrice = purchasePrice;
                    existing.taxRate = taxRate;
                    existing.lowStockThreshold = threshold;
                    await existing.save();
                    results.push({ row: rowNumber, productName, status: 'updated', productId: existing._id });
                } else {
                    const product = await Product.create({
                        productName: productName.slice(0, 160),
                        category: categoryId,
                        quantity,
                        price,
                        purchasePrice,
                        taxRate,
                        lowStockThreshold: threshold,
                        barcode: barcode || undefined,
                        supplier: String(row.supplier || row.Supplier || '').slice(0, 160),
                        description: String(row.description || row.Description || '').slice(0, 2000),
                        user: req.shopOwnerId,
                        batches: quantity > 0 ? [{ quantity, price, purchasePrice }] : []
                    });
                    created += 1;
                    results.push({ row: rowNumber, productName, status: 'created', productId: product._id });
                }
                imported += 1;
            } catch (error) {
                results.push({ row: rowNumber, productName, status: 'failed', errors: [error.message] });
            }
        }

        return res.json({
            success: true,
            message: 'Imported ' + imported + ' of ' + rows.length + ' rows.',
            data: { total: rows.length, imported, failed: rows.length - imported, results }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
