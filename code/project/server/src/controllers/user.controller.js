import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// ─── Token Generators ─────────────────────────────────────
const generateAccessToken = (id) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured');
    return jwt.sign({ id }, secret, { expiresIn: '7d' });
};

const generateRefreshToken = (id) => {
    // JWT_REFRESH_SECRET is required; fall back to JWT_SECRET with a warning
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_REFRESH_SECRET is not configured');
    if (!process.env.JWT_REFRESH_SECRET) {
        console.warn('⚠️  JWT_REFRESH_SECRET not set — using JWT_SECRET as fallback. Add it to .env');
    }
    return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

// ─── Register ─────────────────────────────────────────────
export const register = async (req, res) => {
    console.log('\n📋 [REGISTER] Body received:', {
        username: req.body?.username,
        email: req.body?.email,
        hasPassword: !!req.body?.password,
    });

    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username, email and password',
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
        if (existing) {
            const field = existing.email === email.toLowerCase() ? 'email' : 'username';
            return res.status(400).json({
                success: false,
                message: field === 'email'
                    ? 'An account with this email already exists'
                    : 'This username is already taken',
            });
        }

        const user = await User.create({ username, email, password });
        console.log('✅ [REGISTER] User created:', user._id);

        const token = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        return res.status(201).json({
            success: true,
            token,
            refreshToken,
            user: { id: user._id, username: user.username, email: user.email },
        });
    } catch (error) {
        console.error('❌ [REGISTER] Error:', error.message);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || 'field';
            return res.status(400).json({ success: false, message: `${field} already exists` });
        }
        return res.status(500).json({ success: false, message: 'Registration failed: ' + error.message });
    }
};

// ─── Login ────────────────────────────────────────────────
export const login = async (req, res) => {
    console.log('\n🔑 [LOGIN] Attempt for:', req.body?.email);

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            console.warn('⚠️  [LOGIN] No user found for email:', email);
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.warn('⚠️  [LOGIN] Wrong password for:', email);
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        console.log('✅ [LOGIN] Success for:', email);

        return res.status(200).json({
            success: true,
            token,
            refreshToken,
            user: { id: user._id, username: user.username, email: user.email },
        });
    } catch (error) {
        console.error('❌ [LOGIN] Error:', error.message);
        return res.status(500).json({ success: false, message: 'Login failed: ' + error.message });
    }
};

// ─── Refresh Token ────────────────────────────────────────
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;
        if (!token) return res.status(401).json({ success: false, message: 'Refresh token required' });

        const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const newToken = generateAccessToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        return res.status(200).json({ success: true, token: newToken, refreshToken: newRefreshToken });
    } catch {
        return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
    }
};

// ─── Logout ───────────────────────────────────────────────
export const logout = async (_req, res) => {
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// ─── Get Profile ──────────────────────────────────────────
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const PDF = (await import('../models/pdf.model.js')).default;
        const pdfCount = await PDF.countDocuments({ user: user._id });

        return res.status(200).json({
            success: true,
            data: { id: user._id, username: user.username, email: user.email, createdAt: user.createdAt, pdfCount },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
    }
};

// ─── Update Profile ───────────────────────────────────────
export const updateProfile = async (req, res) => {
    try {
        const { username, email, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        let changed = false;

        if (username && username !== user.username) {
            const taken = await User.findOne({ username, _id: { $ne: user._id } });
            if (taken) return res.status(400).json({ success: false, message: 'Username already taken' });
            user.username = username;
            changed = true;
        }

        if (email && email !== user.email) {
            if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, message: 'Invalid email' });
            const taken = await User.findOne({ email, _id: { $ne: user._id } });
            if (taken) return res.status(400).json({ success: false, message: 'Email already taken' });
            user.email = email.toLowerCase();
            changed = true;
        }

        if (newPassword && currentPassword) {
            const ok = await user.comparePassword(currentPassword);
            if (!ok) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'New password too short' });
            user.password = newPassword;
            changed = true;
        }

        if (!changed) return res.status(400).json({ success: false, message: 'No changes to update' });

        await user.save();
        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { id: user._id, username: user.username, email: user.email },
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0];
            return res.status(400).json({ success: false, message: `${field} already exists` });
        }
        return res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
    }
};