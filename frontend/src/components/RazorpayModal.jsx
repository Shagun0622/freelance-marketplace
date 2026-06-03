import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Lock, CreditCard, IndianRupee } from 'lucide-react';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

function RazorpayModal({ amount, gigId, proposalId, onSuccess, onClose }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [orderDetails, setOrderDetails] = useState(null);

    // ✅ Display values — backend handles the real conversion
    const USD_TO_INR = 85;
    const amountInINR = Math.round(amount * USD_TO_INR);

    useEffect(() => {
        createOrder();
    }, []);

    const createOrder = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/razorpay/create-order',
                { gigId, proposalId, amount }, // send USD amount, backend converts
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setOrderDetails(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create order');
        }
        setLoading(false);
    };

    const notifyPaymentFailure = async (paymentRecordId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/razorpay/payment-failed',
                { paymentRecordId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error('Failed to notify payment failure:', err);
        }
    };

    const handlePayment = async () => {
        setLoading(true);

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            setError("Failed to load Razorpay SDK");
            setLoading(false);
            return;
        }

        const options = {
            key: orderDetails.keyId,
            amount: orderDetails.amount,       // paise from backend (already converted)
            currency: orderDetails.currency,
            name: "Worklance",
            description: `Payment for Gig`,
            order_id: orderDetails.orderId,
            handler: async (response) => {
                try {
                    const token = localStorage.getItem("token");
                    const verifyRes = await axios.post(
                        "http://localhost:5000/api/razorpay/verify-payment",
                        {
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                            paymentRecordId: orderDetails.paymentId,
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (verifyRes.data.success) {
                        onSuccess();
                    } else {
                        setError("Payment verification failed");
                    }
                } catch (err) {
                    setError("Payment verification failed");
                }
                setLoading(false);
            },
            prefill: {
                name: localStorage.getItem("userName") || "",
                email: localStorage.getItem("userEmail") || "",
            },
            theme: { color: "#0d9f6f" },
            modal: {
                ondismiss: () => setLoading(false),
            },
        };

        const razorpay = new window.Razorpay(options);

        razorpay.on("payment.failed", async (response) => {
            setError(response.error.description || "Payment failed. Please try again.");
            setLoading(false);
            await notifyPaymentFailure(orderDetails.paymentId);
        });

        razorpay.open();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Secure Payment</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Amount Display */}
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-1">
                        <IndianRupee size={20} className="text-green-600" />
                        <span className="text-2xl font-bold text-green-600">
                            ₹{amountInINR.toLocaleString()}
                        </span>
                    </div>
                    <p className="text-xs text-green-600 mb-2">
                        = ${amount} USD × ₹{USD_TO_INR} exchange rate
                    </p>
                    <p className="text-sm text-green-700 flex items-center gap-1">
                        <Lock size={14} />
                        Payment secured in escrow via Razorpay
                    </p>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <CreditCard size={16} />
                        <span>Credit / Debit Cards</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="text-base">📱</span>
                        <span>UPI (PhonePe, Google Pay, Paytm)</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="text-base">🏦</span>
                        <span>NetBanking</span>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {orderDetails ? (
                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-[#0d9f6f] text-white py-3 rounded-lg font-semibold hover:bg-[#0a8560] disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Processing...' : `Pay ₹${amountInINR.toLocaleString()}`}
                    </button>
                ) : (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d9f6f] mx-auto" />
                        <p className="text-gray-500 mt-2">
                            {error ? '' : 'Initializing payment...'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RazorpayModal;