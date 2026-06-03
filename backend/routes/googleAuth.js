const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Generate random password for Google users
const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
};

// Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
            // User exists, link Google ID if not already linked
            if (!user.googleId) {
                user.googleId = profile.id;
                await user.save();
            }
            return done(null, user);
        }
        
        // Create new user
        const randomPassword = generateRandomPassword();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);
        
        user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            password: hashedPassword,
            googleId: profile.id,
            isEmailVerified: true, // Google emails are verified
            role: 'client'
        });
        
        await user.save();
        return done(null, user);
        
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Initiate Google Login
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Google Callback
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    async (req, res) => {
        try {
            const token = jwt.sign(
                { id: req.user._id, role: req.user.role },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            // Redirect to frontend with token
            res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
        } catch (error) {
            res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
        }
    }
);

module.exports = router;