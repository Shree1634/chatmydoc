// Load environment variables FIRST before any other imports
// With ES modules, dotenv must be loaded before any module that
// reads process.env — use a separate env loader at the top
import { config } from 'dotenv';
config({ path: './.env' });

import connectDB from "./src/config/db.js";
import app from './src/app.js';

const PORT = process.env.PORT || 8000;

console.log('🔧 ENV CHECK:');
console.log('  MONGODB_URL:', process.env.MONGODB_URL ? '✅ set' : '❌ MISSING');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ set' : '❌ MISSING');
console.log('  JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✅ set' : '❌ MISSING');
console.log('  CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ set' : '❌ MISSING');
console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ set' : '❌ MISSING');
console.log('  CLIENT_URL:', process.env.CLIENT_URL || 'http://localhost:5173 (default)');
console.log('  PORT:', PORT);

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`\n⚙️  Server is running at: http://localhost:${PORT}`);
            console.log(`✅ Health check: http://localhost:${PORT}/api/health\n`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });