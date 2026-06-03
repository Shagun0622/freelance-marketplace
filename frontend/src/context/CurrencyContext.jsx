import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [currency, setCurrency] = useState('USD');
    const [symbol, setSymbol] = useState('$');
    const [currencies, setCurrencies] = useState([]);
    const [exchangeRates, setExchangeRates] = useState({});
    const [loading, setLoading] = useState(true);

    // Fetch all supported currencies
    const fetchCurrencies = useCallback(async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/currency/supported');
            setCurrencies(res.data.currencies || []);
        } catch (error) {
            console.error('Error fetching currencies:', error);
        }
    }, []);

    // Fetch exchange rates
    const fetchRates = useCallback(async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/currency/rates');
            setExchangeRates(res.data.rates || {});
        } catch (error) {
            console.error('Error fetching rates:', error);
        }
    }, []);

    // Fetch user's currency preference
    const fetchUserPreference = useCallback(async () => {
        if (!token) return;
        
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/currency/preference', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurrency(res.data.currency || 'USD');
            setSymbol(res.data.symbol || '$');
        } catch (error) {
            console.error('Error fetching preference:', error);
        }
    }, [token]);

    // Update currency preference
    const updateCurrency = async (newCurrency) => {
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/currency/preference', 
                { currency: newCurrency },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (res.data.success) {
                setCurrency(newCurrency);
                setSymbol(res.data.symbol);
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error('Error updating currency:', error);
            return { success: false };
        }
    };

    // Convert USD amount to current currency
    const convertAmount = (amountUSD) => {
        if (!amountUSD && amountUSD !== 0) return { amount: 0, symbol, rate: 1 };
        if (currency === 'USD') return { amount: amountUSD, symbol: '$', rate: 1 };
        
        const rate = exchangeRates[currency]?.rate || 1;
        const convertedAmount = Math.round(amountUSD * rate);
        
        return {
            amount: convertedAmount,
            symbol: exchangeRates[currency]?.symbol || symbol,
            rate: rate
        };
    };

    // Format amount for display
    const formatAmount = (amountUSD) => {
        if (!amountUSD && amountUSD !== 0) return `${symbol}0`;
        const { amount, symbol: sym } = convertAmount(amountUSD);
        return `${sym}${amount.toLocaleString()}`;
    };

    // Initial load
    useEffect(() => {
        fetchCurrencies();
        fetchRates();
        fetchUserPreference();
        
        // Refresh rates every hour
        const interval = setInterval(fetchRates, 3600000);
        return () => clearInterval(interval);
    }, [fetchCurrencies, fetchRates, fetchUserPreference]);

    return (
        <CurrencyContext.Provider value={{
            currency,
            symbol,
            currencies,
            exchangeRates,
            loading,
            updateCurrency,
            convertAmount,
            formatAmount
        }}>
            {children}
        </CurrencyContext.Provider>
    );
};