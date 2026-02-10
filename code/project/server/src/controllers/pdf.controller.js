import { uploadPDFToCloudinary } from '../config/cloudinary.js';
import PDF from '../models/pdf.model.js';
import User from '../models/user.model.js';
import Chat from '../models/chat.model.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractTextFromPDF, cleanText, chunkText } from '../utils/pdfPreprocessor.js'; // 🔑 Preprocessing utils

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// =============================
// Upload PDF
// =============================
export const uploadPDF = async (req, res) => {
    console.log("[uploadPDF] Starting PDF upload process");
    try {
        if (!req.file) {
            console.error("[uploadPDF] No file provided in request");
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

<<<<<<< HEAD
        // Note: File is already uploaded to Cloudinary by multer-storage-cloudinary middleware
        // req.file contains the Cloudinary response details
        console.log("[uploadPDF] File uploaded via middleware. Path/URL:", req.file.path);
=======
        // Upload to Cloudinary
        console.log("[uploadPDF] Uploading to Cloudinary:", req.file.originalname);
        const result = await uploadPDFToCloudinary(req.file);
        if (!result.success) {
            console.error("[uploadPDF] Cloudinary upload failed:", result.error);
            return res.status(400).json({ success: false, message: result.error });
        }
>>>>>>> 535b24171ee6a745f7f6f24d151e85dcb019a0fe

        // Extract + preprocess text
        console.log("[uploadPDF] Extracting text...");
        let rawText = req.body.textContent || '';
<<<<<<< HEAD

        // req.file.path from multer-storage-cloudinary is the Secure URL
        if (!rawText && req.file.path) {
            try {
                // Now extractTextFromPDF handles URLs using axios
=======
        if (!rawText && req.file.path) {
            try {
>>>>>>> 535b24171ee6a745f7f6f24d151e85dcb019a0fe
                rawText = await extractTextFromPDF(req.file.path);
            } catch (ppErr) {
                console.error("[uploadPDF] Extraction failed:", ppErr.message);
            }
        }
        const cleanedText = cleanText(rawText);

        // Create PDF doc
        const pdf = await PDF.create({
            user: req.body.userId,
            title: req.body.title || req.file.originalname,
            originalFilename: req.file.originalname,
<<<<<<< HEAD
            url: req.file.path, // Use the path/url from multer
            size: req.file.size,
=======
            url: result.url,
>>>>>>> 535b24171ee6a745f7f6f24d151e85dcb019a0fe
            textContent: cleanedText || ''
        });

        console.log("[uploadPDF] PDF created:", pdf._id);
        res.status(201).json({ success: true, data: pdf });
    } catch (error) {
        console.error("[uploadPDF] Unexpected error:", error.message);
        res.status(500).json({ success: false, message: 'Failed to upload PDF', error: error.message });
    }
};

// =============================
// Get all PDFs for a user
// =============================
export const getAllPDFs = async (req, res) => {
    console.log("[getAllPDFs] Fetching PDFs");
    try {
        const userId = req.body.userId || req.user?._id;
        if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });

        const pdfs = await PDF.find({ user: userId }).select('-textContent').sort('-uploadedAt');
        res.status(200).json({ success: true, count: pdfs.length, data: pdfs });
    } catch (error) {
        console.error("[getAllPDFs] Error:", error.message);
        res.status(500).json({ success: false, message: 'Failed to retrieve PDFs', error: error.message });
    }
};

// =============================
// Get PDF by ID
// =============================
export const getPDFById = async (req, res) => {
    console.log("[getPDFById] ID:", req.params.id);
    try {
        if (!req.params.id) return res.status(400).json({ success: false, message: 'PDF ID required' });

        const userId = req.body.userId || req.user?._id;
        if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });

        const pdf = await PDF.findOne({ _id: req.params.id, user: userId }).populate('chats');
        if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found' });

        res.status(200).json({ success: true, data: pdf });
    } catch (error) {
        console.error("[getPDFById] Error:", error.message);
        res.status(500).json({ success: false, message: 'Failed to retrieve PDF', error: error.message });
    }
};

// =============================
// Get all PDFs of a user with chat counts
// =============================
export const getUserPDFs = async (req, res) => {
    console.log("[getUserPDFs] Fetching with chat counts");
    try {
        const userId = req.body.userId || req.params.userId || req.user?._id;
        if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const pdfs = await PDF.find({ user: userId })
            .select('-textContent')
            .populate({ path: 'chats', select: 'question response createdAt' })
            .sort('-uploadedAt');

        res.status(200).json({
            success: true,
            count: pdfs.length,
            data: pdfs.map(pdf => ({ ...pdf.toObject(), chatCount: pdf.chats.length }))
        });
    } catch (error) {
        console.error("[getUserPDFs] Error:", error.message);
        res.status(500).json({ success: false, message: 'Error fetching PDFs', error: error.message });
    }
};

