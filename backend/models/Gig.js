const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    budget: {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
    },
    category: {
        type: String,
        required: true,
        enum: ['Web Development', 'Mobile Development', 'AI/ML', 'Design', 'Writing', 'Marketing', 'Other']
    },
    skills: [{
        type: String,
        required: true
    }],
    duration: {
        type: String,
        enum: ['Less than 1 week', '1-2 weeks', '2-4 weeks', '1-3 months', '3+ months']
    },
    experienceLevel: {
        type: String,
        enum: ['Entry', 'Intermediate', 'Expert'],
        default: 'Intermediate'
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'completed', 'cancelled'],
        default: 'open'
    },
    proposalsCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Gig', gigSchema);