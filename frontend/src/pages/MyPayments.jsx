import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import axios from 'axios';
import { DollarSign, Clock, Lock, CheckCircle, RefreshCw } from 'lucide-react';

function MyPayments() {
    const { token } = useAuth();
    const { formatAmount } = useCurrency();
    const [payments, setPayments] = useState([]);
    const [totalEscrow, setTotalEscrow] = useState(0);
    const [totalReleased, setTotalReleased] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPayments = async () => {
        try {
            const gigsRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/gigs/my-gigs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const gigs = gigsRes.data.gigs || [];
            let allPayments = [], escrowTotal = 0, releasedTotal = 0;
            for (const gig of gigs) {
                try {
                    const res = await axios.get(`http://localhost:5000/api/payments/gig/${gig._id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const gigPayments = res.data.payments || [];
                    allPayments = [...allPayments, ...gigPayments];
                    escrowTotal  += gigPayments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
                    releasedTotal += gigPayments.filter(p => p.status === 'released').reduce((s, p) => s + p.amount, 0);
                } catch (e) {}
            }
            setPayments(allPayments);
            setTotalEscrow(escrowTotal);
            setTotalReleased(releasedTotal);
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => { fetchPayments(); }, []);

    if (loading) return (
        <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0d9f6f]" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Payments & Escrow</h1>
                <button onClick={() => { setRefreshing(true); fetchPayments(); }} disabled={refreshing}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#0d9f6f] border border-[#0d9f6f] rounded-lg hover:bg-[#0d9f6f]/5">
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Lock className="text-blue-600" size={20} /></div>
                        <span className="text-sm text-gray-500">Total in Escrow</span>
                    </div>
                    {/* ✅ formatAmount converts USD to user's currency */}
                    <p className="text-3xl font-bold text-blue-600">{formatAmount(totalEscrow)}</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><CheckCircle className="text-green-600" size={20} /></div>
                        <span className="text-sm text-gray-500">Total Released</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{formatAmount(totalReleased)}</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center"><Clock className="text-yellow-600" size={20} /></div>
                        <span className="text-sm text-gray-500">Transactions</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-600">{payments.length}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b"><h2 className="font-semibold">Transaction History</h2></div>
                {payments.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <DollarSign size={48} className="mx-auto mb-3 opacity-30" />
                        <p>No payments yet</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {payments.map(payment => (
                            <div key={payment._id} className="px-6 py-4 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{payment.gigId?.title || 'Project'}</p>
                                    <p className="text-sm text-gray-500">To: {payment.freelancerId?.name}</p>
                                    <p className="text-xs text-gray-400">{new Date(payment.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    {/* ✅ Show in user's currency */}
                                    <p className="text-lg font-bold text-[#0d9f6f]">{formatAmount(payment.amount)}</p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${payment.status === 'released' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {payment.status === 'released' ? 'Released' : 'In Escrow'}
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

export default MyPayments;