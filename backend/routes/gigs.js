const express = require('express');
const router = express.Router();
const Gig = require('../models/Gig');
const jwt = require('jsonwebtoken');

// ─── Auth Middleware ───────────────────────────────────────────────────────────

const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId   = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

const isClient = (req, res, next) => {
    if (req.userRole !== 'client') {
        return res.status(403).json({ message: 'Access denied. Only clients can post gigs.' });
    }
    next();
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/gigs — create a gig (client only)
router.post('/', auth, isClient, async (req, res) => {
    try {
        const { title, description, budget, category, skills, duration, experienceLevel } = req.body;

        const gig = new Gig({
            title,
            description,
            budget,
            category,
            skills,
            duration,
            experienceLevel,
            clientId: req.userId
        });

        await gig.save();

        res.status(201).json({ success: true, message: 'Gig posted successfully', gig });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// GET /api/gigs — all gigs (public)
router.get('/', async (req, res) => {
    try {
        const { category, minBudget, maxBudget, search, status = 'open' } = req.query;

        let filter = { status };

        if (category && category !== 'all') filter.category = category;

        if (minBudget || maxBudget) {
            filter['budget.min'] = {};
            if (minBudget) filter['budget.min'].$gte = parseInt(minBudget);
            if (maxBudget) filter['budget.max'].$lte = parseInt(maxBudget);
        }

        // ✅ FIXED: Use $ (dollar) not $ (rupee)
        if (search) {
            filter.$or = [
                { title:       { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { skills:      { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const gigs = await Gig.find(filter)
            .populate('clientId', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, gigs });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/gigs/my-gigs — gigs posted by the logged-in client
router.get('/my-gigs', auth, isClient, async (req, res) => {
    try {
        const gigs = await Gig.find({ clientId: req.userId })
            .sort({ createdAt: -1 });

        res.json({ success: true, gigs });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// GET /api/gigs/:id — single gig (public)
router.get('/:id', async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id)
            .populate('clientId', 'name email');

        if (!gig) return res.status(404).json({ message: 'Gig not found' });

        res.json({ success: true, gig });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/gigs/:id — update gig (owner only)
router.put('/:id', auth, async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);

        if (!gig) return res.status(404).json({ message: 'Gig not found' });

        if (gig.clientId.toString() !== req.userId) {
            return res.status(403).json({ message: 'You can only edit your own gigs' });
        }

        const updatedGig = await Gig.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { returnDocument: 'after', runValidators: true }
        );

        res.json({ success: true, gig: updatedGig });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/gigs/:id — delete gig (owner or admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);

        if (!gig) return res.status(404).json({ message: 'Gig not found' });

        if (gig.clientId.toString() !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json({ message: 'You can only delete your own gigs' });
        }

        await Gig.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Gig deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;