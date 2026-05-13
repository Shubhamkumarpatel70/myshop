const User = require('../models/User');

const seedAdmin = async () => {
    try {
        const adminEmail = 'admin@gmail.com';
        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
            console.log('--- Seeding Default Super Admin ---');
            await User.create({
                shopName: 'StockSaathi HQ',
                ownerName: 'System Admin',
                email: adminEmail,
                phone: '0000000000',
                password: 'adminpassword', // USER should change this immediately
                businessType: 'Custom Store',
                address: 'HQ',
                role: 'super_admin',
                approvalStatus: 'Approved'
            });
            console.log('Default Super Admin Created Successfully');
        }
    } catch (error) {
        console.error('Admin Seeding Failed:', error);
    }
};

module.exports = seedAdmin;
