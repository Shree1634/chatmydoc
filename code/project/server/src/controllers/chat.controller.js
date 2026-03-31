import { GoogleGenerativeAI } from '@google/generative-ai';
import Chat from '../models/chat.model.js';
import PDF from '../models/pdf.model.js';

// ─── Initialize Gemini AI (gemini-1.5-flash-8b) ──────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });

// Get conversation history
const getPreviousContext = async (pdfId, limit = 2) => {
    try {
        const previousChats = await Chat.find({ pdfId })
            .sort({ createdAt: -1 })
            .limit(limit);

        return previousChats.reverse().map(chat =>
            `Question: ${chat.question}\nAnswer: ${chat.response}`
        ).join('\n\n');
    } catch (error) {
        console.error(`[getPreviousContext] Failed to fetch conversation history:`, error.message);
        throw error;
    }
};

// ─── Ask question with context ────────────────────────────────────────────────
export const askQuestion = async (req, res) => {
    const STAGE = {
        INIT: 'INITIALIZATION',
        AUTH: 'AUTHENTICATION',
        VALIDATION: 'REL_VALIDATION',
        DB_FETCH: 'DB_FETCH_PDF',
        CONTEXT_FETCH: 'DB_FETCH_CONTEXT',
        AI_GEN: 'AI_GENERATION',
        DB_SAVE: 'DB_SAVE_CHAT'
    };

    let currentStage = STAGE.INIT;

    try {
        currentStage = STAGE.AUTH;
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: 'User authentication required', stage: currentStage });
        }

        currentStage = STAGE.VALIDATION;
        const { question } = req.body;
        const pdfId = req.params.pdfId || req.params.id;

        if (!question || question.trim() === '') {
            return res.status(400).json({ success: false, message: 'Question cannot be empty', stage: currentStage });
        }
        if (!pdfId) {
            return res.status(400).json({ success: false, message: 'PDF ID is required', stage: currentStage });
        }

        currentStage = STAGE.DB_FETCH;
        const pdf = await PDF.findOne({ _id: pdfId, user: req.user._id }).select('+textContent');

        if (!pdf) {
            return res.status(404).json({ success: false, message: 'PDF not found', stage: currentStage });
        }

        if (!pdf.textContent || pdf.textContent.trim().length < 10) {
            return res.status(400).json({ success: false, message: 'The PDF content is empty or too short to analyze.', stage: currentStage });
        }

        currentStage = STAGE.CONTEXT_FETCH;
        const previousContext = await getPreviousContext(pdfId);

        currentStage = STAGE.AI_GEN;

        if (!process.env.GEMINI_API_KEY) {
            throw new Error('Server misconfiguration: GEMINI_API_KEY is missing');
        }

        const prompt = `
        You are an intelligent PDF assistant. Use the following context to answer the user's question.
        
        CONTEXT FROM PDF:
        "${pdf.textContent.substring(0, 30000)}" 
        
        PREVIOUS CONVERSATION:
        ${previousContext}
        
        USER QUESTION: 
        ${question}
        
        INSTRUCTIONS:
        - Answer based ONLY on the provided Context.
        - If the answer is not in the context, politely say you don't know based on the document.
        - Keep the answer concise and helpful.
        `;

        let responseText = '';
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            responseText = response.text();
            if (!responseText) throw new Error('AI returned empty response');
        } catch (aiError) {
            console.error(`[askQuestion] Gemini API Error:`, aiError.message);
            let userMsg = 'Failed to generate answer from AI.';
            if (aiError.message.includes('SAFETY')) userMsg = 'The response was blocked due to safety settings.';
            if (aiError.message.includes('API key')) userMsg = 'Service configuration error (API Key).';

            return res.status(503).json({ success: false, message: userMsg, error: aiError.message, stage: currentStage });
        }

        currentStage = STAGE.DB_SAVE;
        const chat = await Chat.create({ pdfId: pdf._id, userId: req.user._id, question, response: responseText });
        await pdf.addChat(chat._id);

        res.status(200).json({ success: true, data: chat });

    } catch (error) {
        console.error(`[askQuestion] [CRITICAL FAILURE] Stage: ${currentStage}`, error);
        res.status(500).json({ success: false, message: 'Internal server error processing your question.', error: error.message, stage: currentStage });
    }
};

// ─── Get all chats for a PDF ──────────────────────────────────────────────────
export const getPDFChats = async (req, res) => {
    try {
        if (!req.params.pdfId) {
            return res.status(400).json({ success: false, message: 'PDF ID is required' });
        }
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'User authentication required' });
        }

        const pdf = await PDF.findOne({ _id: req.params.pdfId, user: req.user._id });
        if (!pdf) {
            return res.status(404).json({ success: false, message: 'PDF not found' });
        }

        const chats = await Chat.find({ pdfId: pdf._id })
            .sort('createdAt')
            .select('question response createdAt');

        res.status(200).json({ success: true, count: chats.length, data: chats });
    } catch (error) {
        console.error('[getPDFChats] Error:', error.message);
        res.status(500).json({ success: false, message: 'Error fetching chats', error: error.message });
    }
};

// ─── Delete chat ──────────────────────────────────────────────────────────────
export const deleteChat = async (req, res) => {
    try {
        if (!req.params.chatId) {
            return res.status(400).json({ success: false, message: 'Chat ID is required' });
        }
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'User authentication required' });
        }

        const chat = await Chat.findById(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found' });
        }

        const pdf = await PDF.findOne({ _id: chat.pdfId, user: req.user._id });
        if (!pdf) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this chat' });
        }

        await chat.deleteOne();
        pdf.chats = pdf.chats.filter(id => id.toString() !== chat._id.toString());
        await pdf.save();

        res.status(200).json({ success: true, message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('[deleteChat] Error:', error.message);
        res.status(500).json({ success: false, message: 'Error deleting chat', error: error.message });
    }
};