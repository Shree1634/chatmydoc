import express from 'express';
import { uploadPDF } from '../config/cloudinary.js';
import rateLimit from 'express-rate-limit';
import {
    uploadPDF as uploadPDFController,
    getAllPDFs,
    getPDFById,
    deletePDF,
    summarizePDF,
    generatePDFFlow,
    getUserPDFs,
    askQuestion,
    extractTables,
    extractImages
} from '../controllers/pdf.controller.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Apply auth to all routes
router.use(authMiddleware);

// Stricter rate limiter for AI endpoints
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'AI rate limit reached. Please wait before making more AI requests.' }
});

// PDF CRUD
router.post('/upload', uploadPDF, uploadPDFController);
router.get('/', getAllPDFs);
router.get('/my', getUserPDFs);
router.get('/:id', getPDFById);
router.delete('/:id', deletePDF);

// AI endpoints (with stricter rate limit)
router.post('/:id/summarize', aiLimiter, summarizePDF);
router.post('/:id/ask', aiLimiter, askQuestion);
router.get('/:id/flow', aiLimiter, generatePDFFlow);

// New extraction endpoints
router.get('/:id/tables', extractTables);
router.get('/:id/images', extractImages);

export default router;