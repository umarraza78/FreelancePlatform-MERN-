const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

// Fetch messages for a project
router.get('/:projectId', auth, async (req, res) => {
    try {
        const messages = await Message.find({ projectId: req.params.projectId })
            .populate('senderId', 'name')
            .populate('receiverId', 'name')
            .sort('timestamp');
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
});

// Send a message
router.post('/', auth, async (req, res) => {
    try {
        const { projectId, receiverId, text } = req.body;
        
        const message = new Message({
            projectId,
            senderId: req.user.id,
            receiverId,
            text,
            timestamp: new Date()
        });

        await message.save();

        // Populate sender and receiver details
        const populatedMessage = await Message.findById(message._id)
            .populate('senderId', 'name')
            .populate('receiverId', 'name');

        // Emit real-time event
        const io = req.app.get('io');
        if (io) {
            io.to(projectId).emit('newMessage', populatedMessage);
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
});

// Mark as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        ).populate('senderId', 'name')
         .populate('receiverId', 'name');

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Emit read receipt
        const io = req.app.get('io');
        if (io) {
            io.to(message.projectId.toString()).emit('messageRead', {
                messageId: message._id,
                readAt: new Date()
            });
        }

        res.json(message);
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ message: 'Failed to mark message as read' });
    }
});

module.exports = router; 