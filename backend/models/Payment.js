const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    gigId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gig',
        required: true
    },
    proposalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proposal',
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
    amount: {
        type: Number,
        required: true
    },
    platformFee: {
        type: Number,
        default: 0
    },
    freelancerAmount: {
        type: Number,
        default: 0
    },
    stripePaymentIntentId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed','refunded', 'disputed', 'released'],
        default: 'pending'
    },
    type: {
        type: String,
        enum: ['escrow', 'milestone', 'full'],
        default: 'escrow'
    },
    milestoneIndex: {
        type: Number,
        default: 0
    },
    releaseDate: {
        type: Date
    },
    refundReason: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    },
    // Payment Provider Details
    provider: {
        type: String,
        enum: ['stripe', 'razorpay'],
        default: 'razorpay'
    },
    razorpayPaymentId: {
        type: String
    },
    razorpayOrderId: {
        type: String
    },
    // Currency fields
    amountINR: {
        type: Number,
        default: 0
    },
    platformFeeINR: {
        type: Number,
        default: 0
    },
    freelancerAmountINR: {
        type: Number,
        default: 0
    },
    exchangeRate: {
        type: Number,
        default: 85
    },
    originalCurrency: {
        type: String,
        enum: ['USD', 'INR'],
        default: 'USD'
    }
});

// Create indexes for faster queries
paymentSchema.index({ gigId: 1 });
paymentSchema.index({ freelancerId: 1 });
paymentSchema.index({ clientId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);