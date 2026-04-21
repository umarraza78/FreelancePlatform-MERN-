const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const reviewRoutes = require('./routes/reviews');
const freelancerRoutes = require('./routes/freelancer');
const messageRoutes = require('./routes/messages');
const skillRoutes = require('./routes/skillRoutes');
const analyticsRoutes = require('./routes/analytics');
const fs = require('fs');
const path = require('path');

const app = express();

// Connect to database
connectDB();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const verificationDir = path.join(uploadsDir, 'verification');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(verificationDir)) {
    fs.mkdirSync(verificationDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/freelancer', freelancerRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/analytics', analyticsRoutes);
console.log('Analytics route registered');

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 