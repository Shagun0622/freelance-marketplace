const axios = require('axios');

// Supported currencies
const SUPPORTED_CURRENCIES = {
    USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸', rate: 1 },
    INR: { symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', rate: 85 },
    EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺', rate: 0.92 },
    GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧', rate: 0.79 },
    AUD: { symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', rate: 1.52 },
    CAD: { symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', rate: 1.36 },
    SGD: { symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', rate: 1.35 },
    AED: { symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪', rate: 3.67 },
};

let cachedRates = null;
let lastFetchTime = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Fetch live exchange rates from API
const fetchLiveRates = async () => {
    try {
        const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
            timeout: 5000
        });
        const rates = response.data.rates;
        
        // Update rates for supported currencies
        for (const [code, currency] of Object.entries(SUPPORTED_CURRENCIES)) {
            if (rates[code]) {
                currency.rate = rates[code];
            }
        }
        
        cachedRates = SUPPORTED_CURRENCIES;
        lastFetchTime = Date.now();
        
        console.log('✅ Exchange rates updated');
        return SUPPORTED_CURRENCIES;
    } catch (error) {
        console.error('Failed to fetch live rates, using default rates');
        return SUPPORTED_CURRENCIES;
    }
};

// Get current exchange rates with caching
const getExchangeRates = async () => {
    if (!cachedRates || (Date.now() - lastFetchTime) > CACHE_DURATION) {
        await fetchLiveRates();
    }
    return cachedRates;
};

// Convert amount from USD to target currency
const convertAmount = async (amountUSD, targetCurrency) => {
    const rates = await getExchangeRates();
    const currency = rates[targetCurrency];
    if (!currency) return { amount: amountUSD, symbol: '$', rate: 1 };
    
    return {
        amount: Math.round(amountUSD * currency.rate),
        symbol: currency.symbol,
        rate: currency.rate,
        currency: targetCurrency
    };
};

// Get all supported currencies
const getSupportedCurrencies = async () => {
    await getExchangeRates();
    return Object.entries(SUPPORTED_CURRENCIES).map(([code, data]) => ({
        code,
        name: data.name,
        symbol: data.symbol,
        flag: data.flag,
        rate: data.rate
    }));
};

// Get currency symbol
const getCurrencySymbol = (code) => {
    return SUPPORTED_CURRENCIES[code]?.symbol || '$';
};

module.exports = {
    SUPPORTED_CURRENCIES,
    getExchangeRates,
    convertAmount,
    getSupportedCurrencies,
    getCurrencySymbol
};