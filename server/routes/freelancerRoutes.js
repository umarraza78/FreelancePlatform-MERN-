const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getProfile,
    updateProfile,
    addSkill,
    removeSkill,
    addPortfolioItem,
    removePortfolioItem,
    updatePortfolioItem
} = require('../controllers/freelancerController');

// Profile routes
router.get('/profile/:id', getProfile);
router.put('/profile', protect, updateProfile);

// Skills routes
router.post('/skills', protect, addSkill);
router.delete('/skills/:id', protect, removeSkill);

// Portfolio routes
router.post('/portfolio', protect, addPortfolioItem);
router.delete('/portfolio/:id', protect, removePortfolioItem);
router.put('/portfolio/:id', protect, updatePortfolioItem);

module.exports = router; 