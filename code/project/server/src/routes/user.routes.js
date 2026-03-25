import express from 'express';
import {
    register,
    login,
    logout,
    refreshToken,
    getProfile,
    updateProfile
} from '../controllers/user.controller.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', authMiddleware, logout);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

export default router;