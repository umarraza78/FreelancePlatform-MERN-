const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Project = require('../models/Project');
const User = require('../models/User');
const Freelancer = require('../models/freelancerModel');
const { auth, roleAuth } = require('../middleware/auth');

// Create review
router.post('/', auth, roleAuth(['client']), async (req, res) => {
    try {
        console.log('Creating review - User:', {
            userId: req.user._id,
            role: req.user.role,
            name: req.user.name
        });

        const { projectId, rating, comment } = req.body;

        // Validate project exists and is completed
        const project = await Project.findById(projectId)
            .populate('freelancer', '_id user')
            .populate('client', '_id');

        if (!project) {
            console.log('Project not found:', projectId);
            return res.status(404).json({ message: 'Project not found' });
        }

        // Verify the project is completed
        if (project.status !== 'completed') {
            console.log('Cannot review incomplete project:', {
                projectId,
                status: project.status
            });
            return res.status(400).json({ 
                message: 'Can only review completed projects' 
            });
        }

        // Verify the user is the client of the project
        if (project.client._id.toString() !== req.user._id.toString()) {
            console.log('Unauthorized review attempt:', {
                projectClient: project.client._id,
                requestingUser: req.user._id
            });
            return res.status(403).json({ 
                message: 'Only the project client can submit reviews' 
            });
        }

        // Check if a review already exists
        const existingReview = await Review.findOne({
            project: projectId,
            reviewer: req.user._id
        });

        if (existingReview) {
            console.log('Review already exists:', existingReview._id);
            return res.status(400).json({ 
                message: 'You have already reviewed this project' 
            });
        }

        console.log('Creating review:', {
            projectId,
            rating,
            hasComment: !!comment
        });

        // Create the review
        const review = new Review({
            project: projectId,
            reviewer: req.user._id,
            rating,
            comment
        });

        await review.save();
        console.log('Review saved successfully:', review._id);

        // Update freelancer's rating
        if (project.freelancer && project.freelancer.user) {
            console.log('Looking for freelancer with user ID:', project.freelancer.user);
            
            const freelancer = await Freelancer.findOne({ user: project.freelancer.user });
            console.log('Found freelancer:', freelancer ? {
                id: freelancer._id,
                currentRating: freelancer.rating,
                currentTotalReviews: freelancer.totalReviews
            } : 'No freelancer found');

            if (freelancer) {
                const oldRating = freelancer.rating || 0;
                const oldTotalReviews = freelancer.totalReviews || 0;
                
                // Calculate new rating
                const newTotalReviews = oldTotalReviews + 1;
                const newRating = ((oldRating * oldTotalReviews) + rating) / newTotalReviews;
                
                console.log('Updating freelancer rating:', {
                    freelancerId: freelancer._id,
                    oldRating,
                    newRating,
                    oldTotalReviews,
                    newTotalReviews
                });

                freelancer.rating = newRating;
                freelancer.totalReviews = newTotalReviews;
                await freelancer.save();
                
                console.log('Freelancer rating updated successfully');
            } else {
                console.log('Warning: Freelancer profile not found for user:', project.freelancer.user);
            }
        } else {
            console.log('Warning: No freelancer associated with project');
        }

        // Populate the review with user details
        const populatedReview = await Review.findById(review._id)
            .populate('reviewer', 'name email')
            .populate('project', 'title');

        res.status(201).json(populatedReview);
    } catch (error) {
        console.error('Error creating review:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Invalid review data',
                errors: Object.values(error.errors).map(err => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }
        res.status(500).json({ 
            message: 'Failed to create review',
            error: error.message 
        });
    }
});

// Get reviews for a project
router.get('/project/:projectId', async (req, res) => {
    try {
        const reviews = await Review.find({ project: req.params.projectId })
            .populate('reviewer', 'name email')
            .sort('-createdAt');
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching project reviews:', error);
        res.status(500).json({ 
            message: 'Failed to fetch reviews',
            error: error.message 
        });
    }
});

// Get reviews by a user
router.get('/user/:userId', async (req, res) => {
    try {
        const reviews = await Review.find({ reviewer: req.params.userId })
            .populate('project', 'title')
            .sort('-createdAt');
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching user reviews:', error);
        res.status(500).json({ 
            message: 'Failed to fetch reviews',
            error: error.message 
        });
    }
});

// Respond to a review
router.put('/:id/response', auth, roleAuth(['freelancer']), async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { response: req.body.response }, { new: true });
  res.json(review);
});

// Get reviews for a freelancer
router.get('/freelancer/:freelancerId', async (req, res) => {
    try {
        // Find all projects where this freelancer was assigned
        const projects = await Project.find({ 
            freelancer: req.params.freelancerId,
            status: 'completed'
        });

        // Get all reviews for these projects
        const projectIds = projects.map(p => p._id);
        const reviews = await Review.find({ 
            project: { $in: projectIds }
        }).populate('reviewer', 'name');

        // Calculate average rating
        const validReviews = reviews.filter(review => 
            review && typeof review.rating === 'number' && 
            review.rating >= 1 && review.rating <= 5
        );

        const totalRating = validReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = validReviews.length > 0 ? totalRating / validReviews.length : 0;

        res.json({
            reviews: validReviews,
            averageRating: Number(averageRating.toFixed(1)),
            totalReviews: validReviews.length
        });
    } catch (error) {
        console.error('Error fetching freelancer reviews:', error);
        res.status(500).json({ 
            message: 'Failed to fetch reviews',
            error: error.message 
        });
    }
});

module.exports = router; 