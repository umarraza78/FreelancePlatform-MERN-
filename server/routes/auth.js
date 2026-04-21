const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const { 
    generateVerificationToken, 
    sendEmailVerification, 
    sendSMSVerification,
    verifyMockSMSCode,
    generateVerificationCode 
} = require('../utils/verification');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Token is not valid' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        // Return complete user data except password
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Register new user
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('role').isIn(['client', 'freelancer']),
    body('phone').optional().isMobilePhone()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, name, role, phone } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate verification tokens
        const emailToken = generateVerificationToken();
        const phoneCode = phone ? generateVerificationCode() : null;

        // Create new user
        user = new User({
            name,
            email,
            password,
            role,
            phone,
            emailVerificationToken: emailToken,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            phoneVerificationCode: phoneCode,
            phoneVerificationExpires: phone ? new Date(Date.now() + 10 * 60 * 1000) : null // 10 minutes
        });

        await user.save();

        // Send verification emails/SMS
        await sendEmailVerification(email, emailToken);
        if (phone) {
            await sendSMSVerification(phone, phoneCode);
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify email
router.post('/verify-email', [
    body('token').notEmpty()
], async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify phone
router.post('/verify-phone', [
    body('code').isLength({ min: 6, max: 6 }),
    body('phone').isMobilePhone()
], async (req, res) => {
    try {
        const { code, phone } = req.body;
        
        // Verify the code using our mock system
        const isValid = verifyMockSMSCode(phone, code);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid or expired code' });
        }

        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        user.isPhoneVerified = true;
        user.phoneVerificationCode = undefined;
        user.phoneVerificationExpires = undefined;
        await user.save();

        res.json({ message: 'Phone number verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Resend verification email
router.post('/resend-verification-email', [
    body('email').isEmail()
], async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        const token = generateVerificationToken();
        user.emailVerificationToken = token;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        await sendEmailVerification(email, token);
        res.json({ message: 'Verification email sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login user
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 