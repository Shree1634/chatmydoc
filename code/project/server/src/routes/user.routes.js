import express from 'express';
import {
    register,
    login,
    logout,
    refreshToken,
    getProfile,
    updateProfile,
} from '../controllers/user.controller.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// ─── Public ───────────────────────────────────────────────
router.post('/register', register);         // POST /api/auth/register
router.post('/login', login);               // POST /api/auth/login
router.post('/refresh', refreshToken);      // POST /api/auth/refresh

// ─── Protected ────────────────────────────────────────────
router.post('/logout', authMiddleware, logout);          // POST /api/auth/logout
router.get('/profile', authMiddleware, getProfile);      // GET  /api/auth/profile
router.put('/profile', authMiddleware, updateProfile);   // PUT  /api/auth/profile

export default router;