const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    gigId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gig',
        required: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    freelancerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: String,
        required: true,
        maxlength: 1000
    },
    response: {
        type: String,
        maxlength: 500
    },
    isVerified: {
        type: Boolean,
        default: true // Only verified after project completion
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
reviewSchema.index({ freelancerId: 1, createdAt: -1 });
reviewSchema.index({ gigId: 1 });

module.exports = mongoose.model('Review', reviewSchema);