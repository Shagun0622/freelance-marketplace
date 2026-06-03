const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Gig = require('../models/Gig');
const Proposal = require('../models/Proposal');
const Payment = require('../models/Payment');

// Auth middleware
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Access denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Admin middleware
const isAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// ============ USER MANAGEMENT ============

// GET all users (with filters)
router.get('/users', auth, isAdmin, async (req, res) => {
    try {
        const { role, isVerified, search } = req.query;
        let filter = {};
        if (role) filter.role = role;
        if (isVerified === 'true') filter.isVerified = true;
        if (isVerified === 'false') filter.isVerified = false;
        
        // ✅ FIXED: $or → $or, $regex → $regex, $options → $options
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
        const stats = {
            total: await User.countDocuments(),
            clients: await User.countDocuments({ role: 'client' }),
            freelancers: await User.countDocuments({ role: 'freelancer' }),
            verified: await User.countDocuments({ isVerified: true }),
            suspended: await User.countDocuments({ isSuspended: true })
        };
        
        res.json({ success: true, users, stats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// UPDATE user status (verify/suspend)
router.put('/users/:userId', auth, isAdmin, async (req, res) => {
    try {
        const { isVerified, isSuspended } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { isVerified, isSuspended },
            { returnDocument: 'after' }
        ).select('-password');
        
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE user
router.delete('/users/:userId', auth, isAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.userId);
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ============ GIG MANAGEMENT ============

// GET all gigs (admin view)
router.get('/gigs', auth, isAdmin, async (req, res) => {
    try {
        const { status, category } = req.query;
        let filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        
        const gigs = await Gig.find(filter)
            .populate('clientId', 'name email')
            .sort({ createdAt: -1 });
        
        // ✅ FIXED: $group → $group, $sum → $sum, $budget.max → $budget.max
        const stats = {
            total: await Gig.countDocuments(),
            open: await Gig.countDocuments({ status: 'open' }),
            inProgress: await Gig.countDocuments({ status: 'in_progress' }),
            completed: await Gig.countDocuments({ status: 'completed' }),
            totalBudget: await Gig.aggregate([{ $group: { _id: null, total: { $sum: "$budget.max" } } }])
        };
        
        res.json({ success: true, gigs, stats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE gig (admin)
router.delete('/gigs/:gigId', auth, isAdmin, async (req, res) => {
    try {
        await Gig.findByIdAndDelete(req.params.gigId);
        res.json({ success: true, message: 'Gig deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ============ PAYMENT MANAGEMENT ============

// GET all payments
router.get('/payments', auth, isAdmin, async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('clientId', 'name email')
            .populate('freelancerId', 'name email')
            .populate('gigId', 'title')
            .sort({ createdAt: -1 });
        
        const stats = {
            totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
            platformFees: payments.reduce((sum, p) => sum + p.platformFee, 0),
            completed: payments.filter(p => p.status === 'completed').length,
            released: payments.filter(p => p.status === 'released').length
        };
        
        res.json({ success: true, payments, stats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ============ DASHBOARD ANALYTICS ============

// GET platform analytics
router.get('/analytics', auth, isAdmin, async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // ✅ FIXED: $gte → $gte
        const analytics = {
            // User stats
            users: {
                total: await User.countDocuments(),
                clients: await User.countDocuments({ role: 'client' }),
                freelancers: await User.countDocuments({ role: 'freelancer' }),
                newThisMonth: await User.countDocuments({ createdAt: { $gte: startOfMonth } })
            },
            // Gig stats
            gigs: {
                total: await Gig.countDocuments(),
                open: await Gig.countDocuments({ status: 'open' }),
                inProgress: await Gig.countDocuments({ status: 'in_progress' }),
                completed: await Gig.countDocuments({ status: 'completed' })
            },
            // Payment stats
            payments: {
                // ✅ FIXED: $group → $group, $sum → $sum, $amount → $amount
                totalVolume: await Payment.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
                platformRevenue: await Payment.aggregate([{ $group: { _id: null, total: { $sum: "$platformFee" } } }]),
                thisMonth: await Payment.countDocuments({ createdAt: { $gte: startOfMonth } })
            },
            // Proposal stats
            proposals: {
                total: await Proposal.countDocuments(),
                accepted: await Proposal.countDocuments({ status: 'accepted' }),
                pending: await Proposal.countDocuments({ status: 'pending' })
            }
        };
        
        res.json({ success: true, analytics });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;