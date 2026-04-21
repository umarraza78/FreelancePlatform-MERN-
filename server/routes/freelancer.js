const express = require('express');
const router = express.Router();
const Freelancer = require('../models/freelancerModel');
const User = require('../models/User');
const { auth, roleAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for document uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/verification';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images and PDF files are allowed!'));
    }
});

// Get freelancer stats (rating, completed projects, etc.)
router.get('/stats/:userId', auth, async (req, res) => {
    try {
        console.log('Fetching stats for user:', req.params.userId);
        console.log('Auth user:', req.user ? {
            id: req.user._id,
            role: req.user.role,
            name: req.user.name
        } : 'No auth user');
        
        const freelancer = await Freelancer.findOne({ user: req.params.userId });
        console.log('Found freelancer:', freelancer ? {
            id: freelancer._id,
            userId: freelancer.user,
            rating: freelancer.rating,
            totalReviews: freelancer.totalReviews,
            completedProjects: freelancer.completedProjects,
            createdAt: freelancer.createdAt
        } : 'No freelancer found');

        if (!freelancer) {
            // Try to create a freelancer profile
            console.log('Attempting to create freelancer profile');
            const newFreelancer = new Freelancer({
                user: req.params.userId,
                title: 'Freelancer',
                description: '',
                hourlyRate: 0,
                skills: [],
                rating: 0,
                totalReviews: 0,
                completedProjects: 0
            });
            await newFreelancer.save();
            console.log('Created new freelancer profile:', {
                id: newFreelancer._id,
                userId: newFreelancer.user
            });
            
            return res.json({
                rating: 0,
                totalReviews: 0,
                completedProjects: 0
            });
        }

        const stats = {
            rating: freelancer.rating || 0,
            totalReviews: freelancer.totalReviews || 0,
            completedProjects: freelancer.completedProjects || 0
        };

        console.log('Returning stats:', stats);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching freelancer stats:', error);
        res.status(500).json({ 
            message: 'Failed to fetch freelancer stats',
            error: error.message 
        });
    }
});

// Create or update freelancer profile
router.post('/profile', auth, roleAuth(['freelancer']), async (req, res) => {
    try {
        console.log('Creating/updating profile for user:', {
            userId: req.user._id,
            role: req.user.role
        });

        let freelancer = await Freelancer.findOne({ user: req.user._id });
        console.log('Existing freelancer:', freelancer ? {
            id: freelancer._id,
            rating: freelancer.rating,
            totalReviews: freelancer.totalReviews
        } : 'No existing freelancer');
        
        if (!freelancer) {
            console.log('Creating new freelancer profile');
            freelancer = new Freelancer({
                user: req.user._id,
                title: req.body.title || 'Freelancer',
                description: req.body.description || '',
                hourlyRate: req.body.hourlyRate || 0,
                skills: [],
                rating: 0,
                totalReviews: 0,
                completedProjects: 0
            });
        } else {
            console.log('Updating existing freelancer profile');
            Object.assign(freelancer, {
                title: req.body.title || freelancer.title,
                description: req.body.description || freelancer.description,
                hourlyRate: req.body.hourlyRate || freelancer.hourlyRate
            });
        }
        
        await freelancer.save();
        console.log('Saved freelancer profile:', {
            id: freelancer._id,
            rating: freelancer.rating,
            totalReviews: freelancer.totalReviews
        });
        
        res.json(freelancer);
    } catch (error) {
        console.error('Error creating/updating freelancer profile:', error);
        res.status(500).json({
            message: 'Failed to create/update freelancer profile',
            error: error.message
        });
    }
});

// Get freelancer profile
router.get('/profile/:userId', auth, async (req, res) => {
    try {
        const freelancer = await Freelancer.findOne({ user: req.params.userId });
        if (!freelancer) {
            return res.status(404).json({ message: 'Freelancer profile not found' });
        }
        res.json(freelancer);
    } catch (error) {
        console.error('Error fetching freelancer profile:', error);
        res.status(500).json({
            message: 'Failed to fetch freelancer profile',
            error: error.message
        });
    }
});

