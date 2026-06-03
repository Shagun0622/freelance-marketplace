const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail, generateVerificationToken } = require('../config/email');

const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

// Helper to build full user object
const buildUserResponse = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    preferredCurrency: user.preferredCurrency || 'USD',
    phone: user.phone || '',
    location: user.location || '',
    bio: user.bio || '',
    skills: user.skills || [],
    // ✅ Freelancer fields
    title: user.title || '',
    hourlyRate: user.hourlyRate || 0,
    experienceLevel: user.experienceLevel || 'Intermediate',
    availability: user.availability || 'Full-time',
    workExperience: user.workExperience || [],
    certifications: user.certifications || [],
    portfolio: user.portfolio || [],
    resumeUrl: user.resumeUrl || '',
    // Auth fields
    isVerified: user.isVerified,
    isSuspended: user.isSuspended,
    isEmailVerified: user.isEmailVerified,
    isTwoFactorEnabled: user.isTwoFactorEnabled,
    averageRating: user.averageRating || 0,
    totalReviews: user.totalReviews || 0,
});

// ── REGISTER ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date();
        verificationExpires.setHours(verificationExpires.getHours() + 24);

        const user = new User({
            name, email,
            password: hashedPassword,
            role: role || 'client',
            preferredCurrency: 'USD',
            isEmailVerified: false,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires,
            phone: '', location: '', bio: '', skills: []
        });

        await user.save();
        await sendWelcomeEmail(email, name);
        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please verify your email.',
            requiresVerification: true,
            email: user.email
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ── VERIFY EMAIL ──────────────────────────────────────────────────────────────
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() }
        });

        if (!user) return res.status(400).json({ message: 'Invalid or expired verification token' });

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        const jwtToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ success: true, message: 'Email verified successfully!', token: jwtToken, user: buildUserResponse(user) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ── RESEND VERIFICATION ───────────────────────────────────────────────────────
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isEmailVerified) return res.status(400).json({ message: 'Email already verified' });

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date();
        verificationExpires.setHours(verificationExpires.getHours() + 24);

        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = verificationExpires;
        await user.save();

        await sendVerificationEmail(email, verificationToken);
        res.json({ success: true, message: 'Verification email resent' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        if (user.isSuspended) return res.status(403).json({ message: 'Account suspended. Contact support.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            if (user.loginAttempts >= 5) user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
            await user.save();
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        if (!user.isEmailVerified) {
            return res.status(403).json({
                message: 'Please verify your email before logging in',
                requiresVerification: true,
                email: user.email
            });
        }

        if (user.isTwoFactorEnabled) {
            return res.json({ success: true, requiresTwoFactor: true, userId: user._id, message: '2FA code required' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ success: true, token, user: buildUserResponse(user) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.json({ success: true, message: 'If an account exists, a reset link will be sent' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date();
        resetExpires.setHours(resetExpires.getHours() + 1);

        user.passwordResetToken = resetToken;
        user.passwordResetExpires = resetExpires;
        await user.save();

        await sendPasswordResetEmail(email, resetToken);
        res.json({ success: true, message: 'Password reset link sent to your email' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ── RESET PASSWORD ────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() }
        });

        if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ── GET CURRENT USER ──────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// ── GET PROFILE ───────────────────────────────────────────────────────────────
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ── UPDATE PROFILE ────────────────────────────────────────────────────────────
router.put('/update-profile', auth, async (req, res) => {
    try {
        const {
            name, phone, location, bio, skills,
            title, hourlyRate, experienceLevel, availability,
            workExperience, certifications, portfolio, resumeUrl
        } = req.body;

        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (phone !== undefined) updateFields.phone = phone;
        if (location !== undefined) updateFields.location = location;
        if (bio !== undefined) updateFields.bio = bio;
        if (skills !== undefined) updateFields.skills = skills;

        // Freelancer-only fields
        const user = await User.findById(req.userId);
        if (user.role === 'freelancer') {
            if (title !== undefined) updateFields.title = title;
            if (hourlyRate !== undefined) updateFields.hourlyRate = hourlyRate;
            if (experienceLevel !== undefined) updateFields.experienceLevel = experienceLevel;
            if (availability !== undefined) updateFields.availability = availability;
            if (workExperience !== undefined) updateFields.workExperience = workExperience;
            if (certifications !== undefined) updateFields.certifications = certifications;
            if (portfolio !== undefined) updateFields.portfolio = portfolio;
            if (resumeUrl !== undefined) updateFields.resumeUrl = resumeUrl;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        console.log('✅ Profile updated:', updatedUser.email);
        res.json({ success: true, user: buildUserResponse(updatedUser), message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: error.message });
    }
});

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────────
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;