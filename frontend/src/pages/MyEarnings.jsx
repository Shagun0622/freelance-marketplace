import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import axios from 'axios';
import { DollarSign, Clock, Wallet } from 'lucide-react';

function MyEarnings() {
    const { token } = useAuth();
    const { formatAmount } = useCurrency();
    const [payments, setPayments] = useState([]);
    const [totalEarned, setTotalEarned] = useState(0);
    const [pendingAmount, setPendingAmount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchEarnings(); }, []);

    const fetchEarnings = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/payments/my-payments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayments(res.data.payments || []);
            setTotalEarned(res.data.totalEarned || 0);
            setPendingAmount(res.data.pendingAmount || 0);
        } catch (error) {
            console.error('Error fetching earnings:', error);
        }
        setLoading(false);
    };

    if (loading) return (
        <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0d9f6f]" />
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">My Earnings</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><DollarSign className="text-green-600" size={20} /></div>
                        <span className="text-sm text-gray-500">Total Earned</span>
                    </div>
                    {/* ✅ formatAmount converts USD to user's currency */}
                    <p className="text-3xl font-bold text-green-600">{formatAmount(totalEarned)}</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center"><Clock className="text-yellow-600" size={20} /></div>
                        <span className="text-sm text-gray-500">Pending Release</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-600">{formatAmount(pendingAmount)}</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Wallet className="text-blue-600" size={20} /></div>
                        <span className="text-sm text-gray-500">Completed</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{payments.filter(p => p.status === 'released').length}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b"><h2 className="font-semibold">Transaction History</h2></div>
                {payments.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <DollarSign size={48} className="mx-auto mb-3 opacity-30" />
                        <p>No transactions yet</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {payments.map(payment => (
                            <div key={payment._id} className="px-6 py-4 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{payment.gigId?.title}</p>
                                    <p className="text-sm text-gray-500">{new Date(payment.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    {/* ✅ Show in user's currency */}
                                    <p className="text-lg font-bold text-[#0d9f6f]">{formatAmount(payment.freelancerAmount)}</p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${payment.status === 'released' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {payment.status === 'released' ? 'Paid' : 'In Escrow'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
        </div>
        </div>
    );
}

export default MyEarnings;