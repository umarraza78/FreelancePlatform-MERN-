const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get client profile
// @route   GET /api/clients/profile/:id
// @access  Public
const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select('-password')
        .lean();

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.role !== 'client') {
        res.status(403);
        throw new Error('Not authorized - This profile is not a client');
    }

    res.status(200).json(user);
});

// @desc    Update client profile
// @route   PUT /api/clients/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.role !== 'client') {
        res.status(403);
        throw new Error('Not authorized - Only clients can update client profiles');
    }

    const { name, email, bio, phone, location, website, company } = req.body;

    // Update basic fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.phone = phone || user.phone;
    user.location = location || user.location;
    user.website = website || user.website;
    user.company = company || user.company;

    const updatedUser = await user.save();
    res.status(200).json(updatedUser);
});

module.exports = {
    getProfile,
    updateProfile
}; 