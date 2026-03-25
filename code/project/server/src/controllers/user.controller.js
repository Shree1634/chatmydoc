import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// ─── Token Generators ────────────────────────────────────────────────────────
const generateAccessToken = (id) => {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateRefreshToken = (id) => {
    if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is not configured');
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
};

// ─── Register ────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide username, email and password' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }

        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User with this email or username already exists' });
        }

        const user = await User.create({ username, email, password });
        const token = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.status(201).json({
            success: true,
            token,
            refreshToken,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email or username already exists' });
        }
        res.status(500).json({ success: false, message: 'Error creating user', error: error.message });
    }
};

// ─── Login ───────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.status(200).json({
            success: true,
            token,
            refreshToken,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error logging in', error: error.message });
    }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;
        if (!token) {
            return res.status(401).json({ success: false, message: 'Refresh token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const newAccessToken = generateAccessToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        res.status(200).json({
            success: true,
            token: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
    }
};

// ─── Logout ──────────────────────────────────────────────────────────────────
export const logout = async (req, res) => {
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// ─── Get Profile ─────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const PDF = (await import('../models/pdf.model.js')).default;
        const pdfCount = await PDF.countDocuments({ user: user._id });

        res.status(200).json({
            success: true,
            data: { id: user._id, username: user.username, email: user.email, createdAt: user.createdAt, pdfCount }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching user profile', error: error.message });
    }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
    try {
        const { username, email, currentPassword, newPassword } = req.body;

        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let isModified = false;

        if (username && username !== user.username) {
            const usernameExists = await User.findOne({ username, _id: { $ne: user._id } });
            if (usernameExists) return res.status(400).json({ success: false, message: 'Username already taken' });
            user.username = username;
            isModified = true;
        }

        if (email && email !== user.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: 'Invalid email format' });
            const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
            if (emailExists) return res.status(400).json({ success: false, message: 'Email already taken' });
            user.email = email;
            isModified = true;
        }

        if (newPassword && currentPassword) {
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
            user.password = newPassword;
            isModified = true;
        }

        if (!isModified) {
            return res.status(400).json({ success: false, message: 'No changes to update' });
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ success: false, message: `${field} already exists` });
        }
        res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
    }
};