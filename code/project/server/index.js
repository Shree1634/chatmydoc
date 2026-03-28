// ============================================================
// index.js — Entry Point
// IMPORTANT: With ES modules, static imports are hoisted and
// execute before any code body runs. The ONLY way to guarantee
// dotenv loads first is to import it as a named function call
// at the very top, before any other imports.
// ============================================================
import { config } from 'dotenv';
config({ path: './.env' });   // ← Must be before connectDB / app imports

import connectDB from './src/config/db.js';
import app from './src/app.js';

const PORT = process.env.PORT || 5001;

// ─── Startup ENV Audit ────────────────────────────────────
const required = ['MONGODB_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missing = required.filter(k => !process.env[k]);

if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('   Check your server/.env file and make sure all values are filled in.');
    process.exit(1);
}

console.log('\n🔧 ENV check:');
console.log('  MONGODB_URL       :', process.env.MONGODB_URL ? '✅ set' : '❌ MISSING');
console.log('  PORT              :', PORT);
console.log('  JWT_SECRET        :', process.env.JWT_SECRET ? '✅ set' : '❌ MISSING');
console.log('  JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✅ set' : '❌ MISSING');
console.log('  GEMINI_API_KEY    :', process.env.GEMINI_API_KEY ? '✅ set' : '⚠️  not set (AI features disabled)');
console.log('  CLOUDINARY        :', process.env.CLOUDINARY_CLOUD_NAME ? '✅ set' : '⚠️  not set (uploads disabled)');
console.log('  CLIENT_URL        :', process.env.CLIENT_URL || 'http://localhost:5173 (default)');
console.log();

// ─── Connect DB then start server ────────────────────────
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`⚙️  Server running at : http://localhost:${PORT}`);
            console.log(`🩺 Health check       : http://localhost:${PORT}/api/health\n`);
        });
    })
    .catch((err) => {
        console.error('❌ Failed to connect to MongoDB:', err.message);
        process.exit(1);
    });