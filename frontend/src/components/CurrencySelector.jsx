import { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { ChevronDown, Check } from 'lucide-react';

function CurrencySelector() {
    const { currency, symbol, currencies, updateCurrency } = useCurrency();
    const [isOpen, setIsOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCurrencyChange = async (newCurrency) => {
        setUpdating(true);
        const result = await updateCurrency(newCurrency);
        if (result.success) {
            setIsOpen(false);
            window.location.reload();
        }
        setUpdating(false);
    };

    const getFlag = (code) => {
        const flags = {
            USD: '🇺🇸', INR: '🇮🇳', EUR: '🇪🇺', GBP: '🇬🇧',
            AUD: '🇦🇺', CAD: '🇨🇦', SGD: '🇸🇬', AED: '🇦🇪'
        };
        return flags[code] || '🌍';
    };

    const currentCurrency = currencies.find(c => c.code === currency);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={updating}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
                <span className="text-base">{getFlag(currency)}</span>
                <span className="font-medium text-gray-700">{currency}</span>
                <span className="text-gray-400 text-sm">{symbol}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Select Currency
                        </p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {currencies.map((curr) => (
                            <button
                                key={curr.code}
                                onClick={() => handleCurrencyChange(curr.code)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-gray-50 ${
                                    currency === curr.code ? 'bg-[#0d9f6f]/5' : ''
                                }`}
                            >
                                <span className="text-xl">{getFlag(curr.code)}</span>
                                <div className="flex-1 text-left">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-800">{curr.code}</span>
                                        <span className="text-xs text-gray-400">{curr.symbol}</span>
                                    </div>
                                    <p className="text-xs text-gray-400">{curr.name}</p>
                                </div>
                                {currency === curr.code && (
                                    <Check size={16} className="text-[#0d9f6f]" />
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                        <p className="text-xs text-gray-500 text-center">
                            Exchange rates update automatically
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CurrencySelector;