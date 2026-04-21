const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters long'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters long'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    requirements: [{
        type: String,
        required: [true, 'At least one requirement is required'],
        trim: true,
        minlength: [3, 'Requirement must be at least 3 characters long'],
        maxlength: [500, 'Requirement cannot exceed 500 characters']
    }],
    deadline: {
        type: Date,
        required: [true, 'Deadline is required'],
        validate: {
            validator: function(value) {
                return value > new Date();
            },
            message: 'Deadline must be in the future'
        }
    },
    budget: {
        type: Number,
        required: [true, 'Budget is required'],
        min: [0, 'Budget must be a positive number']
    },
    skills: [{
        type: String,
        required: [true, 'At least one skill is required'],
        trim: true,
        minlength: [1, 'Skill cannot be empty'],
        maxlength: [50, 'Skill cannot exceed 50 characters']
    }],
    status: {
        type: String,
        enum: ['open', 'in-progress', 'completed', 'cancelled'],
        default: 'open'
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    freelancer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    bids: [{
        freelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: [0, 'Bid amount must be positive']
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: [500, 'Message cannot exceed 500 characters']
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        counterOffer: {
            amount: Number,
            message: String,
            status: {
                type: String,
                enum: ['pending', 'accepted', 'rejected']
            }
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    numReviews: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add indexes for better query performance
projectSchema.index({ status: 1 });
projectSchema.index({ client: 1 });
projectSchema.index({ freelancer: 1 });
projectSchema.index({ skills: 1 });
projectSchema.index({ createdAt: -1 });

// Middleware to update timestamps
projectSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Project', projectSchema); 