console.log('Projects route loaded');
const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { auth, roleAuth } = require('../middleware/auth');
const { validateProject } = require('../middleware/validation');
const User = require('../models/User');
const Message = require('../models/Message');
const Review = require('../models/Review');

// Get all projects
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('client', 'name email')
            .populate('freelancer', 'name email')
            .sort('-createdAt');
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ 
            message: 'Failed to fetch projects',
            error: error.message 
        });
    }
});

// Get single project
router.get('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('client', 'name email')
            .populate('freelancer', 'name email')
            .populate({
                path: 'bids',
                populate: {
                    path: 'freelancer',
                    select: 'name email'
                }
            })
            .populate({
                path: 'reviews',
                populate: {
                    path: 'reviewer',
                    select: 'name email'
                }
            });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ 
            message: 'Failed to fetch project',
            error: error.message 
        });
    }
});

// Create project
router.post('/', auth, roleAuth(['client']), validateProject, async (req, res) => {
    try {
        console.log('Creating project with user:', {
            id: req.user._id,
            role: req.user.role,
            name: req.user.name
        });

        const projectData = {
            title: req.body.title.trim(),
            description: req.body.description.trim(),
            requirements: req.body.requirements.map(req => req.trim()),
            deadline: new Date(req.body.deadline),
            budget: Number(req.body.budget),
            skills: req.body.skills.map(skill => skill.trim()),
            client: req.user._id,
            status: 'open'
        };

        console.log('Project data:', projectData);

        const project = new Project(projectData);
        await project.save();

        console.log('Project saved with ID:', project._id);

        const populatedProject = await Project.findById(project._id)
            .populate('client', 'name email');

        res.status(201).json(populatedProject);
    } catch (error) {
        console.error('Error creating project:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Invalid project data',
                errors: Object.values(error.errors).map(err => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }
        res.status(500).json({ 
            message: 'Failed to create project',
            error: error.message 
        });
    }
});

// Update project
router.put('/:id', auth, roleAuth(['client']), validateProject, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const userId = req.user.id || req.user._id;
        if (project.client.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this project' });
        }

        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id,
            { 
                ...req.body,
                updatedAt: new Date() 
            },
            { new: true, runValidators: true }
        )
        .populate('client', 'name email')
        .populate('freelancer', 'name email');

        res.json(updatedProject);
    } catch (error) {
        console.error('Error updating project:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Invalid project data',
                error: error.message 
            });
        }
        res.status(500).json({ 
            message: 'Failed to update project',
            error: error.message 
        });
    }
});

// Update project status
router.put('/:id/status', auth, roleAuth(['client']), async (req, res) => {
    try {
        const { status } = req.body;
        if (!['open', 'in-progress', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const userIdStatus = req.user.id || req.user._id;
        if (project.client.toString() !== userIdStatus.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this project' });
        }

        project.status = status;
        await project.save();

        const updatedProject = await Project.findById(project._id)
            .populate('client', 'name email')
            .populate('freelancer', 'name email');

        res.json(updatedProject);
    } catch (error) {
        console.error('Error updating project status:', error);
        res.status(500).json({ 
            message: 'Failed to update project status',
            error: error.message 
        });
    }
});

// Delete project
router.delete('/:id', auth, roleAuth(['client']), async (req, res) => {
    try {
        console.log('Attempting to delete project:', req.params.id);
        console.log('User attempting deletion:', {
            userId: req.user._id,
            role: req.user.role
        });

        const project = await Project.findById(req.params.id);
        
        if (!project) {
            console.log('Project not found:', req.params.id);
            return res.status(404).json({ message: 'Project not found' });
        }

        console.log('Project found:', {
            id: project._id,
            clientId: project.client,
            status: project.status
        });

        // Check if user is the project owner
        const userId = req.user.id || req.user._id;
        if (project.client.toString() !== userId.toString()) {
            console.log('Unauthorized deletion attempt:', {
                projectClientId: project.client,
                requestingUserId: userId
            });
            return res.status(403).json({ message: 'Not authorized to delete this project' });
        }

        // Check if project can be deleted (only if it's 'open' or 'cancelled')
        if (!['open', 'cancelled'].includes(project.status)) {
            console.log('Cannot delete project with status:', project.status);
            return res.status(400).json({ 
                message: 'Cannot delete project that is in progress or completed' 
            });
        }

        // Delete related data
        try {
            // Delete all messages related to this project
            await Message.deleteMany({ projectId: project._id });
            console.log('Deleted related messages');

            // Delete all reviews related to this project
            await Review.deleteMany({ project: project._id });
            console.log('Deleted related reviews');

            // Finally delete the project
            await project.deleteOne();
            console.log('Project deleted successfully');

            res.json({ 
                id: req.params.id, 
                message: 'Project and all related data deleted successfully' 
            });
        } catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError);
            throw new Error('Failed to clean up related data');
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ 
            message: 'Failed to delete project',
            error: error.message 
        });
    }
});

