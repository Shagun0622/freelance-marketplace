const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');
const Gig = require('../models/Gig');
const jwt = require('jsonwebtoken');
const { createNotification } = require('./notifications');

// Auth middleware
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// SUBMIT PROPOSAL - POST /api/proposals (Freelancer only)
router.post('/', auth, async (req, res) => {
    try {
        // Check if user is freelancer
        if (req.userRole !== 'freelancer') {
            return res.status(403).json({ message: 'Only freelancers can submit proposals' });
        }

        const { gigId, coverLetter, bidAmount, estimatedDays, attachments } = req.body;

        // Check if gig exists and is open
        const gig = await Gig.findById(gigId);
        if (!gig) {
            return res.status(404).json({ message: 'Gig not found' });
        }
        if (gig.status !== 'open') {
            return res.status(400).json({ message: 'This gig is no longer accepting proposals' });
        }

        // Check if already applied
        const existingProposal = await Proposal.findOne({
            gigId,
            freelancerId: req.userId
        });
        if (existingProposal) {
            return res.status(400).json({ message: 'You have already submitted a proposal for this gig' });
        }

        // Get freelancer info for notification
        const User = require('../models/User');
        const freelancer = await User.findById(req.userId);

        // Create proposal
        const proposal = new Proposal({
            gigId,
            freelancerId: req.userId,
            coverLetter,
            bidAmount,
            estimatedDays,
            attachments: attachments || []
        });

        await proposal.save();

        // Update gig's proposal count
        gig.proposalsCount += 1;
        await gig.save();

        // 🔔 CREATE NOTIFICATION FOR CLIENT (No emojis)
        await createNotification(
            gig.clientId,
            'proposal_submitted',
            'New Proposal Received',
            `${freelancer.name} submitted a proposal for "${gig.title}" with a bid of $${bidAmount}`,
            { 
                proposalId: proposal._id, 
                gigId: gig._id,
                freelancerId: req.userId,
                bidAmount: bidAmount
            }
        );

        res.status(201).json({
            success: true,
            message: 'Proposal submitted successfully',
            proposal
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// GET PROPOSALS FOR A GIG - GET /api/proposals/gig/:gigId (Client who owns the gig)
router.get('/gig/:gigId', auth, async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.gigId);
        if (!gig) {
            return res.status(404).json({ message: 'Gig not found' });
        }

        // Check if user is the client who posted the gig or admin
        if (gig.clientId.toString() !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json({ message: 'You can only view proposals for your own gigs' });
        }

        const proposals = await Proposal.find({ gigId: req.params.gigId })
            .populate('freelancerId', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, proposals });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET MY PROPOSALS - GET /api/proposals/my-proposals (Freelancer)
router.get('/my-proposals', auth, async (req, res) => {
    try {
        const proposals = await Proposal.find({ freelancerId: req.userId })
            .populate('gigId', 'title budget category clientId status')
            .sort({ createdAt: -1 });

        res.json({ success: true, proposals });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// UPDATE PROPOSAL STATUS - PUT /api/proposals/:id
router.put('/:id', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const proposal = await Proposal.findById(req.params.id)
            .populate('gigId')
            .populate('freelancerId', 'name email');

        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        // Check permission
        const isGigOwner = proposal.gigId.clientId.toString() === req.userId;
        const isAdmin = req.userRole === 'admin';

        if (!isGigOwner && !isAdmin) {
            return res.status(403).json({ message: 'You can only update proposals for your own gigs' });
        }

        const oldStatus = proposal.status;
        proposal.status = status;
        await proposal.save();

        // If accepted, reject all other proposals and CREATE CONVERSATION
        if (status === 'accepted' && oldStatus !== 'accepted') {
            // Reject other proposals
            await Proposal.updateMany(
                { gigId: proposal.gigId._id, _id: { $ne: proposal._id } },
                { status: 'rejected' }
            );
            
            // Update gig status
            await Gig.findByIdAndUpdate(proposal.gigId._id, { status: 'in_progress' });
            
            // Create a conversation between client and freelancer
            const Conversation = require('../models/Conversation');
            
            // Check if conversation already exists
            let conversation = await Conversation.findOne({
                participants: { $all: [proposal.gigId.clientId, proposal.freelancerId._id] }
            });
            
            if (!conversation) {
                conversation = new Conversation({
                    participants: [proposal.gigId.clientId, proposal.freelancerId._id],
                    gigId: proposal.gigId._id,
                    lastMessage: "Congratulations! Your proposal has been accepted. You can now start messaging.",
                    lastMessageTime: new Date()
                });
                await conversation.save();
                console.log('Conversation created:', conversation._id);
            }
            
            // NOTIFICATION: Proposal Accepted (No emojis)
            await createNotification(
                proposal.freelancerId._id,
                'proposal_accepted',
                'Proposal Accepted',
                `Your proposal for "${proposal.gigId.title}" has been accepted. Start messaging with the client now.`,
                { 
                    gigId: proposal.gigId._id, 
                    proposalId: proposal._id,
                    conversationId: conversation._id
                }
            );
            
        } else if (status === 'rejected' && oldStatus !== 'rejected') {
            // NOTIFICATION: Proposal Rejected (No emojis)
            await createNotification(
                proposal.freelancerId._id,
                'proposal_rejected',
                'Proposal Update',
                `Your proposal for "${proposal.gigId.title}" was not selected. Keep applying to other gigs.`,
                { 
                    gigId: proposal.gigId._id, 
                    proposalId: proposal._id 
                }
            );
        }

        res.json({ success: true, proposal });

    } catch (error) {
        console.error('Error updating proposal:', error);
        res.status(500).json({ message: error.message });
    }
});

// DELETE PROPOSAL - DELETE /api/proposals/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.id);

        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        if (proposal.freelancerId.toString() !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json({ message: 'You can only delete your own proposals' });
        }

        await Proposal.findByIdAndDelete(req.params.id);

        // Decrement gig proposal count
        await Gig.findByIdAndUpdate(proposal.gigId, { $inc: { proposalsCount: -1 } });

        res.json({ success: true, message: 'Proposal deleted' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;