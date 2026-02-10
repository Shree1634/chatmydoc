import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const authMiddleware = (req, res, next) => {
<<<<<<< HEAD
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7, authHeader.length)
        : authHeader;

=======
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

>>>>>>> 535b24171ee6a745f7f6f24d151e85dcb019a0fe
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }
<<<<<<< HEAD

=======
        
>>>>>>> 535b24171ee6a745f7f6f24d151e85dcb019a0fe

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