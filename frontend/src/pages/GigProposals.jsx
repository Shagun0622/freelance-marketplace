import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
    DollarSign, Clock, CheckCircle, XCircle, AlertCircle,
    Mail, ArrowLeft, Send, Briefcase, Loader, Lock, BadgeCheck,Shield
} from 'lucide-react';
import RazorpayModal from '../components/RazorpayModal';

function GigProposals() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [proposals, setProposals] = useState([]);
    const [gig, setGig] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [error, setError] = useState('');
    const [showRazorpayModal, setShowRazorpayModal] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => { 
        fetchAll(); 
    }, [id]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [gigRes, proposalsRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/gigs/${id}`),
                axios.get(`http://localhost:5000/api/proposals/gig/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            
            setGig(gigRes.data.gig);
            setProposals(proposalsRes.data.proposals || []);
            await fetchPayments();
            
        } catch (err) {
            console.error('Fetch error:', err);
            if (err.response?.status === 403) navigate('/dashboard');
            else setError('Failed to load proposals.');
        }
        setLoading(false);
    };

    const fetchPayments = async () => {
        try {
            const paymentsRes = await axios.get(
                `http://localhost:5000/api/payments/gig/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✅ Payments fetched:', paymentsRes.data.payments);
            setPayments(paymentsRes.data.payments || []);
        } catch (e) {
            console.error('Failed to fetch payments:', e);
            setPayments([]);
        }
    };

    const handlePaymentSuccess = async () => {
        console.log('🎉 Payment success callback triggered');
        setShowRazorpayModal(false);
        setRefreshing(true);
        setError('Payment successful! Updating status...');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        await fetchPayments();
        await fetchAll();
        
        setRefreshing(false);
        setError('');
        alert('✅ Payment successful! Money is secured in escrow.');
    };

    const getProposalPayment = (proposal) => {
        return payments.find(p => {
            const byProposal = p.proposalId?.toString() === proposal._id?.toString();
            const byFreelancer = p.freelancerId?._id?.toString() === proposal.freelancerId?._id?.toString()
                || p.freelancerId?.toString() === proposal.freelancerId?._id?.toString();
            return byProposal || byFreelancer;
        });
    };

    const getPaymentBadge = (proposal) => {
        if (proposal.status !== 'accepted') return null;

        const payment = getProposalPayment(proposal);
        if (!payment) return 'pay';

        if (payment.status === 'failed') return 'failed';
        if (payment.status === 'released') return 'paid';
        if (payment.status === 'completed') return 'escrow';
        if (payment.status === 'pending') return 'processing';
        
        return 'pay';
    };

    const updateProposalStatus = async (proposalId, status) => {
        setUpdating(proposalId);
        try {
            await axios.put(
                `http://localhost:5000/api/proposals/${proposalId}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchAll();
        } catch {
            setError('Failed to update proposal status.');
        }
        setUpdating(null);
    };

    const statusConfig = {
        accepted: { label: 'Accepted', icon: CheckCircle, color: '#0d9f6f', bg: '#0d9f6f15' },
        rejected: { label: 'Rejected', icon: XCircle, color: '#e53e3e', bg: '#e53e3e15' },
        pending: { label: 'Pending', icon: Clock, color: '#f09f27', bg: '#f09f2715' },
    };

    const pendingCount = proposals.filter(p => p.status === 'pending').length;
    const acceptedCount = proposals.filter(p => p.status === 'accepted').length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 py-8">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0d9f6f]" />
                    </div>
                </div>
            </div>
        );
    }

    if (!gig) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center bg-white rounded-xl border border-gray-100 shadow-sm p-10 max-w-sm mx-4">
                    <div className="w-14 h-14 rounded-full bg-[#0d9f6f]/10 flex items-center justify-center mx-auto mb-4">
                        <Briefcase size={26} className="text-[#0d9f6f]" />
                    </div>
                    <h2 className="text-lg font-bold text-[#1a2332] mb-1">Gig not found</h2>
                    <button onClick={() => navigate('/dashboard')} className="mt-3 text-sm font-semibold text-[#0d9f6f] hover:underline">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">

                <button
                    onClick={() => navigate(`/gigs/${id}`)}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-[#0d9f6f] transition-colors mb-6"
                >
                    <ArrowLeft size={16} /> Back to Gig
                </button>

                {error && (
                    <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm mb-4">
                        <AlertCircle size={16} className="flex-shrink-0" /> {error}
                    </div>
                )}

                {refreshing && (
                    <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 text-blue-700 p-3.5 rounded-xl text-sm mb-4">
                        <Loader size={16} className="animate-spin" /> Updating payment status...
                    </div>
                )}

                {/* Gig Summary */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-5">
                    <div className="h-1 bg-gradient-to-r from-[#0d9f6f] to-[#0a85a0]" />
                    <div className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#0d9f6f]/10 flex items-center justify-center flex-shrink-0">
                                    <Briefcase size={18} className="text-[#0d9f6f]" />
                                </div>
                                <div>
                                    <h1 className="text-base font-bold text-[#1a2332] leading-snug">{gig.title}</h1>
                                    <p className="text-xs text-gray-400 mt-0.5">Budget: ${gig.budget?.min} – ${gig.budget?.max} · {gig.status}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="text-center px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-xl font-bold text-[#1a2332]">{proposals.length}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Total</p>
                                </div>
                                <div className="text-center px-4 py-2 bg-[#f09f27]/8 rounded-xl border border-[#f09f27]/15">
                                    <p className="text-xl font-bold text-[#f09f27]">{pendingCount}</p>
                                    <p className="text-[10px] text-[#f09f27] font-medium">Pending</p>
                                </div>
                                <div className="text-center px-4 py-2 bg-[#0d9f6f]/8 rounded-xl border border-[#0d9f6f]/15">
                                    <p className="text-xl font-bold text-[#0d9f6f]">{acceptedCount}</p>
                                    <p className="text-[10px] text-[#0d9f6f] font-medium">Accepted</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Proposals */}
                {proposals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm text-center px-4">
                        <div className="w-16 h-16 rounded-full bg-[#0d9f6f]/10 flex items-center justify-center mb-4">
                            <Send size={26} className="text-[#0d9f6f]" />
                        </div>
                        <h3 className="text-base font-bold text-[#1a2332]">No proposals yet</h3>
                        <p className="text-gray-400 text-sm mt-1 max-w-xs">Share your gig to start receiving applications from freelancers.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {proposals.map((proposal) => {
                            const s = statusConfig[proposal.status] || statusConfig.pending;
                            const StatusIcon = s.icon;
                            const initials = proposal.freelancerId?.name
                                ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'F';
                            const paymentBadge = getPaymentBadge(proposal);

                            return (
                                <div key={proposal._id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                    <div className="p-5">
                                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0d9f6f] to-[#0a7a55] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#1a2332] text-sm">{proposal.freelancerId?.name}</p>
                                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                        <Mail size={11} /> {proposal.freelancerId?.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="flex items-center gap-1 text-xl font-bold text-[#0d9f6f] justify-end">
                                                    <DollarSign size={17} /> {proposal.bidAmount}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-400 justify-end mt-0.5">
                                                    <Clock size={11} /> {proposal.estimatedDays} days
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Cover Letter</p>
                                            <p className="text-sm text-gray-600 leading-relaxed">{proposal.coverLetter}</p>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md" style={{ color: s.color, background: s.bg }}>
                                                <StatusIcon size={11} /> {s.label}
                                            </span>

                                            <div className="flex gap-2 items-center flex-wrap justify-end">
                                                {/* Pending Proposals - Show Accept/Reject */}
                                                {proposal.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateProposalStatus(proposal._id, 'rejected')}
                                                            disabled={updating === proposal._id}
                                                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                                                        >
                                                            {updating === proposal._id ? <Loader size={12} className="animate-spin" /> : <XCircle size={13} />} Reject
                                                        </button>
                                                        <button
                                                            onClick={() => updateProposalStatus(proposal._id, 'accepted')}
                                                            disabled={updating === proposal._id}
                                                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0d9f6f] text-white hover:bg-[#0a8560] transition-all disabled:opacity-50"
                                                        >
                                                            {updating === proposal._id ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={13} />} Accept
                                                        </button>
                                                    </>
                                                )}

                                                {/* Payment Status Badges */}
                                                {paymentBadge === 'paid' && (
                                                    <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-600 border border-green-200">
                                                        <BadgeCheck size={13} /> Paid
                                                    </span>
                                                )}
                                                
                                                {paymentBadge === 'escrow' && (
                                                    <>
                                                        <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                                                            <Lock size={13} /> In Escrow
                                                        </span>
                                                        <button
                                                            onClick={async () => {
                                                                const payment = getProposalPayment(proposal);
                                                                if (confirm('Release payment to freelancer?')) {
                                                                    try {
                                                                        await axios.post(
                                                                            `http://localhost:5000/api/payments/release-payment/${payment._id}`,
                                                                            {},
                                                                            { headers: { Authorization: `Bearer ${token}` } }
                                                                        );
                                                                        alert('✅ Payment released!');
                                                                        await fetchAll();
                                                                    } catch (error) {
                                                                        alert('Release failed');
                                                                    }
                                                                }
                                                            }}
                                                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition-all"
                                                        >
                                                            <CheckCircle size={13} /> Release Payment
                                                        </button>
                                                         <button
            onClick={() => {
                const payment = getProposalPayment(proposal);
                navigate(`/raise-dispute?paymentId=${payment?._id}&gigId=${gig._id}`);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-all"
        >
            <Shield size={13} /> Raise Dispute
        </button>
                                                    </>
                                                )}
                                                
                                                {paymentBadge === 'processing' && (
                                                    <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-yellow-50 text-yellow-600 border border-yellow-200">
                                                        <Loader size={13} className="animate-spin" /> Processing
                                                    </span>
                                                )}
                                                
                                                {paymentBadge === 'failed' && (
                                                    <>
                                                        <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                                                            <XCircle size={13} /> Payment Failed
                                                        </span>
                                                        <button
                                                            onClick={() => { setSelectedProposal(proposal); setShowRazorpayModal(true); }}
                                                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all"
                                                        >
                                                            💳 Retry Payment
                                                        </button>
                                                    </>
                                                )}
                                                
                                                {paymentBadge === 'pay' && (
                                                    <button
                                                        onClick={() => { setSelectedProposal(proposal); setShowRazorpayModal(true); }}
                                                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all"
                                                    >
                                                        💳 Pay Now
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {showRazorpayModal && selectedProposal && (
                <RazorpayModal
                    amount={selectedProposal.bidAmount}
                    gigId={gig._id}
                    proposalId={selectedProposal._id}
                    onSuccess={handlePaymentSuccess}
                    onClose={() => setShowRazorpayModal(false)}
                />
            )}
        </div>
    );
}

export default GigProposals;