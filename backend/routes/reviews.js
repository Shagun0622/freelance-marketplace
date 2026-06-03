const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Review = require('../models/Review');
const Gig = require('../models/Gig');
const User = require('../models/User');
const { createNotification } = require('./notifications');

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

// Helper: recalculate and update freelancer's rating stats
const updateFreelancerRating = async (freelancerId) => {
    const allReviews = await Review.find({ freelancerId });
    const averageRating = allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;
    await User.findByIdAndUpdate(freelancerId, {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: allReviews.length
    });
};

// CREATE REVIEW (Client only, after project completion)
router.post('/', auth, async (req, res) => {
    try {
        if (req.userRole !== 'client') {
            return res.status(403).json({ message: 'Only clients can leave reviews' });
        }

        const { gigId, freelancerId, rating, review } = req.body;

        if (!gigId || !freelancerId || !rating || !review) {
            return res.status(400).json({ message: 'gigId, freelancerId, rating, and review are required' });
        }

        // Check gig exists and belongs to client
        const gig = await Gig.findById(gigId);
        if (!gig) {
            return res.status(404).json({ message: 'Gig not found' });
        }
        if (gig.clientId.toString() !== req.userId) {
            return res.status(403).json({ message: 'You can only review your own gigs' });
        }

        // Gig must be completed
        if (gig.status !== 'completed') {
            return res.status(400).json({ message: 'Can only review completed projects' });
        }

        // Prevent duplicate reviews
        const existingReview = await Review.findOne({ gigId, clientId: req.userId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this project' });
        }

        // Validate freelancer exists
        const freelancer = await User.findById(freelancerId);
        if (!freelancer) {
            return res.status(404).json({ message: 'Freelancer not found' });
        }

        const newReview = new Review({
            gigId,
            clientId: req.userId,
            freelancerId,
            rating,
            review: review.trim()
        });

        await newReview.save();
        await updateFreelancerRating(freelancerId);

        await createNotification(
            freelancerId,
            'new_review',
            'New Review Received',
            `You received a ${rating}-star review for "${gig.title}"`,
            { reviewId: newReview._id, gigId: gig._id }
        );

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review: newReview
        });

    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: error.message });
    }
});

// GET reviews for a freelancer (with correct average across ALL reviews, not just current page)
router.get('/freelancer/:freelancerId', async (req, res) => {
    try {
        const { freelancerId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const [reviews, total] = await Promise.all([
            Review.find({ freelancerId })
                .populate('clientId', 'name email')
                .populate('gigId', 'title')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Review.countDocuments({ freelancerId })
        ]);

        // Rating distribution
        const distribution = {
            5: await Review.countDocuments({ freelancerId, rating: 5 }),
            4: await Review.countDocuments({ freelancerId, rating: 4 }),
            3: await Review.countDocuments({ freelancerId, rating: 3 }),
            2: await Review.countDocuments({ freelancerId, rating: 2 }),
            1: await Review.countDocuments({ freelancerId, rating: 1 })
        };

        // FIX: calculate average from ALL reviews, not just the current page
        const allReviews = await Review.find({ freelancerId }, 'rating');
        const averageRating = allReviews.length > 0
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
            : 0;

        res.json({
            success: true,
            reviews,
            total,
            averageRating: Math.round(averageRating * 10) / 10,
            distribution,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET reviews for a specific gig
router.get('/gig/:gigId', async (req, res) => {
    try {
        const reviews = await Review.find({ gigId: req.params.gigId })
            .populate('clientId', 'name email')
            .populate('freelancerId', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// UPDATE review (Client only, own reviews)
router.put('/:reviewId', auth, async (req, res) => {
    try {
        const { rating, review } = req.body;

        const reviewDoc = await Review.findById(req.params.reviewId);
        if (!reviewDoc) {
            return res.status(404).json({ message: 'Review not found' });
        }
        if (reviewDoc.clientId.toString() !== req.userId) {
            return res.status(403).json({ message: 'You can only edit your own reviews' });
        }

        reviewDoc.rating = rating;
        reviewDoc.review = review.trim();
        reviewDoc.updatedAt = new Date();
        await reviewDoc.save();

        await updateFreelancerRating(reviewDoc.freelancerId);

        res.json({ success: true, review: reviewDoc });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE review (Admin only)
router.delete('/:reviewId', auth, async (req, res) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({ message: 'Only admins can delete reviews' });
        }

        const review = await Review.findByIdAndDelete(req.params.reviewId);
        if (review) {
            await updateFreelancerRating(review.freelancerId);
        }

        res.json({ success: true, message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;