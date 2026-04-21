const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Project');
const Skill = require('../models/skillModel');
const { auth, roleAuth } = require('../middleware/auth');
const admin = require('../middleware/admin');
const documentService = require('../services/documentService');
const notificationService = require('../services/notificationService');
const NotificationTemplate = require('../models/NotificationTemplate');

// Logging middleware for admin routes
router.use((req, res, next) => {
    console.log('Admin route accessed:', {
        path: req.path,
        method: req.method,
        user: req.user ? {
            id: req.user._id,
            role: req.user.role,
            name: req.user.name
        } : 'No user'
    });
    next();
});

// Get user statistics
router.get('/users/stats', auth, roleAuth(['admin']), async (req, res) => {
    try {
        console.log('Fetching user statistics...');
        const [
            totalUsers,
            totalFreelancers,
            totalClients,
            verifiedUsers
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'freelancer' }),
            User.countDocuments({ role: 'client' }),
            User.countDocuments({ isEmailVerified: true })
        ]);

        const stats = {
            totalUsers,
            totalFreelancers,
            totalClients,
            verifiedUsers,
            pendingVerifications: totalUsers - verifiedUsers
        };

        console.log('User statistics:', stats);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ message: 'Error fetching user statistics' });
    }
});

// Get project statistics
router.get('/projects/stats', auth, roleAuth(['admin']), async (req, res) => {
    try {
        console.log('Fetching project statistics...');
        const [
            totalProjects,
            activeProjects,
            completedProjects,
            projectsWithBudget
        ] = await Promise.all([
            Project.countDocuments(),
            Project.countDocuments({ status: 'in-progress' }),
            Project.countDocuments({ status: 'completed' }),
            Project.find({ status: 'completed' }).select('budget')
        ]);

        const totalEarnings = projectsWithBudget.reduce((sum, project) => sum + (project.budget || 0), 0);
        
        // Calculate monthly earnings
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const monthlyProjects = await Project.find({
            status: 'completed',
            completedAt: { $gte: startOfMonth }
        }).select('budget');
        
        const monthlyEarnings = monthlyProjects.reduce((sum, project) => sum + (project.budget || 0), 0);

        const stats = {
            totalProjects,
            activeProjects,
            completedProjects,
            totalEarnings,
            monthlyEarnings
        };

        console.log('Project statistics:', stats);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching project stats:', error);
        res.status(500).json({ message: 'Error fetching project statistics' });
    }
});

// Get recent activity
router.get('/activity', auth, roleAuth(['admin']), async (req, res) => {
    try {
        console.log('Fetching recent activity...');
        const recentProjects = await Project.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('client', 'name')
            .populate('freelancer', 'name');

        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name role createdAt');

        const activity = [
            ...recentProjects.map(project => ({
                type: 'project',
                message: `New project "${project.title}" created by ${project.client?.name || 'Unknown Client'}`,
                timestamp: project.createdAt
            })),
            ...recentUsers.map(user => ({
                type: 'user',
                message: `New ${user.role} registered: ${user.name}`,
                timestamp: user.createdAt
            }))
        ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

        console.log('Recent activity:', activity);
        res.json({ recentActivity: activity });
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ message: 'Error fetching recent activity' });
    }
});

// Get all pending verifications
router.get('/freelancers/pending-verification', [auth, admin], async (req, res) => {
    try {
        // First, let's check all freelancers
        const allFreelancers = await User.find({ role: 'freelancer' });
        console.log('All freelancers:', allFreelancers.map(f => ({
            id: f._id,
            name: f.name,
            status: f.verificationStatus
        })));

        // Now get pending ones
        const pendingFreelancers = await User.find({
            role: 'freelancer',
            $or: [
                { verificationStatus: { $exists: false } },
                { verificationStatus: 'pending' },
                { verificationStatus: 'not_submitted' }
            ]
        }).select('name email phone documents verificationStatus verificationSubmitted');

        console.log('Found pending freelancers:', pendingFreelancers);

        res.json(pendingFreelancers);
    } catch (error) {
        console.error('Error fetching pending verifications:', error);
        res.status(500).json({ 
            message: 'Error fetching pending verifications',
            error: error.message 
        });
    }
});

// Handle freelancer verification
router.put('/freelancers/:id/verify', [auth, admin], async (req, res) => {
    try {
        const { id } = req.params;
        const { status, verificationLevel } = req.body;

        const freelancer = await User.findById(id);
        if (!freelancer) {
            return res.status(404).json({ msg: 'Freelancer not found' });
        }

        freelancer.verificationStatus = status;
        if (status === 'approved') {
            freelancer.verificationLevel = verificationLevel;
            freelancer.verifiedAt = Date.now();

            // Send approval notification
            await notificationService.notify(freelancer, 'FREELANCER_VERIFICATION_APPROVED', {
                level: verificationLevel
            });
        } else {
            // Send rejection notification
            await notificationService.notify(freelancer, 'FREELANCER_VERIFICATION_REJECTED', {});
        }

        await freelancer.save();
        res.json({ msg: 'Verification status updated successfully' });
    } catch (error) {
        console.error('Error updating verification status:', error);
        res.status(500).send('Server error');
    }
});

