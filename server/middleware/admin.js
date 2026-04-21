const admin = (req, res, next) => {
    // Check if user exists and is an admin
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }
    next();
};

module.exports = admin; 