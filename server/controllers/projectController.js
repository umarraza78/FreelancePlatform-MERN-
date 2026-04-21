// @desc    Accept a bid
// @route   POST /api/projects/:projectId/bids/:bidId/accept
// @access  Private (Client only)
const acceptBid = asyncHandler(async (req, res) => {
    const { projectId, bidId } = req.params;
    
    // Find project and verify ownership
    const project = await Project.findById(projectId);
    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    // Verify project ownership
    if (project.client.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to accept bids for this project');
    }

    // Find the bid
    const bid = project.bids.id(bidId);
    if (!bid) {
        res.status(404);
        throw new Error('Bid not found');
    }

    // Check if project is still open
    if (project.status !== 'open') {
        res.status(400);
        throw new Error('Can only accept bids for open projects');
    }

    // Check if bid is still pending
    if (bid.status !== 'pending') {
        res.status(400);
        throw new Error('Can only accept pending bids');
    }

    // Update bid status and assign freelancer
    bid.status = 'accepted';
    project.status = 'in-progress';
    project.freelancer = bid.freelancer;
    project.acceptedBid = bid._id;
    
    // Reject all other bids
    project.bids.forEach(otherBid => {
        if (otherBid._id.toString() !== bidId) {
            otherBid.status = 'rejected';
        }
    });

    // Save the updated project
    await project.save();

    // Populate the project with freelancer and client details
    await project.populate([
        { path: 'client', select: 'name email' },
        { path: 'freelancer', select: 'name email' },
        { path: 'bids.freelancer', select: 'name email' }
    ]);

    // Emit socket event for bid status update
    const io = req.app.get('io');
    io.to(projectId).emit('bidStatusUpdate', { 
        bidId,
        status: 'accepted',
        projectStatus: 'in-progress',
        freelancer: project.freelancer
    });

    res.json(project);
}); 