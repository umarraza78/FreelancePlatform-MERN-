const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const documentSchema = new mongoose.Schema({
    name: String,
    type: String,
    url: String,
    size: Number,
    uploadedAt: Date
});

const notificationPreferencesSchema = new mongoose.Schema({
    email: {
        type: Boolean,
        default: true
    },
    sms: {
        type: Boolean,
        default: false
    }
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['client', 'freelancer', 'admin'],
        default: 'client'
    },
    phone: {
        type: String,
        trim: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    phoneVerificationCode: String,
    phoneVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    skills: [{
        name: { type: String, required: true },
        level: { type: String, default: 'Beginner' }
    }],
    portfolio: [{
        title: String,
        description: String,
        link: String,
        image: String
    }],
    rating: {
        type: Number,
        default: 0
    },
    earnings: {
        total: {
            type: Number,
            default: 0
        },
        monthly: {
            type: Number,
            default: 0
        },
        history: [{
            project: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Project',
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            date: {
                type: Date,
                default: Date.now
            }
        }]
    },
    verificationStatus: {
        type: String,
        enum: ['not_submitted', 'pending', 'approved', 'rejected'],
        default: 'not_submitted'
    },
    verificationLevel: {
        type: String,
        enum: ['Basic', 'Verified', 'Premium', null],
        default: null
    },
    verificationSubmitted: Date,
    verifiedAt: Date,
    documents: [documentSchema],
    notificationPreferences: {
        type: notificationPreferencesSchema,
        default: () => ({})
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        // If this is a freelancer and verificationStatus is not set, set it to not_submitted
        if (this.role === 'freelancer' && !this.verificationStatus) {
            this.verificationStatus = 'not_submitted';
        }
        return next();
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);

        // If this is a new freelancer, set initial verification status
        if (this.role === 'freelancer' && !this.verificationStatus) {
            this.verificationStatus = 'not_submitted';
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;