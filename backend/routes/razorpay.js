const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Payment = require('../models/Payment');
const Gig = require('../models/Gig');
const Proposal = require('../models/Proposal');
const { createNotification } = require('./notifications');

const USD_TO_INR = 85;

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

// CREATE RAZORPAY ORDER
router.post('/create-order', auth, async (req, res) => {
    try {
        const { gigId, proposalId, amount } = req.body;

        const gig = await Gig.findById(gigId);
        const proposal = await Proposal.findById(proposalId);

        if (!gig || !proposal) {
            return res.status(404).json({ message: 'Gig or proposal not found' });
        }

        if (gig.clientId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Only the client can create payment' });
        }

        const amountInINR = Math.round(amount * USD_TO_INR);
        const platformFee = Math.round(amount * 0.1);
        const freelancerAmount = amount - platformFee;

        const options = {
            amount: amountInINR * 100,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                gigId: gigId.toString(),
                proposalId: proposalId.toString(),
                clientId: req.userId.toString(),
                freelancerId: proposal.freelancerId.toString(),
            }
        };

        const order = await razorpay.orders.create(options);

        const payment = new Payment({
            gigId,
            proposalId,
            clientId: req.userId,
            freelancerId: proposal.freelancerId,
            amount,
            platformFee,
            freelancerAmount,
            stripePaymentIntentId: order.id,
            status: 'pending',
            provider: 'razorpay'
        });

        await payment.save();

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            amountINR: amountInINR,
            amountUSD: amount,
            currency: order.currency,
            paymentId: payment._id,
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
});

// VERIFY RAZORPAY PAYMENT
router.post('/verify-payment', auth, async (req, res) => {
    try {
        const { orderId, paymentId, signature, paymentRecordId } = req.body;

        const body = orderId + "|" + paymentId;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === signature) {
            const payment = await Payment.findById(paymentRecordId);
            if (payment) {
                payment.status = 'completed';
                payment.completedAt = new Date();
                payment.razorpayPaymentId = paymentId;
                await payment.save();

                await Gig.findByIdAndUpdate(payment.gigId, { status: 'in_progress' });

                await createNotification(
                    payment.freelancerId,
                    'payment_received',
                    'Payment Secured!',
                    `Payment of $${payment.amount} has been secured in escrow.`,
                    { paymentId: payment._id, gigId: payment.gigId }
                );
            }
            res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: error.message });
    }
});

// GET PAYMENTS FOR A GIG
router.get('/gig/:gigId', auth, async (req, res) => {
    try {
        const payments = await Payment.find({ gigId: req.params.gigId })
            .populate('freelancerId', 'name email')
            .populate('clientId', 'name email')
            .sort({ createdAt: -1 });

        const escrowAmount = payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0);

        res.json({ success: true, payments, escrowAmount, count: payments.length });
    } catch (error) {
        console.error('Error fetching gig payments:', error);
        res.status(500).json({ message: error.message });
    }
});

// RELEASE PAYMENT TO FREELANCER
router.post('/release-payment/:paymentId', auth, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId);

        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        if (payment.clientId.toString() !== req.userId) return res.status(403).json({ message: 'Only the client can release payment' });
        if (payment.status !== 'completed') return res.status(400).json({ message: 'Payment not in escrow' });

        payment.status = 'released';
        payment.releaseDate = new Date();
        await payment.save();

        await createNotification(
            payment.freelancerId,
            'payment_released',
            '💰 Payment Released!',
            `Payment of $${payment.freelancerAmount} has been released to your account.`,
            { paymentId: payment._id }
        );

        res.json({ success: true, payment });
    } catch (error) {
        console.error('Error releasing payment:', error);
        res.status(500).json({ message: error.message });
    }
});

// GET MY PAYMENTS (Freelancer)
router.get('/my-payments', auth, async (req, res) => {
    try {
        const payments = await Payment.find({ freelancerId: req.userId })
            .populate('gigId', 'title')
            .sort({ createdAt: -1 });

        const totalEarned = payments
            .filter(p => p.status === 'released')
            .reduce((sum, p) => sum + p.freelancerAmount, 0);

        const pendingAmount = payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + p.freelancerAmount, 0);

        res.json({ success: true, payments, totalEarned, pendingAmount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PAYMENT FAILED
router.post('/payment-failed', auth, async (req, res) => {
    try {
        const payment = await Payment.findById(req.body.paymentRecordId);
        if (payment) {
            payment.status = 'failed';
            await payment.save();
        }
        res.json({ success: true, message: 'Payment failure recorded' });
    } catch (error) {
        console.error('Error recording payment failure:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;