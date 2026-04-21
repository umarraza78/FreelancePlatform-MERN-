const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    subject: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['email', 'sms', 'both'],
        default: 'both'
    },
    variables: [{
        name: String,
        description: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
notificationTemplateSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema); 