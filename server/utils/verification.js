const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email verification setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Mock SMS verification storage
const mockSMSStore = new Map();

// Generate verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Send email verification
const sendEmailVerification = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your SkillSwap account',
        html: `
            <h1>Welcome to SkillSwap!</h1>
            <p>Please click the following link to verify your email address:</p>
            <a href="${verificationUrl}">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        return false;
    }
};

// Mock SMS verification
const sendSMSVerification = async (phone, code) => {
    try {
        // Store the verification code in memory
        mockSMSStore.set(phone, {
            code,
            expires: Date.now() + 10 * 60 * 1000 // 10 minutes
        });
        
        // Log the verification code to console (for testing)
        console.log(`[MOCK SMS] Verification code for ${phone}: ${code}`);
        return true;
    } catch (error) {
        console.error('Error in mock SMS verification:', error);
        return false;
    }
};

// Verify mock SMS code
const verifyMockSMSCode = (phone, code) => {
    const storedData = mockSMSStore.get(phone);
    if (!storedData) {
        return false;
    }

    if (Date.now() > storedData.expires) {
        mockSMSStore.delete(phone);
        return false;
    }

    const isValid = storedData.code === code;
    if (isValid) {
        mockSMSStore.delete(phone);
    }
    return isValid;
};

// Generate verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
    generateVerificationToken,
    sendEmailVerification,
    sendSMSVerification,
    verifyMockSMSCode,
    generateVerificationCode
}; 