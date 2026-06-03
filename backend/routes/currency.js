const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { 
    getExchangeRates, 
    getSupportedCurrencies, 
    convertAmount,
    getCurrencySymbol 
} = require('../services/exchangeRate');

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

// GET all supported currencies
router.get('/supported', async (req, res) => {
    try {
        const currencies = await getSupportedCurrencies();
        res.json({ success: true, currencies });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET current exchange rates
router.get('/rates', async (req, res) => {
    try {
        const rates = await getExchangeRates();
        res.json({ success: true, rates });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET user's currency preference
router.get('/preference', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        res.json({ 
            success: true, 
            currency: user.preferredCurrency || 'USD',
            symbol: getCurrencySymbol(user.preferredCurrency || 'USD')
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// UPDATE user's currency preference
router.put('/preference', auth, async (req, res) => {
    try {
        const { currency } = req.body;
        const supported = ['USD', 'INR', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'];
        
        if (!supported.includes(currency)) {
            return res.status(400).json({ message: 'Unsupported currency' });
        }
        
        const user = await User.findByIdAndUpdate(
            req.userId,
            { preferredCurrency: currency },
            { returnDocument: 'after' }
        ).select('-password');
        
        res.json({ 
            success: true, 
            currency,
            symbol: getCurrencySymbol(currency)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// CONVERT amount (utility endpoint)
router.post('/convert', auth, async (req, res) => {
    try {
        const { amountUSD, targetCurrency } = req.body;
        const converted = await convertAmount(amountUSD, targetCurrency);
        res.json({ success: true, ...converted });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;