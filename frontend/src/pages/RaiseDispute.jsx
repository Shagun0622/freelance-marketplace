import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import axios from 'axios';
import { useNavigate,useSearchParams} from 'react-router-dom';
import { Shield, AlertCircle, ArrowLeft, Loader } from 'lucide-react';

const REASONS = [
    'Work not delivered',
    'Work quality is poor',
    'Payment not released',
    'Scope creep',
    'Communication issues',
    'Fraudulent activity',
    'Other'
];

function RaiseDispute() {
    const { token } = useAuth();
    const { formatAmount } = useCurrency();
    const navigate = useNavigate();

    const [payments, setPayments] = useState([]);
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState({ paymentId: '', reason: '', description: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchPayments(); }, []);

    const fetchPayments = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/payments/my-payments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Only allow disputes on completed/escrow payments
            const eligible = (res.data.payments || []).filter(p =>
                ['completed', 'released'].includes(p.status)
            );
            setPayments(eligible);
        } catch (err) {
            setError('Failed to load payments');
        }
        setLoading(false);
    };

    const selectedPayment = payments.find(p => p._id === form.paymentId);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.paymentId) return setError('Please select a payment');
        if (!form.reason) return setError('Please select a reason');
        if (form.description.length < 30) return setError('Please provide more detail (at least 30 characters)');

        setSubmitting(true);
        setError('');
        try {
            await axios.post('http://localhost:5000/api/disputes', {
                gigId: selectedPayment.gigId?._id || selectedPayment.gigId,
                paymentId: form.paymentId,
                reason: form.reason,
                description: form.description
            }, { headers: { Authorization: `Bearer ${token}` } });

            navigate('/disputes');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to raise dispute');
        }
        setSubmitting(false);
    };

    const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#0d9f6f] transition-colors";
    const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0d9f6f]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">

                <button onClick={() => navigate('/disputes')}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#0d9f6f] mb-6">
                    <ArrowLeft size={16} /> Back to Disputes
                </button>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-red-400 to-orange-400" />
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                                <Shield size={20} className="text-red-500" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-gray-800">Raise a Dispute</h1>
                                <p className="text-xs text-gray-400">Our team will review and mediate within 48 hours</p>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm mb-4">
                                <AlertCircle size={16} className="flex-shrink-0" /> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Select Payment */}
                            <div>
                                <label className={labelClass}>Select Payment <span className="text-red-400">*</span></label>
                                {payments.length === 0 ? (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                                        No eligible payments found. You can only dispute completed or escrow payments.
                                    </div>
                                ) : (
                                    <select
                                        value={form.paymentId}
                                        onChange={e => setForm({ ...form, paymentId: e.target.value })}
                                        className={inputClass}
                                        required
                                    >
                                        <option value="">-- Select a payment --</option>
                                        {payments.map(p => (
                                            <option key={p._id} value={p._id}>
                                                {p.gigId?.title || 'Gig'} — {formatAmount(p.amount)} ({p.status})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Selected Payment Info */}
                            {selectedPayment && (
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Amount</span>
                                        <span className="font-bold text-[#0d9f6f]">{formatAmount(selectedPayment.amount)}</span>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-gray-500">Status</span>
                                        <span className="font-medium capitalize">{selectedPayment.status}</span>
                                    </div>
                                </div>
                            )}

                            {/* Reason */}
                            <div>
                                <label className={labelClass}>Reason <span className="text-red-400">*</span></label>
                                <select
                                    value={form.reason}
                                    onChange={e => setForm({ ...form, reason: e.target.value })}
                                    className={inputClass}
                                    required
                                >
                                    <option value="">-- Select a reason --</option>
                                    {REASONS.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className={labelClass}>
                                    Description <span className="text-red-400">*</span>
                                    <span className="text-gray-400 font-normal ml-1">(min 30 characters)</span>
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows="5"
                                    placeholder="Explain the issue in detail. Include dates, what was agreed, and what went wrong..."
                                    className={`${inputClass} resize-none`}
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">{form.description.length} / 30 min characters</p>
                            </div>

                            {/* Warning */}
                            <div className="p-3.5 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-700">
                                ⚠️ Filing a false dispute may result in account suspension. Only raise a dispute if you have a genuine issue.
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || payments.length === 0}
                                className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? <><Loader size={15} className="animate-spin" /> Submitting...</> : <><Shield size={15} /> Submit Dispute</>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RaiseDispute;