// Upload verification documents
router.post('/freelancers/:id/documents', [auth, admin], 
    documentService.uploadMultiple('documents', 5),
    async (req, res) => {
        try {
            const { id } = req.params;
            const files = req.files;

            if (!files || files.length === 0) {
                return res.status(400).json({ msg: 'No files uploaded' });
            }

            const freelancer = await User.findById(id);
            if (!freelancer) {
                return res.status(404).json({ msg: 'Freelancer not found' });
            }

            const documents = files.map(file => ({
                name: file.originalname,
                type: file.mimetype,
                url: `/uploads/documents/${file.filename}`,
                size: file.size,
                uploadedAt: Date.now()
            }));

            freelancer.documents = [...(freelancer.documents || []), ...documents];
            await freelancer.save();

            res.json({ msg: 'Documents uploaded successfully', documents });
        } catch (error) {
            console.error('Error uploading documents:', error);
            res.status(500).send('Server error');
        }
    }
);

// Delete verification document
router.delete('/freelancers/:freelancerId/documents/:documentId', [auth, admin], async (req, res) => {
    try {
        const { freelancerId, documentId } = req.params;

        const freelancer = await User.findById(freelancerId);
        if (!freelancer) {
            return res.status(404).json({ msg: 'Freelancer not found' });
        }

        const document = freelancer.documents.id(documentId);
        if (!document) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        // Delete file from storage
        await documentService.deleteDocument(document.url.replace('/uploads/documents/', ''));

        // Remove document from freelancer's documents array
        freelancer.documents.pull(documentId);
        await freelancer.save();

        res.json({ msg: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).send('Server error');
    }
});

// Notification Template Routes
router.get('/notification-templates', [auth, admin], async (req, res) => {
    try {
        const templates = await NotificationTemplate.find().sort({ createdAt: -1 });
        res.json(templates);
    } catch (error) {
        console.error('Error fetching notification templates:', error);
        res.status(500).json({ msg: 'Error fetching notification templates' });
    }
});

router.post('/notification-templates', [auth, admin], async (req, res) => {
    try {
        const { name, subject, body, type, variables } = req.body;

        // Validate required fields
        if (!name || !subject || !body) {
            return res.status(400).json({ msg: 'Name, subject, and body are required' });
        }

        // Check if template with same name exists
        const existingTemplate = await NotificationTemplate.findOne({ name });
        if (existingTemplate) {
            return res.status(400).json({ msg: 'Template with this name already exists' });
        }

        const template = new NotificationTemplate({
            name,
            subject,
            body,
            type: type || 'both',
            variables: variables || []
        });

        await template.save();
        res.json({ msg: 'Template created successfully', template });
    } catch (error) {
        console.error('Error creating notification template:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: error.message });
        }
        res.status(500).json({ msg: 'Error creating notification template' });
    }
});

router.put('/notification-templates/:id', [auth, admin], async (req, res) => {
    try {
        const { name, subject, body, type, variables } = req.body;

        // Validate required fields
        if (!name || !subject || !body) {
            return res.status(400).json({ msg: 'Name, subject, and body are required' });
        }

        // Check if template exists
        let template = await NotificationTemplate.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ msg: 'Template not found' });
        }

        // Check if new name conflicts with existing template
        if (name !== template.name) {
            const existingTemplate = await NotificationTemplate.findOne({ name });
            if (existingTemplate) {
                return res.status(400).json({ msg: 'Template with this name already exists' });
            }
        }

        template = await NotificationTemplate.findByIdAndUpdate(
            req.params.id,
            {
                name,
                subject,
                body,
                type: type || 'both',
                variables: variables || [],
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        res.json({ msg: 'Template updated successfully', template });
    } catch (error) {
        console.error('Error updating notification template:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: error.message });
        }
        res.status(500).json({ msg: 'Error updating notification template' });
    }
});

router.delete('/notification-templates/:id', [auth, admin], async (req, res) => {
    try {
        const template = await NotificationTemplate.findByIdAndDelete(req.params.id);
        if (!template) {
            return res.status(404).json({ msg: 'Template not found' });
        }
        res.json({ msg: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification template:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ msg: 'Invalid template ID' });
        }
        res.status(500).json({ msg: 'Error deleting notification template' });
    }
});

