const mongoose = require('mongoose');
const defaultTemplates = require('../config/defaultTemplates');
const NotificationTemplate = require('../models/NotificationTemplate');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mahmadijaz192:NI2bl3fxYFpJDw5M@cluster0a.e4g2z.mongodb.net/SkillSwap2?retryWrites=true&w=majority&appName=Cluster0A';

const seedTemplates = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB...');

        // Delete existing templates
        await NotificationTemplate.deleteMany({});
        console.log('Cleared existing templates...');

        // Insert default templates
        const templates = await NotificationTemplate.insertMany(defaultTemplates);
        console.log(`Seeded ${templates.length} notification templates...`);

        console.log('Templates seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding templates:', error);
        process.exit(1);
    }
};

seedTemplates(); 