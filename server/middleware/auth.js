const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            console.log('Auth failed: No token provided');
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        console.log('Verifying token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Handle both token formats (userId and id)
        const userId = decoded.userId || decoded.id;
        console.log('Decoded token user ID:', userId);
        
        const user = await User.findById(userId)
            .select('-password')
            .lean();  // Use lean() for better performance
            
        console.log('Auth middleware - Found user:', {
            id: user?._id,
            role: user?.role,
            name: user?.name
        });

        if (!user) {
            console.log('Auth failed: User not found for ID:', userId);
            return res.status(401).json({ message: 'Token is not valid - User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            message: 'Token is not valid',
            error: error.message
        });
    }
};

const roleAuth = (roles) => {
    return (req, res, next) => {
        console.log('Role check:', {
            userRole: req.user.role,
            requiredRoles: roles
        });
        
        if (!roles.includes(req.user.role)) {
            console.log('Role auth failed:', req.user.role, 'not in', roles);
            return res.status(403).json({ 
                message: `User role ${req.user.role} is not authorized to access this route`,
                requiredRoles: roles
            });
        }
        next();
    };
};

module.exports = { auth, roleAuth }; 