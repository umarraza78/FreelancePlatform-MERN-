const { body, validationResult } = require('express-validator');

exports.validateProject = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters'),
    
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ min: 3, max: 2000 })
        .withMessage('Description must be between 3 and 2000 characters'),
    
    body('requirements')
        .isArray({ min: 1 })
        .withMessage('At least one requirement is required')
        .custom((value) => {
            if (!Array.isArray(value)) {
                throw new Error('Requirements must be an array');
            }
            if (value.some(req => typeof req !== 'string' || req.trim() === '')) {
                throw new Error('All requirements must be non-empty strings');
            }
            return true;
        }),
    
    body('requirements.*')
        .trim()
        .notEmpty()
        .withMessage('Requirement cannot be empty')
        .isLength({ max: 500 })
        .withMessage('Requirement must be less than 500 characters'),
    
    body('deadline')
        .notEmpty()
        .withMessage('Deadline is required')
        .custom((value) => {
            const deadline = new Date(value);
            if (isNaN(deadline.getTime())) {
                throw new Error('Invalid deadline date format');
            }
            const now = new Date();
            if (deadline <= now) {
                throw new Error('Deadline must be in the future');
            }
            return true;
        }),
    
    body('budget')
        .notEmpty()
        .withMessage('Budget is required')
        .custom((value) => {
            const num = Number(value);
            if (isNaN(num) || num <= 0) {
                throw new Error('Budget must be a positive number');
            }
            return true;
        }),
    
    body('skills')
        .isArray({ min: 1 })
        .withMessage('At least one skill is required')
        .custom((value) => {
            if (!Array.isArray(value)) {
                throw new Error('Skills must be an array');
            }
            if (value.some(skill => typeof skill !== 'string' || skill.trim() === '')) {
                throw new Error('All skills must be non-empty strings');
            }
            return true;
        }),
    
    body('skills.*')
        .trim()
        .notEmpty()
        .withMessage('Skill cannot be empty')
        .isLength({ max: 50 })
        .withMessage('Skill must be less than 50 characters'),

    (req, res, next) => {
        console.log('Validating project data:', {
            title: req.body.title,
            description: req.body.description,
            requirements: req.body.requirements,
            deadline: req.body.deadline,
            budget: req.body.budget,
            skills: req.body.skills
        });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error('Validation errors:', errors.array());
            return res.status(400).json({ 
                message: 'Validation failed',
                errors: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                }))
            });
        }
        next();
    }
]; 