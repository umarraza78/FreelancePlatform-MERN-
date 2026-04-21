const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes middleware
const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user ID from token (handle different field names)
            const userId = decoded.userId || decoded.id || decoded._id;
            if (!userId) {
                console.error('No user ID found in token:', decoded);
                res.status(401);
                throw new Error('Invalid token format');
            }

            // Get user from token
            req.user = await User.findById(userId).select('-password');
            console.log('Auth middleware - Found user:', req.user ? {
                id: req.user._id,
                name: req.user.name,
                role: req.user.role
            } : 'No user found');

            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            next();
        } else {
            console.error('No authorization header or invalid format');
            res.status(401);
            throw new Error('Not authorized, no token');
        }
    } catch (error) {
        console.error('Auth middleware error:', {
            message: error.message,
            stack: error.stack
        });
        res.status(401);
        throw new Error(error.message || 'Not authorized');
    }
};

// Role authorization middleware
const roleAuth = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            res.status(403);
            throw new Error(`User role ${req.user.role} is not authorized to access this route`);
        }
        next();
    };
};

module.exports = { protect, roleAuth }; 