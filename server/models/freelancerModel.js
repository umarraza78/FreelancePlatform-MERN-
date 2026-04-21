const mongoose = require('mongoose');

const skillSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a skill name'],
        maxLength: [50, 'Skill name cannot be more than 50 characters']
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Expert'],
        default: 'Intermediate'
    }
});

const portfolioItemSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        maxLength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxLength: [2000, 'Description cannot be more than 2000 characters']
    },
    link: {
        type: String,
        validate: {
            validator: function(v) {
                return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
            },
            message: props => `${props.value} is not a valid URL!`
        }
    },
    image: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const bidSchema = mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Please add a bid amount'],
        min: [0, 'Bid amount must be positive']
    },
    proposal: {
        type: String,
        required: [true, 'Please add a proposal'],
        minLength: [50, 'Proposal must be at least 50 characters'],
        maxLength: [2000, 'Proposal cannot be more than 2000 characters']
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const freelancerSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: [true, 'Please add a professional title'],
        maxLength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxLength: [2000, 'Description cannot be more than 2000 characters']
    },
    hourlyRate: {
        type: Number,
        required: [true, 'Please add your hourly rate'],
        min: [0, 'Hourly rate must be positive']
    },
    availability: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Not available'],
        default: 'Full-time'
    },
    skills: [skillSchema],
    portfolio: [portfolioItemSchema],
    bids: [bidSchema],
    rating: {
        type: Number,
        min: [0, 'Rating must be at least 0'],
        max: [5, 'Rating cannot be more than 5'],
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    completedProjects: {
        type: Number,
        default: 0
    },
    location: {
        type: String,
        maxLength: [100, 'Location cannot be more than 100 characters']
    },
    languages: [{
        type: String,
        maxLength: [50, 'Language name cannot be more than 50 characters']
    }],
    education: [{
        institution: {
            type: String,
            required: true,
            maxLength: [100, 'Institution name cannot be more than 100 characters']
        },
        degree: {
            type: String,
            required: true,
            maxLength: [100, 'Degree name cannot be more than 100 characters']
        },
        fieldOfStudy: {
            type: String,
            required: true,
            maxLength: [100, 'Field of study cannot be more than 100 characters']
        },
        from: {
            type: Date,
            required: true
        },
        to: {
            type: Date
        },
        current: {
            type: Boolean,
            default: false
        }
    }],
    experience: [{
        title: {
            type: String,
            required: true,
            maxLength: [100, 'Title cannot be more than 100 characters']
        },
        company: {
            type: String,
            required: true,
            maxLength: [100, 'Company name cannot be more than 100 characters']
        },
        location: {
            type: String,
            maxLength: [100, 'Location cannot be more than 100 characters']
        },
        from: {
            type: Date,
            required: true
        },
        to: {
            type: Date
        },
        current: {
            type: Boolean,
            default: false
        },
        description: {
            type: String,
            maxLength: [2000, 'Description cannot be more than 2000 characters']
        }
    }]
}, {
    timestamps: true
});

// Calculate average rating when a review is added
freelancerSchema.methods.calculateRating = function(rating) {
    this.rating = ((this.rating * this.totalReviews) + rating) / (this.totalReviews + 1);
    this.totalReviews += 1;
    return this.save();
};

module.exports = mongoose.model('Freelancer', freelancerSchema); 