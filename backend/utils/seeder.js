const User = require('../models/User');
const Plan = require('../models/Plan');

const seedAdmin = async () => {
    try {
        // 1. Seed Admin
        const adminEmail = 'admin@gmail.com';
        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
            console.log('--- Seeding Default Super Admin ---');
            await User.create({
                shopName: 'StockSaathi HQ',
                ownerName: 'System Admin',
                email: adminEmail,
                phone: '0000000000',
                password: 'adminpassword',
                businessType: 'Custom Store',
                address: 'HQ',
                role: 'super_admin',
                approvalStatus: 'Approved'
            });
            console.log('Default Super Admin Created Successfully');
        }

        // 2. Seed Pricing Plans
        console.log('--- Seeding Default Pricing Plans ---');
        const plans = [
            {
                name: 'Free',
                price: 0,
                description: 'Essential tools for small local vendors and kiosks.',
                maxProducts: 50,
                maxStaff: 2,
                features: ['Max 50 Products', '2 Staff Accounts', 'Standard Receipts'],
                isActive: true
            },
            {
                name: 'Professional',
                price: 1999,
                description: 'Built for growing stores and pharmacies.',
                maxProducts: 1000,
                maxStaff: 10,
                features: ['Max 1,000 Products', '10 Staff Accounts', 'Sales Analytics', 'Customer Registry'],
                isRecommended: true,
                isActive: true
            },
            {
                name: 'Enterprise',
                price: 4999,
                description: 'Complete Retail OS for high-volume business.',
                maxProducts: 0, // 0 = Unlimited
                maxStaff: 0,
                features: ['Unlimited Products', 'Unlimited Staff', 'VIP Management', 'Advanced Analytics'],
                isActive: true
            }
        ];

        for (const plan of plans) {
            await Plan.findOneAndUpdate({ name: plan.name }, plan, { upsert: true });
        }
        console.log('Pricing Plans Seeded Successfully');

    } catch (error) {
        console.error('Seeding Failed:', error);
    }
};

module.exports = seedAdmin;
