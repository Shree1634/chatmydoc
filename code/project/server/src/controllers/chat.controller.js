import { GoogleGenerativeAI } from '@google/generative-ai';
import Chat from '../models/chat.model.js';
import PDF from '../models/pdf.model.js';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Get conversation history
const getPreviousContext = async (pdfId, limit = 2) => {
    console.log(`[getPreviousContext] Fetching previous ${limit} conversations for PDF: ${pdfId}`);
    try {
        const previousChats = await Chat.find({ pdfId })
            .sort({ createdAt: -1 })
            .limit(limit);

        console.log(`[getPreviousContext] Found ${previousChats.length} previous chats for PDF: ${pdfId}`);

        return previousChats.reverse().map(chat =>
            `Question: ${chat.question}\nAnswer: ${chat.response}`
        ).join('\n\n');
    } catch (error) {
        console.error(`[getPreviousContext] Failed to fetch conversation history:`, {
            pdfId,
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error; // Re-throw for proper handling in calling function
    }
};

// Ask question with context
<<<<<<< HEAD
// Ask question with context
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
    console.log(`[askQuestion] [${currentStage}] Starting request`);

    try {
        // --- STAGE: AUTHENTICATION ---
        currentStage = STAGE.AUTH;
        if (!req.user || !req.user._id) {
            console.error(`[askQuestion] [${currentStage}] failed: User not authenticated`);
            return res.status(401).json({
                success: false,
                message: 'User authentication required',
                stage: currentStage
            });
        }

        // --- STAGE: INPUT VALIDATION ---
        currentStage = STAGE.VALIDATION;
        const { question } = req.body;
        const pdfId = req.params.pdfId || req.params.id;

        if (!question || question.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Question cannot be empty',
                stage: currentStage
            });
        }
        if (!pdfId) {
            return res.status(400).json({
                success: false,
                message: 'PDF ID is required',
                stage: currentStage
            });
        }

        console.log(`[askQuestion] [${currentStage}] Question: "${question.substring(0, 50)}..." | PDF: ${pdfId}`);

        // --- STAGE: DB FETCH PDF ---
        currentStage = STAGE.DB_FETCH;
=======
export const askQuestion = async (req, res) => {
    console.log("[askQuestion] Processing question request");
    try {
        // Input validation
        if (!req.body.question || req.body.question.trim() === '') {
            console.error("[askQuestion] No question provided in request");
            return res.status(400).json({
                success: false,
                message: 'Question is required'
            });
        }

        if (!req.params.pdfId) {
            console.error("[askQuestion] No PDF ID provided in request");
            return res.status(400).json({
                success: false,
                message: 'PDF ID is required'
            });
        }

        if (!req.user?._id) {
            console.error("[askQuestion] No user ID available in request");
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        const { question } = req.body;
        const pdfId = req.params.pdfId;

        console.log(`[askQuestion] Processing question: "${question}" for PDF: ${pdfId}`);

        // Get PDF with text content
        console.log(`[askQuestion] Fetching PDF document: ${pdfId}`);
>>>>>>> 535b24171ee6a745f7f6f24d151e85dcb019a0fe
        const pdf = await PDF.findOne({
            _id: pdfId,
            user: req.user._id
        }).select('+textContent');

        if (!pdf) {
<<<<<<< HEAD
            console.warn(`[askQuestion] [${currentStage}] PDF not found: ${pdfId}`);
            return res.status(404).json({
                success: false,
                message: 'PDF not found',
                stage: currentStage
            });
        }

        if (!pdf.textContent || pdf.textContent.trim().length < 10) {
            console.warn(`[askQuestion] [${currentStage}] PDF empty or too short. Length: ${pdf.textContent?.length}`);
            return res.status(400).json({
                success: false,
                message: 'The PDF content is empty or too short to analyze.',
                stage: currentStage
            });
        }

        // --- STAGE: DB FETCH CONTEXT ---
        currentStage = STAGE.CONTEXT_FETCH;
        const previousContext = await getPreviousContext(pdfId);

        // --- STAGE: AI GENERATION ---
        currentStage = STAGE.AI_GEN;

        // Sanity Check: Ensure API Key exists
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("Server misconfiguration: GEMINI_API_KEY is missing");
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

        let responseText = "";
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            responseText = response.text();

            if (!responseText) throw new Error("AI returned empty response");
        } catch (aiError) {
            console.error(`[askQuestion] [${currentStage}] Gemini API Error:`, aiError.message);
            // Distinguish between block/safety vs network
            let userMsg = "Failed to generate answer from AI.";
            if (aiError.message.includes("SAFETY")) userMsg = "The response was blocked due to safety settings.";
            if (aiError.message.includes("API key")) userMsg = "Service configuration error (API Key).";

            return res.status(503).json({
                success: false,
                message: userMsg,
                error: aiError.message,
                stage: currentStage
            });
        }

        // --- STAGE: DB SAVE CHAT ---
        currentStage = STAGE.DB_SAVE;
        const chat = await Chat.create({
            pdfId: pdf._id,
            userId: req.user._id,
            question,
            response: responseText
        });

        await pdf.addChat(chat._id);

        console.log(`[askQuestion] [SUCCESS] Chat saved: ${chat._id}`);
        res.status(200).json({
            success: true,
            data: chat
        });

    } catch (error) {
        console.error(`[askQuestion] [CRITICAL FAILURE] Stage: ${currentStage}`, error);
        res.status(500).json({
            success: false,
            message: 'Internal server error processing your question.',
            error: error.message,
            stage: currentStage
=======
            console.error(`[askQuestion] PDF not found with ID: ${pdfId} for user: ${req.user._id}`);
            return res.status(404).json({
                success: false,
                message: 'PDF not found'
            });
        }

        if (!pdf.textContent || pdf.textContent.trim() === '') {
            console.error(`[askQuestion] PDF ${pdfId} has no text content to analyze`);
            return res.status(400).json({
                success: false,
                message: 'PDF has no text content to analyze'
            });
        }

        // Get previous context
        console.log(`[askQuestion] Retrieving conversation history for PDF: ${pdfId}`);
        const previousContext = await getPreviousContext(pdfId);

        // Construct prompt with context
        console.log(`[askQuestion] Constructing AI prompt`);
        const prompt = `Context from PDF: "${pdf.textContent}"
        Previous conversation:
        ${previousContext}

        Current question: ${question}

        Please provide a detailed answer to the current question based on the PDF content and previous conversation context.`;

        // Generate response
        console.log(`[askQuestion] Sending prompt to Gemini AI`);
        try {
            const result = await model.generateContent(prompt);
            const response = result.response.text();
            console.log(`[askQuestion] Successfully received AI response`);

            // Save chat
            console.log(`[askQuestion] Saving chat to database`);
            const chat = await Chat.create({
                pdfId: pdf._id,
                userId: req.user._id,
                question,
                response
            });
            console.log(`[askQuestion] Chat saved with ID: ${chat._id}`);

            // Add chat to PDF
            console.log(`[askQuestion] Adding chat to PDF's chat history`);
            await pdf.addChat(chat._id);
            console.log(`[askQuestion] Chat added to PDF successfully`);

            res.status(200).json({
                success: true,
                data: chat
            });
        } catch (aiError) {
            console.error("[askQuestion] AI processing error:", {
                message: aiError.message,
                stack: aiError.stack,
                name: aiError.name
            });

            res.status(500).json({
                success: false,
                message: 'Failed to process question with AI',
                error: aiError.message
            });
        }
    } catch (error) {
        console.error("[askQuestion] Unexpected error:", {
            pdfId: req.params.pdfId,
            userId: req.user?._id,
            question: req.body?.question,
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        res.status(500).json({
            success: false,
            message: 'Error processing question',
            error: error.message
>>>>>>> 535b24171ee6a745f7f6f24d151e85dcb019a0fe
        });
    }
};

// Get all chats for a PDF
export const getPDFChats = async (req, res) => {
    console.log(`[getPDFChats] Fetching chats for PDF: ${req.params.pdfId}`);
    try {
        if (!req.params.pdfId) {
            console.error("[getPDFChats] No PDF ID provided");
            return res.status(400).json({
                success: false,
                message: 'PDF ID is required'
            });
        }

        if (!req.user?._id) {
            console.error("[getPDFChats] No user ID available");
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        console.log(`[getPDFChats] Verifying PDF ownership for user: ${req.user._id}`);
        const pdf = await PDF.findOne({
            _id: req.params.pdfId,
            user: req.user._id
        });

        if (!pdf) {
            console.error(`[getPDFChats] PDF not found with ID: ${req.params.pdfId} for user: ${req.user._id}`);
            return res.status(404).json({
                success: false,
                message: 'PDF not found'
            });
        }

        console.log(`[getPDFChats] Querying chats for PDF: ${pdf._id}`);
        const chats = await Chat.find({ pdfId: pdf._id })
            .sort('createdAt')
            .select('question response createdAt');

        console.log(`[getPDFChats] Successfully retrieved ${chats.length} chats for PDF: ${pdf._id}`);
        res.status(200).json({
            success: true,
            count: chats.length,
            data: chats
        });
    } catch (error) {
        console.error("[getPDFChats] Error fetching chats:", {
            pdfId: req.params.pdfId,
            userId: req.user?._id,
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        res.status(500).json({
            success: false,
            message: 'Error fetching chats',
            error: error.message
        });
    }
};

// Delete chat
export const deleteChat = async (req, res) => {
    console.log(`[deleteChat] Attempting to delete chat: ${req.params.chatId}`);
    try {
        if (!req.params.chatId) {
            console.error("[deleteChat] No chat ID provided");
            return res.status(400).json({
                success: false,
                message: 'Chat ID is required'
            });
        }

        if (!req.user?._id) {
            console.error("[deleteChat] No user ID available");
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        console.log(`[deleteChat] Finding chat with ID: ${req.params.chatId}`);
        const chat = await Chat.findById(req.params.chatId);

        if (!chat) {
            console.error(`[deleteChat] Chat not found with ID: ${req.params.chatId}`);
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Verify user owns the PDF associated with the chat
        console.log(`[deleteChat] Verifying PDF ownership for chat: ${chat._id}`);
        const pdf = await PDF.findOne({
            _id: chat.pdfId,
            user: req.user._id
        });

        if (!pdf) {
            console.error(`[deleteChat] User ${req.user._id} not authorized to delete chat ${chat._id}`);
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this chat'
            });
        }

        console.log(`[deleteChat] Deleting chat: ${chat._id}`);
        await chat.deleteOne();

        // Remove chat from PDF's chats array
        console.log(`[deleteChat] Removing chat reference from PDF: ${pdf._id}`);
        pdf.chats = pdf.chats.filter(id => id.toString() !== chat._id.toString());
        await pdf.save();

        console.log(`[deleteChat] Successfully deleted chat: ${chat._id}`);
        res.status(200).json({
            success: true,
            message: 'Chat deleted successfully'
        });
    } catch (error) {
        console.error("[deleteChat] Error deleting chat:", {
            chatId: req.params.chatId,
            userId: req.user?._id,
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        res.status(500).json({
            success: false,
            message: 'Error deleting chat',
            error: error.message
        });
    }
};