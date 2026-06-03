const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin already exists!');
            process.exit();
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create admin user
        const admin = new User({
            name: 'Super Admin',
            email: 'admin@worklance.com',
            password: hashedPassword,
            role: 'admin',
            isVerified: true,
            isSuspended: false
        });

        await admin.save();
        console.log('✅ Admin created successfully!');
        console.log('📧 Email: admin@worklance.com');
        console.log('🔑 Password: admin123');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit();
    }
};

createAdmin();