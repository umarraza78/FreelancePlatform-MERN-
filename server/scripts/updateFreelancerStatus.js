const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = 'mongodb+srv://mahmadijaz192:NI2bl3fxYFpJDw5M@cluster0a.e4g2z.mongodb.net/SkillSwap2?retryWrites=true&w=majority&appName=Cluster0A';

async function updateFreelancerStatus() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update all freelancers without a verificationStatus
        const result = await User.updateMany(
            { 
                role: 'freelancer',
                verificationStatus: { $exists: false }
            },
            { 
                $set: { verificationStatus: 'not_submitted' }
            }
        );

        console.log(`Updated ${result.modifiedCount} freelancers`);

        // Get all freelancers to verify
        const freelancers = await User.find({ role: 'freelancer' })
            .select('name email verificationStatus');
        
        console.log('\nCurrent Freelancer Status:');
        freelancers.forEach(f => {
            console.log(`${f.name} (${f.email}): ${f.verificationStatus || 'no status'}`);
        });

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
    }
}

updateFreelancerStatus(); 