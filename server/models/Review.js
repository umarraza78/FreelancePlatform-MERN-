const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
    rating: {
        type: Number,
        required: [true, 'Please provide a rating'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: [true, 'Please provide a review comment'],
        trim: true,
        maxlength: [500, 'Review comment cannot exceed 500 characters']
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    }
}, {
    timestamps: true
});

// Prevent user from submitting more than one review per project
reviewSchema.index({ project: 1, reviewer: 1 }, { unique: true });

// Static method to calculate average rating for a project
reviewSchema.statics.calculateAverageRating = async function(projectId) {
    const stats = await this.aggregate([
        {
            $match: { project: projectId }
        },
        {
            $group: {
                _id: '$project',
                averageRating: { $avg: '$rating' },
                numReviews: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        await mongoose.model('Project').findByIdAndUpdate(projectId, {
            averageRating: Math.round(stats[0].averageRating * 10) / 10,
            numReviews: stats[0].numReviews
        });
    } else {
        await mongoose.model('Project').findByIdAndUpdate(projectId, {
            averageRating: 0,
            numReviews: 0
        });
    }
};

// Call calculateAverageRating after save
reviewSchema.post('save', function() {
    this.constructor.calculateAverageRating(this.project);
});

// Call calculateAverageRating before remove
reviewSchema.pre('remove', function() {
    this.constructor.calculateAverageRating(this.project);
});

module.exports = mongoose.model('Review', reviewSchema); 