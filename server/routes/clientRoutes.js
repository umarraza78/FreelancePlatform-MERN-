const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getProfile,
    updateProfile
} = require('../controllers/clientController');

// Profile routes
router.get('/profile/:id', getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router; 