// Submit a bid to a project (real-time)
router.post('/:projectId/bids', auth, roleAuth(['freelancer']), async (req, res) => {
    try {
        console.log('Submitting bid - User:', {
            id: req.user._id,
            role: req.user.role,
            name: req.user.name
        });

        const { projectId } = req.params;
        const { amount, message } = req.body;

        // Validate project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if project is still open
        if (project.status !== 'open') {
            return res.status(400).json({ message: 'This project is no longer accepting bids' });
        }

        // Create new bid
        const newBid = {
            freelancer: req.user._id,
            amount: Number(amount),
            message,
            status: 'pending',
            createdAt: new Date()
        };

        console.log('Creating new bid:', newBid);

        // Add bid to project
        project.bids.push(newBid);
        await project.save();

        // Get the saved bid
        const savedBid = project.bids[project.bids.length - 1];
        console.log('Saved bid:', savedBid);

        // Populate freelancer details
        const populatedProject = await Project.findById(projectId)
            .populate('bids.freelancer', 'name email');
        const populatedBid = populatedProject.bids.id(savedBid._id);

        // Emit real-time event
        const io = req.app.get('io');
        if (io) {
            io.to(projectId).emit('newBid', populatedBid);
        }

        res.status(201).json(populatedBid);
    } catch (error) {
        console.error('Error submitting bid:', error);
        res.status(500).json({ 
            message: 'Failed to submit bid', 
            error: error.message 
        });
    }
});

// Counter-offer endpoint (real-time)
router.put('/:projectId/bids/:bidId/counter', auth, roleAuth(['client']), async (req, res) => {
    try {
        const { projectId, bidId } = req.params;
        const { amount, message } = req.body;
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        const bid = project.bids.id(bidId);
        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }
        bid.counterOffer = { amount, message, status: 'pending' };
        await project.save();
        // Emit real-time event
        const io = req.app.get('io');
        io.to(projectId).emit('counterOffer', bid);
        res.json(bid);
    } catch (error) {
        res.status(500).json({ message: 'Failed to send counter-offer', error: error.message });
    }
});

