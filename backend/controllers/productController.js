const Product = require('../models/Product');
const User = require('../models/User');
const InventoryLog = require('../models/InventoryLog');
const { sendNotification } = require('../utils/notificationUtils');
const { registerMetadata } = require('./barcodeController');

exports.bulkImportProducts = async (req, res) => {
 try {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!rows.length) return res.status(400).json({success:false,message:'No product rows supplied.'});
  if (rows.length > 500) return res.status(400).json({success:false,message:'Maximum 500 rows per import.'});
  const Category = require('../models/Category');
  const owner = await User.findById(req.shopOwnerId).select('subscriptionPlan');
  if (!owner) return res.status(404).json({success:false,message:'Shop owner not found.'});
  const planLimits = {Free:50,Professional:5000,Enterprise:Infinity};
  const productLimit = planLimits[owner.subscriptionPlan || 'Free'] ?? 50;
  const startingCount = await Product.countDocuments({user:req.shopOwnerId});
  const categories = await Category.find({user:req.shopOwnerId}).select('_id name');
  const categoryMap = new Map();
  categories.forEach(item => { categoryMap.set(String(item._id), String(item._id)); categoryMap.set(String(item.name).trim().toLowerCase(), String(item._id)); });
  const results = []; let imported = 0; let created = 0;
  for (let i=0; i<rows.length; i+=1) {
   const row=rows[i] || {}; const rowNumber=i+2;
   const name=String(row.productName || row['Product Name'] || '').trim();
   const categoryId=String(row.category || row.categoryId || row['Category ID'] || '').trim();
   const quantity=Number(row.quantity ?? row.Quantity); const price=Number(row.price ?? row['Selling Price']);
   const purchasePrice=Number(row.purchasePrice ?? row['Purchase Price'] ?? 0); const taxRate=Number(row.taxRate ?? row['GST Rate (%)'] ?? 0);
   const threshold=Number(row.lowStockThreshold ?? row['Low Stock Threshold'] ?? 10); const errors=[];
   if(!name) errors.push('Product name is required.');
   const resolvedCategoryId = categoryMap.get(categoryId) || categoryMap.get(categoryId.toLowerCase());
   if(!resolvedCategoryId) errors.push('Category must match a category name or ID in this shop.');
   if(!Number.isFinite(quantity)||quantity<0) errors.push('Quantity must be zero or greater.');
   if(!Number.isFinite(price)||price<0) errors.push('Selling price must be zero or greater.');
   if(!Number.isFinite(purchasePrice)||purchasePrice<0) errors.push('Purchase price must be zero or greater.');
   if(!Number.isFinite(taxRate)||taxRate<0||taxRate>100) errors.push('GST rate must be between 0 and 100.');
   if(!Number.isFinite(threshold)||threshold<0) errors.push('Low stock threshold must be zero or greater.');
   if(errors.length){results.push({row:rowNumber,productName:name,status:'failed',errors});continue;}
   try {
    const barcode=String(row.barcode || row.Barcode || '').trim(); let existing=null;
    if(barcode) existing=await Product.findOne({user:req.shopOwnerId,barcode});
    else existing=await Product.findOne({user:req.shopOwnerId,productName:name});
    if(!existing && startingCount+created>=productLimit){results.push({row:rowNumber,productName:name,status:'failed',errors:['Product plan limit reached.']});continue;}
    if(existing){existing.quantity=Number(existing.quantity||0)+quantity;existing.price=price;existing.purchasePrice=purchasePrice;existing.taxRate=taxRate;existing.lowStockThreshold=threshold;await existing.save();results.push({row:rowNumber,productName:name,status:'updated',productId:existing._id});}
    else {const product=await Product.create({productName:name.slice(0,160),category:resolvedCategoryId,quantity,price,purchasePrice,taxRate,lowStockThreshold:threshold,barcode:barcode||undefined,supplier:String(row.supplier||row.Supplier||'').slice(0,160),description:String(row.description||row.Description||'').slice(0,2000),user:req.shopOwnerId,batches:quantity>0?[{quantity,price,purchasePrice}]:[]});created+=1;results.push({row:rowNumber,productName:name,status:'created',productId:product._id});}
    imported+=1;
   } catch(error){results.push({row:rowNumber,productName:name,status:'failed',errors:[error.message]});}
  }
  return res.json({success:true,message:'Imported '+imported+' of '+rows.length+' rows.',data:{total:rows.length,imported,failed:rows.length-imported,results}});
 } catch(error){return res.status(500).json({success:false,message:error.message});}
};
exports.getProducts = async (req, res) => {
    try {
        let filter = req.isAdmin ? {} : { user: req.shopOwnerId };
        
        // Allow Admin to filter by specific shop/user
        if (req.isAdmin && req.query.user) {
            filter = { user: req.query.user };
        }
        
        const products = await Product.find(filter).populate('category', 'name');
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { productName, barcode, category, quantity, price, purchasePrice, expiryDate, supplier, description, lowStockThreshold, batchNumber } = req.body;
        
        let product = await Product.findOne({ 
            user: req.shopOwnerId,
            $or: [
                { productName: productName },
                { barcode: barcode && barcode !== '' ? barcode : '---' }
            ]
        });

        if (product) {
            // Check if this batch already exists (same batch number AND same expiry)
            const existingBatchIndex = product.batches.findIndex(b => 
                (batchNumber && b.batchNumber === batchNumber) ||
                (b.expiryDate && expiryDate && new Date(b.expiryDate).toDateString() === new Date(expiryDate).toDateString())
            );

            if (existingBatchIndex > -1) {
                product.batches[existingBatchIndex].quantity += quantity;
                product.batches[existingBatchIndex].purchasePrice = purchasePrice || product.batches[existingBatchIndex].purchasePrice;
            } else {
                product.batches.push({ batchNumber, expiryDate, quantity, price, purchasePrice, supplier });
            }

            const oldQuantity = product.quantity;
            product.quantity += quantity;
            product.purchasePrice = purchasePrice || product.purchasePrice; // Update main cost price to latest
            
            // Set main expiry to earliest
            const sortedBatches = [...product.batches].filter(b => b.expiryDate).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
            if (sortedBatches.length > 0) product.expiryDate = sortedBatches[0].expiryDate;
            
            await product.save();

            await InventoryLog.create({
                product: product._id,
                user: req.user._id,
                shop: req.shopOwnerId,
                action: 'Restock',
                previousQuantity: oldQuantity,
                newQuantity: product.quantity,
                batchNumber: batchNumber || 'N/A',
                expiryDate: expiryDate,
                price: price || product.price,
                reason: 'Added new batch: ' + (batchNumber || 'N/A')
            });
        } else {
            product = await Product.create({
                ...req.body,
                user: req.shopOwnerId,
                batches: [{ batchNumber, expiryDate, quantity, price, purchasePrice, supplier }]
            });

            await InventoryLog.create({
                product: product._id,
                user: req.user._id,
                shop: req.shopOwnerId,
                action: 'Add',
                previousQuantity: 0,
                newQuantity: product.quantity,
                batchNumber: batchNumber || 'Initial',
                expiryDate: expiryDate,
                price: price,
                reason: 'Initial stock'
            });
        }

        if (product.barcode && product.barcode !== '---') {
            await registerMetadata(product.barcode, product.productName, product.productImage, req.shopOwnerId);
        }

        res.status(201).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        if (!req.isAdmin && product.user.toString() !== req.shopOwnerId.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const oldQuantity = product.quantity;
        product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (req.body.quantity !== undefined && req.body.quantity !== oldQuantity) {
            await InventoryLog.create({
                product: product._id,
                user: req.user._id,
                shop: req.shopOwnerId,
                action: 'Adjustment',
                previousQuantity: oldQuantity,
                newQuantity: product.quantity,
                price: product.price,
                reason: req.body.updateReason || 'Manual adjustment'
            });

            if (req.user.role === 'Staff') {
                await sendNotification(
                    req.shopOwnerId,
                    'Inventory Updated by Staff',
                    `Staff ${req.user.ownerName} updated the quantity of "${product.productName}" from ${oldQuantity} to ${product.quantity}.`,
                    'Stock'
                );
            }
        }

        if (product.barcode && product.barcode !== '---') {
            await registerMetadata(product.barcode, product.productName, product.productImage, req.shopOwnerId);
        }

        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        if (!req.isAdmin && product.user.toString() !== req.shopOwnerId.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await product.deleteOne();
        res.json({ success: true, message: 'Product removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPublicProducts = async (req, res) => {
    try {
        const user = await User.findOne({ shopSlug: req.params.shopSlug, isSuspended: false });
        if (!user) return res.status(404).json({ success: false, message: 'Shop not found or suspended' });
        
        if (user.isStorefrontActive === false) {
            return res.status(403).json({ success: false, message: 'Storefront is currently offline' });
        }

        // Products are always linked to the shop owner's ID
        const ownerId = user.role === 'Staff' ? user.createdBy : user._id;

        const products = await Product.find({ user: ownerId, isPublic: true })
            .select('productName price quantity productImage description category')
            .populate('category', 'name');
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPublicProductsByShop = async (req, res) => {
    try {
        const user = await User.findById(req.params.shopId);
        if (!user || user.isStorefrontActive === false) {
            return res.status(403).json({ success: false, message: 'Storefront is currently offline' });
        }
        const products = await Product.find({ user: req.params.shopId, isPublic: true })
            .select('productName category price quantity productImage description')
            .populate('category', 'name');
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getInventoryLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = req.isAdmin ? {} : { shop: req.shopOwnerId };
        
        if (req.query.product) filter.product = req.query.product;
        if (req.query.action) filter.action = req.query.action;
        if (req.query.month && req.query.month.includes('-')) {
            const [year, mon] = req.query.month.split('-');
            const startDate = new Date(year, mon - 1, 1);
            const endDate = new Date(year, mon, 0, 23, 59, 59, 999);
            
            if (!isNaN(startDate) && !isNaN(endDate)) {
                filter.createdAt = { $gte: startDate, $lte: endDate };
            }
        }

        const total = await InventoryLog.countDocuments(filter);
        const logs = await InventoryLog.find(filter)
            .populate('product', 'productName barcode')
            .populate('user', 'ownerName role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Calculate summaries for the filtered period
        const summaryLogs = await InventoryLog.find(filter).select('action previousQuantity newQuantity price');
        let totalInValue = 0;
        let totalOutValue = 0;

        summaryLogs.forEach(log => {
            const qtyChange = Math.abs(log.newQuantity - log.previousQuantity);
            const value = qtyChange * (log.price || 0);
            if (log.newQuantity > log.previousQuantity) {
                totalInValue += value;
            } else {
                totalOutValue += value;
            }
        });

        res.json({
            success: true,
            data: logs,
            summary: {
                totalInValue,
                totalOutValue,
                count: total
            },
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
