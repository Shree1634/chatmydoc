import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7, authHeader.length)
        : authHeader;

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }


        try {
            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            req.user = user;
            next();
        } catch (error) {
            return res.status(500).json({ message: 'Internal server error' });
        }
    });
};

export default authMiddleware;