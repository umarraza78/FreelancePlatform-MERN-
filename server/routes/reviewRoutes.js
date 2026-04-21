const express = require('express');
const router = express.Router();
const {
    createReview,
    getProjectReviews,
    getMyReviews,
    updateReview,
    deleteReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Routes that don't need a specific review ID
router.post('/', protect, createReview);
router.get('/me', protect, getMyReviews);
router.get('/project/:projectId', getProjectReviews);

// Routes that need a specific review ID
router.route('/:id')
    .put(protect, updateReview)
    .delete(protect, deleteReview);

module.exports = router; 