// =============================
// Delete PDF
// =============================
export const deletePDF = async (req, res) => {
    console.log("[deletePDF] ID:", req.params.id);
    try {
        if (!req.params.id) return res.status(400).json({ success: false, message: 'PDF ID required' });
        if (!req.user?._id) return res.status(401).json({ success: false, message: 'Auth required' });

        const pdf = await PDF.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found' });

        await Chat.deleteMany({ pdfId: pdf._id });
        res.status(200).json({ success: true, message: 'PDF deleted successfully' });
    } catch (error) {
        console.error("[deletePDF] Error:", error.message);
        res.status(500).json({ success: false, message: 'Failed to delete PDF', error: error.message });
    }
};

// =============================
// Summarize PDF
// =============================
export const summarizePDF = async (req, res) => {
    console.log("[summarizePDF] Summarizing:", req.params.id);
    try {
        if (!req.params.id) return res.status(400).json({ success: false, message: 'PDF ID required' });
        if (!req.user?._id) return res.status(401).json({ success: false, message: 'Auth required' });

        const pdf = await PDF.findOne({ _id: req.params.id, user: req.user._id }).select('+textContent');
        if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found' });
        if (!pdf.textContent) return res.status(400).json({ success: false, message: 'No content to summarize' });

        const preprocessed = chunkText(cleanText(pdf.textContent));
        const prompt = `Please summarize: ${preprocessed}`;

        const result = await model.generateContent(prompt);
        const summary = result.response.text();

        pdf.summary = summary;
        await pdf.save();

        res.status(200).json({ success: true, data: { summary } });
    } catch (error) {
        console.error("[summarizePDF] Error:", error.message);
        res.status(500).json({ success: false, message: 'Failed to summarize PDF', error: error.message });
    }
};

// =============================
<<<<<<< HEAD
=======
// Ask Question on PDF
// =============================
export const askQuestion = async (req, res) => {
    console.log("[askQuestion] PDF:", req.params.id);
    try {
        if (!req.params.id) return res.status(400).json({ success: false, message: 'PDF ID required' });
        if (!req.user?._id) return res.status(401).json({ success: false, message: 'Auth required' });

        const { question } = req.body;
        if (!question) return res.status(400).json({ success: false, message: 'Question required' });

        const pdf = await PDF.findOne({ _id: req.params.id, user: req.user._id }).select('+textContent');
        if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found' });
        if (!pdf.textContent) return res.status(400).json({ success: false, message: 'No text in PDF' });

        const preprocessed = chunkText(cleanText(pdf.textContent));
        const prompt = `Based on this text: "${preprocessed}", answer: ${question}`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        const chat = await Chat.create({ pdfId: pdf._id, userId: req.user._id, question, response });
        await pdf.addChat(chat._id);

        res.status(200).json({ success: true, data: chat });
    } catch (error) {
        console.error("[askQuestion] Error:", error.message);
        res.status(500).json({ success: false, message: 'Failed to process question', error: error.message });
    }
};

// =============================
>>>>>>> 535b24171ee6a745f7f6f24d151e85dcb019a0fe
// Generate PDF Flow
// =============================
export const generatePDFFlow = async (req, res) => {
    console.log("[generatePDFFlow] Flow for:", req.params.id);
    try {
        if (!req.params.id) return res.status(400).json({ success: false, message: 'PDF ID required' });
        if (!req.user?._id) return res.status(401).json({ success: false, message: 'Auth required' });

        const pdf = await PDF.findOne({ _id: req.params.id, user: req.user._id }).select('+textContent');
        if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found' });
        if (!pdf.textContent) return res.status(400).json({ success: false, message: 'No text in PDF' });

        const preprocessed = chunkText(cleanText(pdf.textContent));
        const prompt = `Generate a structured flow of concepts from: ${preprocessed}`;

        const result = await model.generateContent(prompt);
        const flow = result.response.text();

        res.status(200).json({ success: true, data: { flow } });
    } catch (error) {
        console.error("[generatePDFFlow] Error:", error.message);
        res.status(500).json({ success: false, message: 'Failed to generate flow', error: error.message });
    }
};