// Accept a bid (real-time)
router.put('/:projectId/bids/:bidId/accept', auth, roleAuth(['client']), async (req, res) => {
    try {
        const { projectId, bidId } = req.params;
        
        // Find project and populate freelancer details
        const project = await Project.findById(projectId).populate('freelancer');
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Find the bid to accept
        const acceptedBid = project.bids.id(bidId);
        if (!acceptedBid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Update project status and assign freelancer
        project.status = 'in-progress';
        project.freelancer = acceptedBid.freelancer;
        acceptedBid.status = 'accepted';

        // Reject all other bids
        project.bids.forEach(bid => {
            if (bid._id.toString() !== bidId) {
                bid.status = 'rejected';
            }
        });

        // Save the updated project
        await project.save();

        // Emit socket events for bid status updates
        const io = req.app.get('io');
        io.to(projectId).emit('bidStatusUpdate', { 
            bidId, 
            status: 'accepted',
            projectStatus: 'in-progress',
            freelancerId: acceptedBid.freelancer
        });

        // Also emit events for rejected bids
        project.bids.forEach(bid => {
            if (bid._id.toString() !== bidId) {
                io.to(projectId).emit('bidStatusUpdate', { 
                    bidId: bid._id, 
                    status: 'rejected' 
                });
            }
        });

        // Return the updated project
        const populatedProject = await Project.findById(projectId)
            .populate('client', 'name email')
            .populate('freelancer', 'name email')
            .populate('bids.freelancer', 'name email');

        res.json(populatedProject);
    } catch (error) {
        console.error('Error accepting bid:', error);
        res.status(500).json({ message: 'Failed to accept bid', error: error.message });
    }
});

// Reject a bid (real-time)
router.put('/:projectId/bids/:bidId/reject', auth, roleAuth(['client']), async (req, res) => {
    try {
        const { projectId, bidId } = req.params;
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        const bid = project.bids.id(bidId);
        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }
        bid.status = 'rejected';
        await project.save();
        const io = req.app.get('io');
        io.to(projectId).emit('bidStatusUpdate', { bidId, status: 'rejected' });
        res.json({ bidId, status: 'rejected' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to reject bid', error: error.message });
    }
});

// @route   PUT /api/projects/:id/complete
// @desc    Mark a project as complete and update freelancer earnings
// @access  Private (Freelancer only)
router.put('/:id/complete', auth, roleAuth(['freelancer']), async (req, res) => {
    try {
        console.log('Attempting to complete project:', req.params.id);
        console.log('User attempting completion:', {
            userId: req.user._id,
            role: req.user.role,
            name: req.user.name
        });

        // Get project and populate necessary fields
        const project = await Project.findById(req.params.id)
            .populate('client', 'name email')
            .populate('freelancer', 'name email');

        if (!project) {
            console.log('Project not found:', req.params.id);
            return res.status(404).json({ message: 'Project not found' });
        }

        console.log('Project found:', {
            id: project._id,
            status: project.status,
            freelancerId: project.freelancer?._id
        });

        // Verify that the logged-in freelancer is assigned to this project
        const freelancerId = project.freelancer?._id?.toString() || project.freelancer?.toString();
        const userId = req.user._id.toString();

        console.log('Comparing IDs:', {
            freelancerId,
            userId,
            match: freelancerId === userId
        });

        if (freelancerId !== userId) {
            console.log('Authorization failed:', {
                freelancerId,
                userId,
                projectFreelancer: project.freelancer
            });
            return res.status(403).json({ message: 'Not authorized to complete this project' });
        }

        // Verify project is in-progress
        if (project.status !== 'in-progress') {
            console.log('Invalid project status:', project.status);
            return res.status(400).json({ message: 'Only in-progress projects can be marked as complete' });
        }

        // Find the accepted bid amount
        const acceptedBid = project.bids.find(bid => 
            (bid.freelancer.toString() === userId || 
             bid.freelancer._id?.toString() === userId) && 
            bid.status === 'accepted'
        );

        if (!acceptedBid) {
            console.log('No accepted bid found for user:', userId);
            return res.status(400).json({ message: 'No accepted bid found for this project' });
        }

        console.log('Found accepted bid:', {
            bidId: acceptedBid._id,
            amount: acceptedBid.amount
        });

        // Update project status
        project.status = 'completed';
        project.completedAt = Date.now();

        // Update freelancer earnings
        const freelancer = await User.findById(userId);
        
        // Initialize earnings object if it doesn't exist
        if (!freelancer.earnings) {
            freelancer.earnings = {
                total: 0,
                monthly: 0,
                history: []
            };
        }

        // Add project earnings (use the accepted bid amount)
        const earnings = acceptedBid.amount;
        freelancer.earnings.total = (freelancer.earnings.total || 0) + earnings;

        // Add to earnings history
        freelancer.earnings.history.push({
            project: project._id,
            amount: earnings,
            date: Date.now()
        });

        console.log('Updating earnings:', {
            userId,
            projectId: project._id,
            amount: earnings,
            newTotal: freelancer.earnings.total
        });

        // Save both project and freelancer
        await Promise.all([
            project.save(),
            freelancer.save()
        ]);

        console.log('Successfully completed project and updated earnings');

        // Emit socket event for project completion
        const io = req.app.get('io');
        if (io) {
            io.to(project._id.toString()).emit('projectCompleted', {
                projectId: project._id,
                status: 'completed'
            });
        }

        // Return updated project and user data
        res.json({
            project: await project.populate([
                { path: 'client', select: 'name email' },
                { path: 'freelancer', select: 'name email earnings' }
            ]),
            user: {
                ...freelancer.toJSON(),
                password: undefined
            }
        });

    } catch (error) {
        console.error('Error completing project:', error);
        res.status(500).json({ 
            message: 'Server error while completing project',
            error: error.message 
        });
    }
});

module.exports = router; 