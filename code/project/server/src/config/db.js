import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL;

const connectDB = async () => {
    try {
        if (!MONGODB_URL) {
            console.error('[connectDB] MONGODB_URL is not set in environment variables');
            process.exit(1);
        }

        const conn = await mongoose.connect(MONGODB_URL, {
            serverSelectionTimeoutMS: 5000,
        });

        console.log(`[connectDB] MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('[connectDB] MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

export default connectDB;