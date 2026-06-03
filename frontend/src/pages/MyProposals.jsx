import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
    Briefcase, DollarSign, Clock, CheckCircle, XCircle, 
    Clock as ClockIcon, Eye, Trash2, AlertCircle,
    Lock, BadgeCheck, Loader, IndianRupee,Shield
} from 'lucide-react';

// Helper: USD → INR display (adjust rate as needed, or fetch live)
const USD_TO_INR = 83.5;
const formatINR = (usd) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
        .format(Math.round(usd * USD_TO_INR));

function MyProposals() {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    
    const [proposals, setProposals] = useState([]);
    const [payments, setPayments] = useState([]);       // ← new
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMyProposals();
    }, []);

    const fetchMyProposals = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                'http://localhost:5000/api/proposals/my-proposals',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const fetched = res.data.proposals;
            setProposals(fetched);

            // Fetch payments for every unique gig in these proposals
            const gigIds = [...new Set(fetched.map(p => p.gigId?._id).filter(Boolean))];
            const paymentResults = await Promise.allSettled(
                gigIds.map(gigId =>
                    axios.get(`http://localhost:5000/api/payments/gig/${gigId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                )
            );
            const allPayments = paymentResults
                .filter(r => r.status === 'fulfilled')
                .flatMap(r => r.value.data.payments || []);
            setPayments(allPayments);

        } catch (err) {
            console.error('Error fetching proposals:', err);
            setError('Failed to load your proposals');
        }
        setLoading(false);
    };

    const deleteProposal = async (proposalId) => {
        if (!confirm('Are you sure you want to withdraw this proposal?')) return;
        setDeleting(proposalId);
        try {
            await axios.delete(
                `http://localhost:5000/api/proposals/${proposalId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchMyProposals();
        } catch (err) {
            console.error('Error deleting proposal:', err);
            alert('Failed to withdraw proposal');
        }
        setDeleting(null);
    };

    // Match payment to proposal (mirrors GigProposals logic)
    const getProposalPayment = (proposal) =>
        payments.find(p => {
            const byProposal = p.proposalId?.toString() === proposal._id?.toString();
            const byFreelancer =
                p.freelancerId?._id?.toString() === proposal.freelancerId?.toString() ||
                p.freelancerId?.toString() === proposal.freelancerId?.toString();
            return byProposal || byFreelancer;
        });

    const getPaymentBadge = (proposal) => {
        if (proposal.status !== 'accepted') return null;
        const payment = getProposalPayment(proposal);
        if (!payment) return null;               // client hasn't paid yet
        if (payment.status === 'released') return 'paid';
        if (payment.status === 'completed') return 'escrow';
        if (payment.status === 'pending')  return 'processing';
        if (payment.status === 'failed')   return 'failed';
        return null;
    };

    const PaymentBadge = ({ proposal }) => {
        const badge = getPaymentBadge(proposal);
        const payment = getProposalPayment(proposal);
        const amountINR = payment ? formatINR(payment.amount ?? proposal.bidAmount) : null;

        if (!badge) return null;

        const badges = {
            paid: (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
                        <BadgeCheck size={16} /> Payment Released
                    </span>
                    {amountINR && (
                        <span className="flex items-center gap-1 text-sm font-bold text-green-700">
                            <IndianRupee size={14} /> {amountINR}
                        </span>
                    )}
                </div>
            ),
            escrow: (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-blue-700">
                        <Lock size={16} /> Payment in Escrow
                    </span>
                    {amountINR && (
                        <span className="flex items-center gap-1 text-sm font-bold text-blue-700">
                            <IndianRupee size={14} /> {amountINR}
                        </span>
                    )}
                    <p className="w-full text-xs text-blue-600 mt-0.5">
                        Funds are secured. They'll be released once the client approves your work.
                    </p>
                </div>
            ),
            processing: (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                    <Loader size={14} className="animate-spin text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-700">Payment Processing…</span>
                    {amountINR && (
                        <span className="ml-auto flex items-center gap-1 text-sm font-bold text-yellow-700">
                            <IndianRupee size={14} /> {amountINR}
                        </span>
                    )}
                </div>
            ),
            failed: (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <XCircle size={14} className="text-red-600" />
                    <span className="text-sm font-semibold text-red-700">Payment Failed</span>
                    <p className="text-xs text-red-600 ml-1">The client's payment didn't go through.</p>
                </div>
            ),
        };

        return badges[badge] ?? null;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'accepted':
                return (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                        <CheckCircle size={12} /> Accepted
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                        <XCircle size={12} /> Rejected
                    </span>
                );
            case 'withdrawn':
                return (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-semibold">
                        Withdrawn
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                        <ClockIcon size={12} /> Pending
                    </span>
                );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d9f6f]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My Proposals</h1>
                    <p className="text-gray-500 mt-1">Track all your job applications and their status</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3">
                        <AlertCircle size={20} /> {error}
                    </div>
                )}

                {proposals.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No proposals yet</h3>
                        <p className="text-gray-400 mb-4">You haven't submitted any proposals</p>
                        <button
                            onClick={() => navigate('/browse-gigs')}
                            className="bg-[#0d9f6f] text-white px-6 py-2 rounded-lg hover:bg-[#0a8560] transition-colors"
                        >
                            Browse Gigs
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {proposals.map((proposal) => (
                            <div key={proposal._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="p-6">
                                    <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
                                        <div className="flex-1">
                                            <Link
                                                to={`/gigs/${proposal.gigId?._id}`}
                                                className="text-lg font-bold text-gray-800 hover:text-[#0d9f6f] transition-colors"
                                            >
                                                {proposal.gigId?.title || 'Gig not available'}
                                            </Link>
                                            <div className="flex flex-wrap gap-3 mt-2">
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                    {proposal.gigId?.category}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    Posted: {new Date(proposal.gigId?.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">{getStatusBadge(proposal.status)}</div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-y border-gray-100 mb-4">
                                        <div className="flex items-center gap-2">
                                            <IndianRupee size={18} className="text-[#0d9f6f]" />
                                            <div>
                                                <p className="text-xs text-gray-400">Bid Amount (INR)</p>
                                                <p className="text-sm font-semibold">{formatINR(proposal.bidAmount)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={18} className="text-[#0d9f6f]" />
                                            <div>
                                                <p className="text-xs text-gray-400">Estimated Days</p>
                                                <p className="text-sm font-semibold">{proposal.estimatedDays} days</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                                            <ClockIcon size={18} className="text-[#0d9f6f]" />
                                            <div>
                                                <p className="text-xs text-gray-400">Submitted</p>
                                                <p className="text-sm font-semibold">
                                                    {new Date(proposal.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Cover Letter:</p>
                                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg line-clamp-3">
                                            {proposal.coverLetter}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => navigate(`/gigs/${proposal.gigId?._id}`)}
                                            className="flex items-center gap-2 text-[#0d9f6f] border border-[#0d9f6f] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0d9f6f]/5 transition-colors"
                                        >
                                            <Eye size={16} /> View Gig
                                        </button>
                                        {proposal.status === 'pending' && (
                                            <button
                                                onClick={() => deleteProposal(proposal._id)}
                                                disabled={deleting === proposal._id}
                                                className="flex items-center gap-2 text-red-600 border border-red-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                                            >
                                                <Trash2 size={16} />
                                                {deleting === proposal._id ? 'Withdrawing...' : 'Withdraw Proposal'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Payment status banner (accepted proposals only) */}
                                    <PaymentBadge proposal={proposal} />

                                    {/* Accepted but no payment yet */}
                                    {proposal.status === 'accepted' && !getPaymentBadge(proposal) && (
                                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <p className="text-sm text-green-700">
                                                🎉 Congratulations! Your proposal has been accepted. Waiting for the client to secure payment.
                                            </p>
                                             <button
            onClick={() => navigate(`/raise-dispute?gigId=${proposal.gigId?._id}`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
        >
            <Shield size={13} /> Raise Dispute
        </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyProposals;