const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Dispute = require('../models/Dispute');
const Payment = require('../models/Payment');
const Gig = require('../models/Gig');

const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Access denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// POST /api/disputes — raise a dispute
router.post('/', auth, async (req, res) => {
    try {
        const { gigId, paymentId, reason, description } = req.body;

        const payment = await Payment.findById(paymentId);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        // Only client or freelancer on this payment can raise dispute
        const isClient = payment.clientId.toString() === req.userId;
        const isFreelancer = payment.freelancerId.toString() === req.userId;
        if (!isClient && !isFreelancer) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Check no existing open dispute
        const existing = await Dispute.findOne({ paymentId, status: { $in: ['open', 'under_review'] } });
        if (existing) return res.status(400).json({ message: 'An active dispute already exists for this payment' });

        const againstUser = isClient ? payment.freelancerId : payment.clientId;

        const dispute = new Dispute({
            gigId,
            paymentId,
            raisedBy: req.userId,
            againstUser,
            clientId: payment.clientId,
            freelancerId: payment.freelancerId,
            reason,
            description
        });

        await dispute.save();

        // Mark payment as disputed
        await Payment.findByIdAndUpdate(paymentId, { status: 'disputed' });

        res.status(201).json({ success: true, dispute });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/disputes/my — get disputes for logged in user
router.get('/my', auth, async (req, res) => {
    try {
        const disputes = await Dispute.find({
            $or: [{ raisedBy: req.userId }, { againstUser: req.userId }]
        })
        .populate('gigId', 'title')
        .populate('paymentId', 'amount status')
        .populate('raisedBy', 'name email')
        .populate('againstUser', 'name email')
        .sort({ createdAt: -1 });

        res.json({ success: true, disputes });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/disputes/:id — get single dispute
router.get('/:id', auth, async (req, res) => {
    try {
        const dispute = await Dispute.findById(req.params.id)
            .populate('gigId', 'title budget')
            .populate('paymentId', 'amount status amountINR')
            .populate('raisedBy', 'name email')
            .populate('againstUser', 'name email')
            .populate('messages.senderId', 'name role');

        if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

        const isInvolved =
            dispute.raisedBy._id.toString() === req.userId ||
            dispute.againstUser._id.toString() === req.userId ||
            req.userRole === 'admin';

        if (!isInvolved) return res.status(403).json({ message: 'Access denied' });

        res.json({ success: true, dispute });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/disputes/:id/message — add message to dispute thread
router.post('/:id/message', auth, async (req, res) => {
    try {
        const { message } = req.body;
        const dispute = await Dispute.findById(req.params.id);
        if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

        const isInvolved =
            dispute.raisedBy.toString() === req.userId ||
            dispute.againstUser.toString() === req.userId ||
            req.userRole === 'admin';

        if (!isInvolved) return res.status(403).json({ message: 'Access denied' });

        dispute.messages.push({
            senderId: req.userId,
            message,
            isAdmin: req.userRole === 'admin'
        });

        if (dispute.status === 'open') dispute.status = 'under_review';
        await dispute.save();

        res.json({ success: true, dispute });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/disputes/:id/resolve — admin resolves dispute
router.put('/:id/resolve', auth, async (req, res) => {
    try {
        if (req.userRole !== 'admin') return res.status(403).json({ message: 'Admin only' });

        const { resolution, winner } = req.body; // winner: 'client' | 'freelancer'
        const dispute = await Dispute.findById(req.params.id);
        if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

        dispute.status = winner === 'client' ? 'resolved_client' : 'resolved_freelancer';
        dispute.resolution = resolution;
        dispute.resolvedBy = req.userId;
        dispute.resolvedAt = new Date();
        await dispute.save();

        // Update payment status based on resolution
        const newPaymentStatus = winner === 'client' ? 'refunded' : 'released';
        await Payment.findByIdAndUpdate(dispute.paymentId, { status: newPaymentStatus });

        res.json({ success: true, dispute });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/disputes — admin: get all disputes
router.get('/', auth, async (req, res) => {
    try {
        if (req.userRole !== 'admin') return res.status(403).json({ message: 'Admin only' });

        const { status } = req.query;
        const filter = status ? { status } : {};

        const disputes = await Dispute.find(filter)
            .populate('gigId', 'title')
            .populate('raisedBy', 'name email')
            .populate('againstUser', 'name email')
            .populate('paymentId', 'amount status')
            .sort({ createdAt: -1 });

        res.json({ success: true, disputes });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;