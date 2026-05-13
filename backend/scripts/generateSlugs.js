require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const createSlug = (str) => {
    return str
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove non-word chars
        .replace(/[\s_-]+/g, '-')  // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
};

const generateSlugs = async () => {
    try {
        await connectDB();
        const users = await User.find({ shopSlug: { $exists: false } });
        console.log(`Found ${users.length} users without slugs.`);

        for (let user of users) {
            user.shopSlug = createSlug(user.shopName);
            
            // Ensure uniqueness
            let slugExists = await User.findOne({ shopSlug: user.shopSlug, _id: { $ne: user._id } });
            let counter = 1;
            let originalSlug = user.shopSlug;
            while (slugExists) {
                user.shopSlug = `${originalSlug}-${counter}`;
                slugExists = await User.findOne({ shopSlug: user.shopSlug, _id: { $ne: user._id } });
                counter++;
            }
            
            await user.save();
            console.log(`Generated slug for ${user.shopName}: ${user.shopSlug}`);
        }

        console.log('All slugs generated successfully.');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

generateSlugs();
