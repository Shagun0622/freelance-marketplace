const natural = require('natural');
const stringSimilarity = require('string-similarity');
const Gig = require('../models/Gig');
const Proposal = require('../models/Proposal');
const User = require('../models/User');

// Calculate skill similarity between two arrays
const calculateSkillSimilarity = (requiredSkills, freelancerSkills) => {
    if (!requiredSkills.length || !freelancerSkills.length) return 0;
    
    // Convert to lowercase for comparison
    const required = requiredSkills.map(s => s.toLowerCase().trim());
    const freelancer = freelancerSkills.map(s => s.toLowerCase().trim());
    
    // Calculate overlap
    const matched = required.filter(skill => 
        freelancer.some(fSkill => fSkill.includes(skill) || skill.includes(fSkill))
    );
    
    // Calculate similarity score
    const score = (matched.length / required.length) * 100;
    return Math.min(100, Math.round(score));
};

// Calculate experience score
const calculateExperienceScore = (freelancerLevel, requiredLevel) => {
    const levels = { 'Entry': 1, 'Intermediate': 2, 'Expert': 3 };
    const freelancerValue = levels[freelancerLevel] || 1;
    const requiredValue = levels[requiredLevel] || 2;
    
    if (freelancerValue >= requiredValue) return 100;
    if (freelancerValue === requiredValue - 1) return 60;
    return 30;
};

// Calculate budget fit score
const calculateBudgetScore = (bidAmount, minBudget, maxBudget) => {
    if (bidAmount < minBudget) return 50;
    if (bidAmount > maxBudget) return 70;
    // Perfect fit within range
    const ideal = (minBudget + maxBudget) / 2;
    const deviation = Math.abs(bidAmount - ideal) / (maxBudget - minBudget);
    return Math.round(100 - (deviation * 30));
};

// Calculate rating score
const calculateRatingScore = (rating) => {
    if (!rating) return 60;
    return Math.round((rating / 5) * 100);
};

// Calculate completion rate score
const calculateCompletionScore = (completedProjects, totalProjects) => {
    if (totalProjects === 0) return 70;
    const rate = (completedProjects / totalProjects) * 100;
    return Math.min(100, Math.round(rate));
};

// Get trending skills
const getTrendingSkills = async (limit = 10) => {
    try {
        // Get all gigs
        const gigs = await Gig.find();
        
        // Count skill frequency
        const skillCount = {};
        gigs.forEach(gig => {
            gig.skills?.forEach(skill => {
                const skillKey = skill.toLowerCase();
                skillCount[skillKey] = (skillCount[skillKey] || 0) + 1;
            });
        });
        
        // Sort by frequency and return top skills
        const trending = Object.entries(skillCount)
            .map(([skill, count]) => ({ skill, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
        
        return trending;
    } catch (error) {
        console.error('Error getting trending skills:', error);
        return [];
    }
};

// Match freelancer to gig
const matchFreelancerToGig = async (freelancerId, gigId) => {
    try {
        const gig = await Gig.findById(gigId);
        const freelancer = await User.findById(freelancerId);
        
        if (!gig || !freelancer) return null;
        
        // Get freelancer's proposals for this gig (bid amount)
        const proposal = await Proposal.findOne({ 
            gigId: gig._id, 
            freelancerId: freelancer._id 
        });
        
        // Calculate scores
        const skillScore = calculateSkillSimilarity(gig.skills || [], freelancer.skills || []);
        const experienceScore = calculateExperienceScore(freelancer.experienceLevel || 'Entry', gig.experienceLevel);
        const budgetScore = proposal ? calculateBudgetScore(proposal.bidAmount, gig.budget.min, gig.budget.max) : 70;
        const ratingScore = calculateRatingScore(freelancer.rating || 0);
        const completionScore = calculateCompletionScore(freelancer.completedProjects || 0, freelancer.totalProjects || 0);
        
        // Calculate weighted total score
        const totalScore = Math.round(
            (skillScore * 0.4) +
            (experienceScore * 0.2) +
            (budgetScore * 0.15) +
            (ratingScore * 0.15) +
            (completionScore * 0.1)
        );
        
        return {
            freelancerId: freelancer._id,
            name: freelancer.name,
            email: freelancer.email,
            skills: freelancer.skills || [],
            scores: {
                skill: skillScore,
                experience: experienceScore,
                budget: budgetScore,
                rating: ratingScore,
                completion: completionScore,
                total: totalScore
            }
        };
    } catch (error) {
        console.error('Match error:', error);
        return null;
    }
};

// Get top matching freelancers for a gig
const getTopMatches = async (gigId, limit = 5) => {
    try {
        // Get all freelancers
        const freelancers = await User.find({ role: 'freelancer', isVerified: true });
        
        // Calculate match for each freelancer
        const matches = [];
        for (const freelancer of freelancers) {
            const match = await matchFreelancerToGig(freelancer._id, gigId);
            if (match && match.scores.total > 30) { // Only include matches above 30%
                matches.push(match);
            }
        }
        
        // Sort by total score and return top matches
        return matches.sort((a, b) => b.scores.total - a.scores.total).slice(0, limit);
    } catch (error) {
        console.error('Error getting top matches:', error);
        return [];
    }
};

// Get personalized recommendations for freelancer
const getPersonalizedRecommendations = async (freelancerId, limit = 10) => {
    try {
        const freelancer = await User.findById(freelancerId);
        if (!freelancer) return [];
        
        // Get all open gigs
        const gigs = await Gig.find({ status: 'open' });
        
        // Calculate match for each gig
        const recommendations = [];
        for (const gig of gigs) {
            const skillScore = calculateSkillSimilarity(gig.skills || [], freelancer.skills || []);
            
            if (skillScore > 30) { // Only recommend if skill match > 30%
                recommendations.push({
                    gigId: gig._id,
                    title: gig.title,
                    budget: gig.budget,
                    category: gig.category,
                    skills: gig.skills,
                    matchScore: skillScore
                });
            }
        }
        
        // Sort by match score
        return recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
    } catch (error) {
        console.error('Error getting recommendations:', error);
        return [];
    }
};

module.exports = {
    calculateSkillSimilarity,
    calculateExperienceScore,
    calculateBudgetScore,
    calculateRatingScore,
    calculateCompletionScore,
    matchFreelancerToGig,
    getTopMatches,
    getPersonalizedRecommendations,
    getTrendingSkills
};