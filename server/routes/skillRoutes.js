const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getSkills,
    addSkill,
    updateSkill,
    deleteSkill
} = require('../controllers/skillController');

router.route('/')
    .get(protect, getSkills)
    .post(protect, addSkill);

router.route('/:id')
    .put(protect, updateSkill)
    .delete(protect, deleteSkill);

// Get all skills for a given user ID
router.get('/user/:userId', async (req, res) => {
    const Skill = require('../models/skillModel');
    const userId = req.params.userId;
    try {
        const skills = await Skill.find({ user: userId }).sort('-createdAt');
        res.status(200).json(skills);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch skills', error: error.message });
    }
});

module.exports = router; 