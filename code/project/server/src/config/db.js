import mongoose from 'mongoose';

// ─── Connection event listeners ───────────────────────────
mongoose.connection.on('connected', () =>
    console.log('✅ Mongoose: connection established')
);
mongoose.connection.on('error', (err) =>
    console.error('❌ Mongoose error:', err.message)
);
mongoose.connection.on('disconnected', () =>
    console.warn('⚠️  Mongoose: disconnected')
);

const connectDB = async () => {
    const url = process.env.MONGODB_URL;

    if (!url) {
        console.error('❌ [DB] MONGODB_URL is not set — cannot connect');
        process.exit(1);
    }

    try {
        // NOTE: Do NOT pass useNewUrlParser / useUnifiedTopology — removed in Mongoose 7+
        const conn = await mongoose.connect(url);
        console.log(`✅ [DB] MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('❌ [DB] Connection failed:', error.message);
        process.exit(1);
    }
};

export default connectDB;