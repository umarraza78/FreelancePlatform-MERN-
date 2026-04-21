const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Project');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/users/test
// @desc    Test endpoint
// @access  Public
router.get('/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ message: 'Users route is working' });
});

// @route   GET /api/users/earnings
// @desc    Get user's earnings data
// @access  Private (Freelancer only)
router.get('/earnings', protect, async (req, res) => {
    try {
        console.log('Earnings request - User:', {
            id: req.user._id,
            role: req.user.role,
            name: req.user.name
        });

        if (req.user.role !== 'freelancer') {
            return res.status(403).json({
                message: 'Only freelancers can access earnings data'
            });
        }
        
        const user = await User.findById(req.user._id)
            .select('earnings role')
            .populate({
                path: 'earnings.history.project',
                select: 'title client',
                populate: {
                    path: 'client',
                    select: 'name'
                }
            })
            .lean();

        if (!user) {
            console.log('User not found in earnings route:', req.user._id);
            return res.status(404).json({ 
                message: 'User not found',
                userId: req.user._id
            });
        }

        console.log('Found user role:', user.role);

        // Initialize earnings if they don't exist
        if (!user.earnings) {
            console.log('No earnings found, initializing for user:', req.user._id);
            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                {
                    earnings: {
                        total: 0,
                        monthly: 0,
                        history: []
                    }
                },
                { new: true, select: 'earnings' }
            );
            user.earnings = updatedUser.earnings;
        }

        // Calculate monthly earnings for the current month
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyEarnings = (user.earnings?.history || [])
            .filter(earning => {
                const earningDate = new Date(earning.date);
                return earningDate.getMonth() === currentMonth && 
                       earningDate.getFullYear() === currentYear;
            })
            .reduce((total, earning) => total + (earning.amount || 0), 0);

        // Group earnings by month for the chart
        const monthlyData = (user.earnings?.history || []).reduce((acc, earning) => {
            const date = new Date(earning.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!acc[monthYear]) {
                acc[monthYear] = 0;
            }
            acc[monthYear] += earning.amount || 0;
            return acc;
        }, {});

        const response = {
            total: user.earnings?.total || 0,
            monthly: monthlyEarnings,
            history: user.earnings?.history || [],
            monthlyData: Object.entries(monthlyData).map(([month, amount]) => ({
                month,
                amount
            })).sort((a, b) => a.month.localeCompare(b.month))
        };

        console.log('Sending earnings response:', {
            total: response.total,
            monthly: response.monthly,
            historyCount: response.history.length,
            monthlyDataCount: response.monthlyData.length,
            userRole: user.role
        });

        res.json(response);
    } catch (error) {
        console.error('Error in earnings route:', error);
        res.status(500).json({ 
            message: 'Failed to fetch earnings data',
            error: error.message 
        });
    }
});

// @route   GET /api/users/skills
// @desc    Get user's skills
// @access  Private
router.get('/skills', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('skills');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.skills);
    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ message: 'Failed to fetch skills' });
    }
});

module.exports = router;
