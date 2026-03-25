import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

// ─── CORS ───────────────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── BODY PARSERS ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

// ─── RATE LIMITING ───────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
});

const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'AI rate limit reached. Please wait before making more AI requests.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many auth attempts. Please try again later.' }
});

// ─── ROUTES ──────────────────────────────────────────────────────────────────
import userRoutes from './routes/user.routes.js';
import chatRoutes from './routes/chat.routes.js';
import pdfRoutes from './routes/pdf.routes.js';
import errorHandler from './middleware/errorHandler.js';

// Health check (no rate limit)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authLimiter, userRoutes);
app.use('/api/chats', generalLimiter, chatRoutes);

// AI endpoints get stricter limiter, regular PDF endpoints get general limiter
app.use('/api/pdfs', generalLimiter, pdfRoutes);

// Error handling middleware
app.use(errorHandler);

export default app;