const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { 
    getTopMatches, 
    getPersonalizedRecommendations, 
    getTrendingSkills,
    calculateSkillSimilarity
} = require('../services/matchingService');
const Gig = require('../models/Gig');

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

// GET top matches for a gig (Client view)
router.get('/gig/:gigId/matches', auth, async (req, res) => {
    try {
        const { gigId } = req.params;
        const { limit = 5 } = req.query;
        
        // Check if user is the client who posted the gig
        const gig = await Gig.findById(gigId);
        if (!gig) {
            return res.status(404).json({ message: 'Gig not found' });
        }
        
        if (gig.clientId.toString() !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const matches = await getTopMatches(gigId, parseInt(limit));
        
        res.json({ 
            success: true, 
            matches,
            count: matches.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET personalized recommendations for freelancer
router.get('/recommendations', auth, async (req, res) => {
    try {
        if (req.userRole !== 'freelancer') {
            return res.status(403).json({ message: 'Only freelancers can get recommendations' });
        }
        
        const recommendations = await getPersonalizedRecommendations(req.userId);
        
        res.json({ 
            success: true, 
            recommendations,
            count: recommendations.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET trending skills
router.get('/trending-skills', async (req, res) => {
    try {
        const trending = await getTrendingSkills(10);
        res.json({ success: true, trending });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET match score for a specific gig and freelancer
router.get('/match-score', auth, async (req, res) => {
    try {
        const { gigId, freelancerId } = req.query;
        
        const gig = await Gig.findById(gigId);
        const freelancer = await User.findById(freelancerId);
        
        if (!gig || !freelancer) {
            return res.status(404).json({ message: 'Gig or freelancer not found' });
        }
        
        const skillScore = calculateSkillSimilarity(gig.skills || [], freelancer.skills || []);
        
        res.json({ 
            success: true, 
            matchScore: skillScore,
            matchedSkills: gig.skills?.filter(s => 
                freelancer.skills?.some(fs => fs.toLowerCase().includes(s.toLowerCase()))
            ) || []
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;