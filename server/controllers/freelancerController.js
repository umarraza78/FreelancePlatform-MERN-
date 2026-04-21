const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/portfolio';
        // Create directory if it doesn't exist
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
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
}).single('image');

// @desc    Get freelancer profile
// @route   GET /api/freelancers/profile/:id
// @access  Public
const getProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        res.status(400);
        throw new Error('Invalid user ID format');
    }

    const user = await User.findById(id)
        .select('-password')
        .lean();

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.role !== 'freelancer') {
        res.status(403);
        throw new Error('Not authorized - This profile is not a freelancer');
    }

    res.status(200).json(user);
});

// @desc    Update freelancer profile
// @route   PUT /api/freelancers/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.role !== 'freelancer') {
        res.status(403);
        throw new Error('Not authorized - Only freelancers can update freelancer profiles');
    }

    const {
        name,
        email,
        bio,
        phone,
        location,
        website,
        hourlyRate,
        skills,
        languages,
        education,
        experience
    } = req.body;

    // Update basic fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.phone = phone || user.phone;
    user.location = location || user.location;
    user.website = website || user.website;
    user.hourlyRate = hourlyRate || user.hourlyRate;

    // Update arrays if provided
    if (Array.isArray(skills)) {
        user.skills = skills;
    }
    if (Array.isArray(languages)) {
        user.languages = languages;
    }
    if (Array.isArray(education)) {
        user.education = education;
    }
    if (Array.isArray(experience)) {
        user.experience = experience;
    }

    try {
        const updatedUser = await user.save();
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500);
        throw new Error('Failed to update profile: ' + error.message);
    }
});

// @desc    Add skill to freelancer profile
// @route   POST /api/freelancers/skills
// @access  Private
const addSkill = asyncHandler(async (req, res) => {
    const { name, level } = req.body;

    if (!name || !level) {
        res.status(400);
        throw new Error('Please provide both skill name and level');
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.role !== 'freelancer') {
        res.status(403);
        throw new Error('Not authorized - Only freelancers can add skills');
    }

    // Convert any string skills to objects (one-time, non-destructive)
    user.skills = user.skills.map(skill =>
        typeof skill === 'string' ? { name: skill, level: 'Beginner' } : skill
    );

    console.log('Current skills before add:', user.skills);
    console.log('Trying to add skill:', name, level);

    // Check if skill already exists (case-insensitive)
    const skillExists = user.skills.some(skill => skill.name.toLowerCase() === name.toLowerCase());
    if (skillExists) {
        res.status(400);
        throw new Error('Skill already exists');
    }

    user.skills.push({ name, level });
    await user.save();

    console.log('Skills after add:', user.skills);

    res.status(201).json({ name, level });
});

// @desc    Remove skill from freelancer profile
// @route   DELETE /api/freelancers/skills/:id
// @access  Private
const removeSkill = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.role !== 'freelancer') {
        res.status(403);
        throw new Error('Not authorized - Only freelancers can remove skills');
    }

    user.skills = user.skills.filter(
        (skill) => skill._id.toString() !== req.params.id
    );

    await user.save();
    res.status(200).json(user);
});

// @desc    Add portfolio item
// @route   POST /api/freelancers/portfolio
// @access  Private
const addPortfolioItem = asyncHandler(async (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            res.status(400);
            throw new Error(`File upload error: ${err.message}`);
        } else if (err) {
            res.status(400);
            throw new Error(err.message);
        }

        const { title, description, link } = req.body;

        if (!title || !description) {
            res.status(400);
            throw new Error('Please provide title and description');
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        if (user.role !== 'freelancer') {
            res.status(403);
            throw new Error('Not authorized - Only freelancers can add portfolio items');
        }

        const portfolioItem = {
            title,
            description,
            link: link || '',
            image: req.file ? `/uploads/portfolio/${req.file.filename}` : ''
        };

        user.portfolio.push(portfolioItem);
        const updatedUser = await user.save();

        res.status(201).json(updatedUser);
    });
});

// @desc    Remove portfolio item
// @route   DELETE /api/freelancers/portfolio/:id
// @access  Private
const removePortfolioItem = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.role !== 'freelancer') {
        res.status(403);
        throw new Error('Not authorized - Only freelancers can remove portfolio items');
    }

    user.portfolio = user.portfolio.filter(
        (item) => item._id.toString() !== req.params.id
    );

    await user.save();
    res.status(200).json(user);
});

// @desc    Update portfolio item
// @route   PUT /api/freelancers/portfolio/:id
// @access  Private
const updatePortfolioItem = asyncHandler(async (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            res.status(400);
            throw new Error(`File upload error: ${err.message}`);
        } else if (err) {
            res.status(400);
            throw new Error(err.message);
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }
        if (user.role !== 'freelancer') {
            res.status(403);
            throw new Error('Not authorized - Only freelancers can update portfolio items');
        }

        const item = user.portfolio.id(req.params.id);
        if (!item) {
            res.status(404);
            throw new Error('Portfolio item not found');
        }

        // Update fields
        item.title = req.body.title || item.title;
        item.description = req.body.description || item.description;
        item.link = req.body.link || item.link;
        if (req.file) {
            item.image = `/uploads/portfolio/${req.file.filename}`;
        }

        await user.save();
        res.status(200).json({ item });
    });
});

module.exports = {
    getProfile,
    updateProfile,
    addSkill,
    removeSkill,
    addPortfolioItem,
    removePortfolioItem,
    updatePortfolioItem
}; 