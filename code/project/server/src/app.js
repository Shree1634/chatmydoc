import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

// ─── Route + Middleware imports ───────────────────────────
import userRoutes from './routes/user.routes.js';
import chatRoutes from './routes/chat.routes.js';
import pdfRoutes from './routes/pdf.routes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// ─── CORS ─────────────────────────────────────────────────
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests for all routes
app.options('*', cors());

// ─── Body Parsers ─────────────────────────────────────────
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

// ─── Request Logger (dev) ─────────────────────────────────
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// ─── Rate Limiters ────────────────────────────────────────
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});

const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'AI rate limit reached. Please wait.' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});

// ─── Health Check (no rate limit) ────────────────────────
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// ─── Routes ───────────────────────────────────────────────
app.use('/api/auth', authLimiter, userRoutes);
app.use('/api/chats', generalLimiter, chatRoutes);
app.use('/api/pdfs', generalLimiter, pdfRoutes);

// ─── Route Debug Log ──────────────────────────────────────
console.log('📋 Registered routes:');
app._router.stack
    .filter(r => r.route || r.name === 'router')
    .forEach(r => {
        if (r.route) {
            console.log(`  ${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);
        } else if (r.handle && r.handle.stack) {
            r.handle.stack.forEach(s => {
                if (s.route) console.log(`  ${Object.keys(s.route.methods)[0].toUpperCase()} ${r.regexp} -> ${s.route.path}`);
            });
        }
    });

// ─── 404 handler ──────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────
app.use(errorHandler);

export default app;