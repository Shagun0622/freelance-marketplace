const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Payment = require('../models/Payment');
const Gig = require('../models/Gig');

// Auth middleware
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

// GET payments for a specific gig (for client dashboard)
router.get('/gig/:gigId', auth, async (req, res) => {
    try {
        console.log('📊 Fetching payments for gig:', req.params.gigId);
        
        const gig = await Gig.findById(req.params.gigId);
        if (!gig) {
            return res.status(404).json({ message: 'Gig not found' });
        }
        
        // Only the client who posted the gig can view payments
        if (gig.clientId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const payments = await Payment.find({ gigId: req.params.gigId })
            .populate('freelancerId', 'name email')
            .populate('clientId', 'name email')
            .sort({ createdAt: -1 });
        
        console.log(`✅ Found ${payments.length} payments for gig`);
        
        res.json({
            success: true,
            payments,
            count: payments.length
        });
    } catch (error) {
        console.error('Error fetching gig payments:', error);
        res.status(500).json({ message: error.message });
    }
});

// GET my payments (for freelancer earnings)
router.get('/my-payments', auth, async (req, res) => {
    try {
        console.log('💰 Fetching payments for freelancer:', req.userId);
        
        const payments = await Payment.find({ freelancerId: req.userId })
            .populate('gigId', 'title budget')
            .populate('clientId', 'name email')
            .sort({ createdAt: -1 });
        
        const totalEarned = payments
            .filter(p => p.status === 'released')
            .reduce((sum, p) => sum + (p.freelancerAmount || p.amount), 0);
        
        const pendingAmount = payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + (p.freelancerAmount || p.amount), 0);
        
        console.log(`✅ Found ${payments.length} payments, Total Earned: $${totalEarned}, Pending: $${pendingAmount}`);
        
        res.json({
            success: true,
            payments,
            totalEarned,
            pendingAmount
        });
    } catch (error) {
        console.error('Error fetching my payments:', error);
        res.status(500).json({ message: error.message });
    }
});

// RELEASE PAYMENT TO FREELANCER
router.post('/release-payment/:paymentId', auth, async (req, res) => {
    try {
        const { paymentId } = req.params;
        console.log('💰 Releasing payment:', paymentId);
        
        const payment = await Payment.findById(paymentId);
        
        if (!payment) {
            console.log('❌ Payment not found');
            return res.status(404).json({ message: 'Payment not found' });
        }
        
        console.log('Payment found:', { 
            status: payment.status, 
            clientId: payment.clientId,
            userId: req.userId 
        });
        
        // Only client who paid can release
        if (payment.clientId.toString() !== req.userId) {
            console.log('❌ Unauthorized: Client mismatch');
            return res.status(403).json({ message: 'Only the client can release payment' });
        }
        
        if (payment.status !== 'completed') {
            console.log('❌ Invalid status:', payment.status);
            return res.status(400).json({ message: 'Payment not in escrow' });
        }
        
        payment.status = 'released';
        payment.releaseDate = new Date();
        await payment.save();
        
        console.log('✅ Payment released successfully');
        
        // Optional: Update gig status
        await Gig.findByIdAndUpdate(payment.gigId, { status: 'completed' });
        
        res.json({ success: true, payment });
    } catch (error) {
        console.error('Error releasing payment:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;