import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for seeding...');

        const email = 'admin@gmail.com';
        const password = '8340012789';

        let adminUser = await User.findOne({ email });

        if (adminUser) {
            console.log('Admin user already exists. Checking password...');
            const isMatch = await bcrypt.compare(password, adminUser.passwordHash);
            if (!isMatch) {
                console.log('Updating password...');
                const salt = await bcrypt.genSalt(10);
                adminUser.passwordHash = await bcrypt.hash(password, salt);
                await adminUser.save();
                console.log('Admin password updated successfully.');
            } else {
                console.log('Admin password matches. No updates needed.');
            }
        } else {
            console.log('Creating new Admin user...');
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            adminUser = await User.create({
                name: 'System Administrator',
                email: email,
                passwordHash: passwordHash,
                role: 'ADMIN',
            });
            console.log('Admin user seeded successfully:', adminUser.email);
        }

        process.exit();
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

seedAdmin();
