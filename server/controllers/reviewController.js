const asyncHandler = require('express-async-handler');
const Review = require('../models/reviewModel');
const Project = require('../models/projectModel');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
    const { rating, comment, projectId } = req.body;

    if (!rating || !comment || !projectId) {
        res.status(400);
        throw new Error('Please provide rating, comment and project ID');
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    // Check if user has already reviewed this project
    const existingReview = await Review.findOne({
        project: projectId,
        reviewer: req.user._id
    });

    if (existingReview) {
        res.status(400);
        throw new Error('You have already reviewed this project');
    }

    const review = await Review.create({
        rating,
        comment,
        project: projectId,
        reviewer: req.user._id
    });

    res.status(201).json(review);
});

// @desc    Get all reviews for a project
// @route   GET /api/reviews/project/:projectId
// @access  Public
const getProjectReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({ project: req.params.projectId })
        .populate('reviewer', 'name')
        .sort('-createdAt');

    res.json(reviews);
});

// @desc    Get all reviews by the logged-in user
// @route   GET /api/reviews/me
// @access  Private
const getMyReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({ reviewer: req.user._id })
        .populate('project', 'title')
        .sort('-createdAt');

    res.json(reviews);
});

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    // Check if user owns the review
    if (review.reviewer.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to update this review');
    }

    const { rating, comment } = req.body;

    if (!rating && !comment) {
        res.status(400);
        throw new Error('Please provide rating or comment to update');
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;

    const updatedReview = await review.save();
    res.json(updatedReview);
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    // Check if user owns the review
    if (review.reviewer.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to delete this review');
    }

    await review.deleteOne();
    res.json({ message: 'Review deleted successfully' });
});

module.exports = {
    createReview,
    getProjectReviews,
    getMyReviews,
    updateReview,
    deleteReview
}; 