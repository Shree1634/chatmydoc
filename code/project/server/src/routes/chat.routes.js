import express from 'express';
import {
    askQuestion,
    getPDFChats,
    deleteChat
} from '../controllers/chat.controller.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Chat routes
<<<<<<< HEAD
router.post('/:pdfId/chat', askQuestion);
router.get('/:pdfId/chats', getPDFChats);
router.delete('/:pdfId/chats/:chatId', deleteChat);

export default router;
=======
router.post('/:pdfId/question', askQuestion);
router.get('/:pdfId/chats', getPDFChats);
router.delete('/chats/:chatId', deleteChat);

export default router;
>>>>>>> 535b24171ee6a745f7f6f24d151e85dcb019a0fe
