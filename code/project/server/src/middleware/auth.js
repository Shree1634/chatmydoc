import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'No authorization token provided' });
        }

        // Accept both "Bearer <token>" and plain "<token>"
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7).trim()
            : authHeader.trim();

        if (!token) {
            return res.status(401).json({ success: false, message: 'Token is empty' });
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('❌ [AUTH] JWT_SECRET is not set');
            return res.status(500).json({ success: false, message: 'Server configuration error' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, secret);
        } catch (err) {
            const msg = err.name === 'TokenExpiredError'
                ? 'Token has expired — please log in again'
                : 'Invalid token';
            return res.status(403).json({ success: false, message: msg });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User account not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('❌ [AUTH] Middleware error:', error.message);
        return res.status(500).json({ success: false, message: 'Authentication error' });
    }
};

export default authMiddleware;