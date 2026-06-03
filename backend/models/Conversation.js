const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
        ],
        gigId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Gig',
        },
        lastMessage: {
            type: String,
            default: '',
        },
        lastMessageTime: {
            type: Date,
            default: Date.now,
        },
        unreadCount: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    {
        // ✅ Let Mongoose manage createdAt & updatedAt automatically.
        // Remove the manual createdAt/updatedAt fields — they conflicted with
        // Mongoose's own tracking and caused stale updatedAt values.
        timestamps: true,
    }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 }); // speeds up the conversations list sort

module.exports = mongoose.model('Conversation', conversationSchema);