const Skill = require('../models/skillModel');
const asyncHandler = require('express-async-handler');

// @desc    Get user skills
// @route   GET /api/skills
// @access  Private
const getSkills = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    console.log('Getting skills for user:', userId);
    const skills = await Skill.find({ user: userId }).sort('-createdAt');
    console.log('Found skills:', skills);
    res.status(200).json(skills);
});

// @desc    Add new skill
// @route   POST /api/skills
// @access  Private
const addSkill = asyncHandler(async (req, res) => {
    const { name, level } = req.body;
    const userId = req.user._id;

    console.log('Adding skill:', { name, level, userId });

    if (!name || !level) {
        res.status(400);
        throw new Error('Please provide both name and level');
    }

    // Check if skill already exists for this user
    const existingSkill = await Skill.findOne({ user: userId, name });
    if (existingSkill) {
        res.status(400);
        throw new Error('Skill already exists');
    }

    const skill = await Skill.create({
        name,
        level,
        user: userId
    });

    console.log('Created skill:', skill);
    res.status(201).json(skill);
});

// @desc    Update skill
// @route   PUT /api/skills/:id
// @access  Private
const updateSkill = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    console.log('Update skill request:', {
        skillId: req.params.id,
        userId: userId,
        body: req.body
    });

    const skill = await Skill.findById(req.params.id);
    console.log('Found skill:', skill);

    if (!skill) {
        console.log('Skill not found with ID:', req.params.id);
        res.status(404);
        throw new Error('Skill not found');
    }

    // Debug log for user comparison
    console.log('Comparing users:', {
        skillUserId: skill.user.toString(),
        requestUserId: userId.toString(),
        isMatch: skill.user.toString() === userId.toString()
    });

    // Verify user owns this skill
    if (skill.user.toString() !== userId.toString()) {
        console.log('Authorization failed - user IDs do not match');
        res.status(401);
        throw new Error('Not authorized');
    }

    const updatedSkill = await Skill.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    console.log('Skill updated successfully:', updatedSkill);
    res.status(200).json(updatedSkill);
});

// @desc    Delete skill
// @route   DELETE /api/skills/:id
// @access  Private
const deleteSkill = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    console.log('Delete skill request:', {
        skillId: req.params.id,
        userId: userId
    });

    const skill = await Skill.findById(req.params.id);

    if (!skill) {
        console.log('Skill not found with ID:', req.params.id);
        res.status(404);
        throw new Error('Skill not found');
    }

    // Debug log for user comparison
    console.log('Comparing users:', {
        skillUserId: skill.user.toString(),
        requestUserId: userId.toString(),
        isMatch: skill.user.toString() === userId.toString()
    });

    // Verify user owns this skill
    if (skill.user.toString() !== userId.toString()) {
        console.log('Authorization failed - user IDs do not match');
        res.status(401);
        throw new Error('Not authorized');
    }

    await skill.deleteOne();
    console.log('Skill deleted successfully');
    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getSkills,
    addSkill,
    updateSkill,
    deleteSkill
}; 