// Add skill
router.post('/skills', auth, roleAuth(['freelancer']), async (req, res) => {
    try {
        console.log('\n=== ADDING SKILL ===');
        console.log('User ID:', req.user._id);
        console.log('Request body:', req.body);
        
        const freelancer = await Freelancer.findOne({ user: req.user._id });
        console.log('Found freelancer:', freelancer ? 'Yes' : 'No');
        
        if (!freelancer) {
            console.log('Error: Freelancer profile not found');
            return res.status(404).json({ message: 'Freelancer profile not found' });
        }

        const { skill } = req.body;
        if (!skill || !skill.name || !skill.level) {
            console.log('Error: Invalid skill data provided');
            return res.status(400).json({ message: 'Skill name and level are required' });
        }

        // Check if skill already exists
        const skillExists = freelancer.skills.some(s => 
            s.name.toLowerCase() === skill.name.toLowerCase()
        );

        if (skillExists) {
            console.log('Error: Skill already exists:', skill.name);
            return res.status(400).json({ message: 'Skill already exists' });
        }

        freelancer.skills.push(skill);
        await freelancer.save();

        console.log('Success: Skill added:', skill);
        console.log('Updated skills list:', freelancer.skills);
        console.log('=== END ADDING SKILL ===\n');
        
        res.json(freelancer);
    } catch (error) {
        console.error('\n=== ERROR ADDING SKILL ===');
        console.error('Error details:', error);
        console.error('=== END ERROR ===\n');
        res.status(500).json({
            message: 'Failed to add skill',
            error: error.message
        });
    }
});

// Remove skill
router.delete('/skills/:skillId', auth, roleAuth(['freelancer']), async (req, res) => {
    try {
        console.log('\n=== REMOVING SKILL ===');
        console.log('User ID:', req.user._id);
        console.log('Skill ID to remove:', req.params.skillId);
        
        const freelancer = await Freelancer.findOne({ user: req.user._id });
        console.log('Found freelancer:', freelancer ? 'Yes' : 'No');
        
        if (!freelancer) {
            console.log('Error: Freelancer profile not found');
            return res.status(404).json({ message: 'Freelancer profile not found' });
        }

        const skillId = req.params.skillId;
        console.log('Current skills:', freelancer.skills);
        
        // Find skill by ID
        const skillIndex = freelancer.skills.findIndex(s => s._id.toString() === skillId);
        
        if (skillIndex === -1) {
            console.log('Error: Skill not found:', skillId);
            return res.status(404).json({ message: 'Skill not found' });
        }

        // Remove the skill
        freelancer.skills.splice(skillIndex, 1);
        await freelancer.save();

        console.log('Success: Skill removed:', skillId);
        console.log('Updated skills list:', freelancer.skills);
        console.log('=== END REMOVING SKILL ===\n');
        
        res.json(freelancer);
    } catch (error) {
        console.error('\n=== ERROR REMOVING SKILL ===');
        console.error('Error details:', error);
        console.error('=== END ERROR ===\n');
        res.status(500).json({
            message: 'Failed to remove skill',
            error: error.message
        });
    }
});

// List all freelancers (from User model)
router.get('/', async (req, res) => {
    try {
        const User = require('../models/User');
        const freelancers = await User.find({ role: 'freelancer' }).select('name email skills _id');
        const result = freelancers.map(f => ({
            _id: f._id,
            name: f.name,
            email: f.email,
            skills: f.skills || []
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch freelancers', error: error.message });
    }
});

// Upload verification documents
router.post('/verification-documents', auth, roleAuth(['freelancer']), upload.array('documents', 5), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const documents = files.map(file => ({
            name: file.originalname,
            type: file.mimetype,
            url: `/uploads/verification/${file.filename}`,
            size: file.size,
            uploadedAt: Date.now()
        }));

        user.documents = [...(user.documents || []), ...documents];
        user.verificationStatus = 'pending';
        user.verificationSubmitted = Date.now();

        await user.save();

        res.json({ 
            message: 'Documents uploaded successfully', 
            documents: user.documents,
            verificationStatus: user.verificationStatus 
        });
    } catch (error) {
        console.error('Error uploading verification documents:', error);
        res.status(500).json({ 
            message: 'Failed to upload documents', 
            error: error.message 
        });
    }
});

module.exports = router; 