// Admin Analytics Routes
router.get('/analytics/users', [auth, admin], async (req, res) => {
    try {
        const { range } = req.query;
        let startDate = new Date();
        let interval;
        
        switch (range) {
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                interval = { $dayOfYear: "$createdAt" };
                break;
            case 'quarter':
                startDate.setMonth(startDate.getMonth() - 3);
                interval = { $dayOfMonth: "$createdAt" };
                break;
            default: // month
                startDate.setMonth(startDate.getMonth() - 1);
                interval = { $dayOfMonth: "$createdAt" };
        }

        // Get user count by day
        const userGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 },
                    totalUsers: {
                        $sum: {
                            $cond: [
                                { $lte: ["$createdAt", "$$NOW"] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1,
                    "_id.day": 1
                }
            },
            {
                $project: {
                    date: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: {
                                $dateFromParts: {
                                    year: "$_id.year",
                                    month: "$_id.month",
                                    day: "$_id.day"
                                }
                            }
                        }
                    },
                    count: 1,
                    totalUsers: 1,
                    _id: 0
                }
            }
        ]);

        // If no data for some days, fill with zeros
        const filledData = [];
        let currentDate = new Date(startDate);
        const endDate = new Date();
        let runningTotal = 0;

        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const existingData = userGrowth.find(d => d.date === dateStr);
            
            if (existingData) {
                runningTotal += existingData.count;
                filledData.push({
                    date: dateStr,
                    count: existingData.count,
                    totalUsers: runningTotal
                });
            } else {
                filledData.push({
                    date: dateStr,
                    count: 0,
                    totalUsers: runningTotal
                });
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }

        res.json(filledData);
    } catch (error) {
        console.error('Error fetching user analytics:', error);
        res.status(500).json({ message: 'Error fetching user analytics' });
    }
});

router.get('/analytics/revenue', [auth, admin], async (req, res) => {
    try {
        const { range } = req.query;
        let startDate = new Date();
        
        switch (range) {
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            case 'quarter':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            default: // month
                startDate.setMonth(startDate.getMonth() - 1);
        }

        // Get total earnings for all time
        const totalEarnings = await Project.aggregate([
            {
                $match: { status: 'completed' }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$budget" }
                }
            }
        ]);

        // Get earnings by date for the chart
        const revenueByDate = await Project.aggregate([
            {
                $match: {
                    status: 'completed',
                    completedAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$completedAt" }
                    },
                    amount: { $sum: "$budget" }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    date: "$_id",
                    amount: 1,
                    _id: 0
                }
            }
        ]);

        res.json({
            totalEarnings: totalEarnings[0]?.total || 0,
            revenueData: revenueByDate
        });
    } catch (error) {
        console.error('Error fetching revenue analytics:', error);
        res.status(500).json({ message: 'Error fetching revenue analytics' });
    }
});

router.get('/analytics/projects', [auth, admin], async (req, res) => {
    try {
        const stats = await Project.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const projectStats = {
            active: stats.find(s => s._id === 'in-progress')?.count || 0,
            completed: stats.find(s => s._id === 'completed')?.count || 0
        };

        res.json(projectStats);
    } catch (error) {
        console.error('Error fetching project analytics:', error);
        res.status(500).json({ message: 'Error fetching project analytics' });
    }
});

router.get('/analytics/skills', [auth, admin], async (req, res) => {
    try {
        const skillStats = await Skill.aggregate([
            {
                $group: {
                    _id: "$name",
                    count: { $sum: 1 },
                    levels: {
                        $push: "$level"
                    }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $project: {
                    name: "$_id",
                    count: 1,
                    levels: 1,
                    _id: 0
                }
            }
        ]);

        res.json(skillStats);
    } catch (error) {
        console.error('Error fetching skill analytics:', error);
        res.status(500).json({ message: 'Error fetching skill analytics' });
    }
});

router.get('/analytics/transactions', [auth, admin], async (req, res) => {
    try {
        const { range } = req.query;
        let startDate = new Date();
        
        switch (range) {
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            case 'quarter':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            default: // month
                startDate.setMonth(startDate.getMonth() - 1);
        }

        // Get completed projects
        const completedProjects = await Project.find({
            status: 'completed',
            updatedAt: { $gte: startDate } // Using updatedAt since that's when the status would have changed
        })
        .sort('-updatedAt')
        .limit(10)
        .populate('client', 'name')
        .populate('freelancer', 'name')
        .select('title budget updatedAt client freelancer')
        .lean();

        const transactions = completedProjects.map(project => ({
            date: project.updatedAt,
            projectTitle: project.title,
            clientName: project.client?.name || 'Unknown Client',
            freelancerName: project.freelancer?.name || 'Unknown Freelancer',
            amount: project.budget || 0
        }));

        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transaction analytics:', error);
        res.status(500).json({ message: 'Error fetching transaction analytics', error: error.message });
    }
});

module.exports = router; 