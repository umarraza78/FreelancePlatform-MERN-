const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const http = require('http');
const path = require('path');
const User = require('./models/User');
const Project = require('./models/Project');
const Message = require('./models/Message');
const connectDB = require('./config/db');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup with authentication
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:3000"],
        credentials: true
    }
});

// Socket authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token) {
            console.log('No token provided in socket connection');
            return next(new Error('Authentication token required'));
        }

        console.log('Received token:', token.substring(0, 20) + '...');
        
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decoded successfully:', {
                userId: decoded.userId || decoded.id || decoded._id,
                exp: decoded.exp
            });
        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError.message);
            return next(new Error('Invalid authentication token'));
        }

        if (!decoded.userId && !decoded.id && !decoded._id) {
            console.error('No user ID found in token payload:', decoded);
            return next(new Error('Invalid token payload'));
        }

        // Find user in database to ensure they exist
        const userId = decoded.userId || decoded.id || decoded._id;
        console.log('Looking up user with ID:', userId);
        
        const user = await User.findById(userId);
        
        if (!user) {
            console.error('User not found for ID:', userId);
            return next(new Error('User not found'));
        }

        // Store user info in socket
        socket.userId = user._id.toString();
        socket.user = {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role
        };

        console.log('Socket authenticated successfully for user:', {
            userId: socket.userId,
            name: user.name,
            role: user.role
        });

        next();
    } catch (error) {
        console.error('Socket authentication error:', error.message, error.stack);
        next(new Error('Authentication failed: ' + error.message));
    }
});

app.set('io', io);

io.on('connection', (socket) => {
    console.log('A user connected:', {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.user?.name
    });

    socket.on('joinProject', ({ projectId }) => {
        if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
            socket.emit('error', { message: 'Invalid project ID' });
            return;
        }
        socket.join(projectId);
        console.log(`User ${socket.user.name} (${socket.userId}) joined project room ${projectId}`);
    });

    socket.on('leaveProject', ({ projectId }) => {
        if (projectId) {
            socket.leave(projectId);
            console.log(`User ${socket.user.name} (${socket.userId}) left project room ${projectId}`);
        }
    });

    socket.on('sendMessage', async (msg) => {
        try {
            console.log('Received message:', msg);
            console.log('From user:', {
                userId: socket.userId,
                name: socket.user?.name
            });

            if (!socket.userId) {
                console.error('No socket.userId found for socket:', socket.id);
                throw new Error('User not authenticated');
            }

            if (!msg.projectId || !/^[0-9a-fA-F]{24}$/.test(msg.projectId)) {
                throw new Error('Invalid project ID');
            }

            if (!msg.receiverId || !/^[0-9a-fA-F]{24}$/.test(msg.receiverId)) {
                throw new Error('Invalid receiver ID');
            }

            // Create and save the message using the Message model
            const newMessage = new Message({
                projectId: msg.projectId,
                senderId: socket.userId,
                receiverId: msg.receiverId,
                text: msg.text,
                timestamp: new Date()
            });

            console.log('Creating message:', {
                projectId: msg.projectId,
                senderId: socket.userId,
                receiverId: msg.receiverId,
                text: msg.text
            });

            await newMessage.save();

            // Populate sender details
            const populatedMessage = await Message.findById(newMessage._id)
                .populate('senderId', 'name email')
                .populate('receiverId', 'name email');

            console.log('Message saved:', populatedMessage);

            // Emit to all clients in the project room
            io.to(msg.projectId).emit('newMessage', populatedMessage);

        } catch (error) {
            console.error('Error handling message:', error);
            socket.emit('error', { 
                message: 'Failed to process message',
                details: error.message
            });
        }
    });

    socket.on('markMessageRead', async (data) => {
        try {
            if (!data.messageId) {
                socket.emit('error', { message: 'Message ID is required' });
                return;
            }

            const message = await Message.findByIdAndUpdate(
                data.messageId,
                { read: true },
                { new: true }
            );

            if (!message) {
                socket.emit('error', { message: 'Message not found' });
                return;
            }

            // Emit to all clients in the project room
            io.to(message.projectId.toString()).emit('messageRead', {
                messageId: message._id,
                readAt: new Date()
            });

        } catch (error) {
            console.error('Error marking message as read:', error);
            socket.emit('error', { message: 'Failed to mark message as read' });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const verificationDir = path.join(uploadsDir, 'verification');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(verificationDir)) {
    fs.mkdirSync(verificationDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const messageRoutes = require('./routes/messages');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clientRoutes');
const freelancerRoutes = require('./routes/freelancerRoutes');
const freelancerBrowseRoutes = require('./routes/freelancer');
const skillRoutes = require('./routes/skillRoutes');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/freelancer', freelancerBrowseRoutes);
app.use('/api/freelancers', freelancerRoutes);
app.use('/api/freelancers/all', freelancerBrowseRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Log registered routes for debugging
console.log('Registered API routes:', [
    '/api/auth',
    '/api/projects',
    '/api/messages',
    '/api/reviews',
    '/api/users',
    '/api/clients',
    '/api/freelancer',
    '/api/freelancers',
    '/api/freelancers/all',
    '/api/skills',
    '/api/analytics',
    '/api/admin'
].join(', '));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to SkillSwap API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
