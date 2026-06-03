const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

// SETUP 2FA - Generate secret and QR code
router.post('/setup', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `Worklance (${user.email})`,
            length: 20
        });
        
        // Store secret temporarily (will be enabled after verification)
        user.twoFactorSecret = secret.base32;
        await user.save();
        
        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        
        res.json({
            success: true,
            secret: secret.base32,
            qrCode: qrCodeUrl
        });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// VERIFY AND ENABLE 2FA
router.post('/verify-enable', auth, async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.userId);
        
        if (!user.twoFactorSecret) {
            return res.status(400).json({ message: '2FA not set up yet' });
        }
        
        // Verify token
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token
        });
        
        if (!verified) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }
        
        // Enable 2FA
        user.isTwoFactorEnabled = true;
        await user.save();
        
        res.json({ success: true, message: '2FA enabled successfully' });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DISABLE 2FA
router.post('/disable', auth, async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.userId);
        
        if (user.isTwoFactorEnabled) {
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: token
            });
            
            if (!verified) {
                return res.status(400).json({ message: 'Invalid verification code' });
            }
        }
        
        user.isTwoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        await user.save();
        
        res.json({ success: true, message: '2FA disabled successfully' });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// VERIFY 2FA DURING LOGIN
router.post('/verify-login', async (req, res) => {
    try {
        const { userId, token } = req.body;
        
        const user = await User.findById(userId);
        if (!user || !user.isTwoFactorEnabled) {
            return res.status(400).json({ message: '2FA not enabled for this user' });
        }
        
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token
        });
        
        if (!verified) {
            return res.status(400).json({ message: 'Invalid 2FA code' });
        }
        
        // Generate JWT after successful 2FA
        const jwtToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            token: jwtToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;