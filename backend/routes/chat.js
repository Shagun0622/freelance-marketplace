const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// ─── Auth middleware ──────────────────────────────────────────────────────────
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Access denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// ─── GET or CREATE conversation ───────────────────────────────────────────────
router.post('/conversation', auth, async (req, res) => {
    try {
        const { otherUserId, gigId } = req.body;

        // ✅ FIXED: $all → $all
        let conversation = await Conversation.findOne({
            participants: { $all: [req.userId, otherUserId] },
        })
            .populate('participants', 'name email role')
            .populate('gigId', 'title');

        if (!conversation) {
            conversation = new Conversation({
                participants: [req.userId, otherUserId],
                gigId: gigId || null,
            });
            await conversation.save();
            conversation = await Conversation.findById(conversation._id)
                .populate('participants', 'name email role')
                .populate('gigId', 'title');
        }

        res.json({ success: true, conversation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── GET user's conversations ─────────────────────────────────────────────────
router.get('/conversations', auth, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.userId,
        })
            .populate('participants', 'name email role')
            .populate('gigId', 'title')
            .sort({ updatedAt: -1 });

        res.json({ success: true, conversations });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: error.message });
    }
});

// ─── GET messages for a conversation ─────────────────────────────────────────
router.get('/messages/:conversationId', auth, async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation)
            return res.status(404).json({ message: 'Conversation not found' });

        // Check participant access
        if (!conversation.participants.some((p) => String(p) === String(req.userId))) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const messages = await Message.find({ conversationId })
            .populate('senderId', 'name email role')
            .sort({ createdAt: 1 });

        // Find unread messages sent TO the current user
        const unreadMessages = messages.filter(
            (m) => String(m.receiverId) === String(req.userId) && !m.read
        );

        // Mark them as read in DB
        if (unreadMessages.length > 0) {
            await Message.updateMany(
                { conversationId, receiverId: req.userId, read: false },
                { read: true, readAt: new Date() }
            );

            // Emit `messages_read` to the SENDER so their double-tick updates
            const io = req.app.get('io');
            if (io) {
                const senderIds = [
                    ...new Set(unreadMessages.map((m) => String(m.senderId?._id ?? m.senderId))),
                ];

                senderIds.forEach((senderId) => {
                    io.to(`user_${senderId}`).emit('messages_read', {
                        conversationId,
                        readBy: req.userId,
                    });
                });
            }
        }

        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── GET unread count ─────────────────────────────────────────────────────────
router.get('/unread-count', auth, async (req, res) => {
    try {
        const count = await Message.countDocuments({
            receiverId: req.userId,
            read: false,
        });
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;