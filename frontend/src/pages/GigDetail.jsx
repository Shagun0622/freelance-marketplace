import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import axios from 'axios';
import {
    Clock, Briefcase, Award, ArrowLeft, Star,
    Send, CheckCircle, AlertCircle, Loader, Users,
    ChevronRight, Edit2, Calendar
} from 'lucide-react';

function GigDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const { formatAmount } = useCurrency();

    const [gig, setGig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showApplyForm, setShowApplyForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [proposal, setProposal] = useState({ coverLetter: '', bidAmount: '', estimatedDays: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const INR_RATE = 83.5;
    const bidInINR = proposal.bidAmount
        ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
            .format(Math.round(proposal.bidAmount * INR_RATE))
        : null;

    useEffect(() => { fetchGig(); }, [id]);

    const fetchGig = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/gigs/${id}`);
            setGig(res.data.gig);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleProposalChange = (e) => {
        const { name, value } = e.target;
        
        // For bidAmount, validate against max budget
        if (name === 'bidAmount') {
            const bidValue = parseInt(value);
            if (gig && bidValue > gig.budget?.max) {
                setError(`Bid amount cannot exceed ₹${gig.budget?.max}`);
            } else {
                setError('');
            }
        }
        
        setProposal({ ...proposal, [name]: value });
    };

    const handleSubmitProposal = async (e) => {
        e.preventDefault();
        
        // Final validation before submission
        if (parseInt(proposal.bidAmount) > gig.budget?.max) {
            setError(`Bid amount cannot exceed ₹${gig.budget?.max}`);
            return;
        }
        
        if (parseInt(proposal.bidAmount) < 50) {
            setError('Bid amount must be at least ₹50');
            return;
        }
        
        setSubmitting(true);
        setError('');
        
        try {
            await axios.post('http://localhost:5000/api/proposals',
                { gigId: id, coverLetter: proposal.coverLetter, bidAmount: parseInt(proposal.bidAmount), estimatedDays: parseInt(proposal.estimatedDays) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess('Proposal submitted! Redirecting...');
            setShowApplyForm(false);
            setTimeout(() => navigate('/my-proposals'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit proposal');
        }
        setSubmitting(false);
    };

    const renderStars = (rating) => {
        if (!rating || rating === 0) return null;
        return (
            <div className="flex items-center gap-1">
                <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            size={14}
                            className={star <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                    ))}
                </div>
                <span className="text-xs font-semibold text-gray-700">{rating}</span>
                <span className="text-xs text-gray-400">({gig.clientId?.totalReviews || 0} reviews)</span>
            </div>
        );
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4">
                <div className="h-6 w-32 bg-gray-200 rounded-lg animate-pulse" />
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                </div>
            </div>
        </div>
    );

    if (!gig) return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center bg-white rounded-xl border p-10 max-w-sm mx-4">
                <Briefcase size={26} className="text-[#0d9f6f] mx-auto mb-4" />
                <h2 className="text-lg font-bold text-[#1a2332] mb-1">Gig not found</h2>
                <button onClick={() => navigate('/browse-gigs')} className="text-sm font-semibold text-[#0d9f6f] hover:underline flex items-center gap-1 mx-auto">
                    <ArrowLeft size={14} /> Back to Browse
                </button>
            </div>
        </div>
    );

    const isOwner = user && (gig.clientId?._id === user._id || gig.clientId?._id === user.id);
    const canApply = user && user.role === 'freelancer' && gig.status === 'open';
    const statusConfig = {
        open:        { label: 'Open',        color: '#0d9f6f', bg: '#0d9f6f15' },
        in_progress: { label: 'In Progress', color: '#0a85a0', bg: '#0a85a015' },
        completed:   { label: 'Completed',   color: '#1d9e75', bg: '#1d9e7515' },
        closed:      { label: 'Closed',      color: '#e53e3e', bg: '#e53e3e15' },
    };
    const status = statusConfig[gig.status] || statusConfig.open;

    const metaItems = [
        { icon: Clock,  label: 'Duration',   value: gig.duration },
        { icon: Award,  label: 'Experience', value: gig.experienceLevel },
        { icon: Users,  label: 'Posted by',  value: gig.clientId?.name || 'Anonymous' },
        { icon: Send,   label: 'Proposals',  value: gig.proposalsCount || 0 },
    ];

    const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1a2332] placeholder-gray-400 focus:outline-none focus:border-[#0d9f6f] transition-colors shadow-sm";
    const labelClass = "block text-sm font-semibold text-[#1a2332] mb-1.5";

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <button onClick={() => navigate('/browse-gigs')}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-[#0d9f6f] transition-colors mb-6">
                    <ArrowLeft size={16} /> Back to Gigs
                </button>

                {success && (
                    <div className="flex items-center gap-2.5 bg-[#0d9f6f]/10 border border-[#0d9f6f]/25 text-[#0d9f6f] p-3.5 rounded-xl text-sm font-semibold mb-4">
                        <CheckCircle size={16} className="flex-shrink-0" /> {success}
                    </div>
                )}

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
                    <div className="h-1 bg-gradient-to-r from-[#0d9f6f] to-[#0a85a0]" />
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ color: '#0d9f6f', background: '#0d9f6f15' }}>{gig.category}</span>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md capitalize" style={{ color: status.color, background: status.bg }}>{status.label}</span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-bold text-[#1a2332] leading-snug">{gig.title}</h1>
                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                    <Calendar size={12} />
                                    Posted {new Date(gig.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                                {gig.clientId?.averageRating > 0 && (
                                    <div className="mt-2">{renderStars(gig.clientId?.averageRating)}</div>
                                )}
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className="text-2xl font-bold text-[#0d9f6f]">
                                    {formatAmount(gig.budget?.min)} – {formatAmount(gig.budget?.max)}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Budget Range</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-[#1a2332] uppercase tracking-wide mb-3">Project Description</h3>
                            <p className="text-sm text-gray-500 whitespace-pre-wrap leading-relaxed">{gig.description}</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {metaItems.map(({ icon: Icon, label, value }) => (
                                <div key={label} className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                                    <div className="w-8 h-8 rounded-lg bg-[#0d9f6f]/10 flex items-center justify-center mb-2">
                                        <Icon size={15} className="text-[#0d9f6f]" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                                    <p className="text-sm font-bold text-[#1a2332] mt-0.5 truncate">{value}</p>
                                </div>
                            ))}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#1a2332] uppercase tracking-wide mb-3">Required Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {gig.skills?.map(skill => (
                                    <span key={skill} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-medium border border-gray-200">{skill}</span>
                                ))}
                            </div>
                        </div>
                        <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                            {isOwner ? (
                                <>
                                    <button onClick={() => navigate(`/gigs/${id}/proposals`)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-[#0d9f6f] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0a8560] transition-all">
                                        <Send size={15} /> View Proposals ({gig.proposalsCount || 0})
                                    </button>
                                    <button onClick={() => navigate(`/edit-gig/${id}`)}
                                        className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
                                        <Edit2 size={14} /> Edit Gig
                                    </button>
                                </>
                            ) : canApply ? (
                                showApplyForm ? (
                                    <button onClick={() => setShowApplyForm(false)}
                                        className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                                        Cancel Application
                                    </button>
                                ) : (
                                    <button onClick={() => setShowApplyForm(true)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-[#0d9f6f] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0a8560] transition-all">
                                        <Send size={15} /> Apply for this Gig <ChevronRight size={14} />
                                    </button>
                                )
                            ) : (
                                <div className="flex-1 text-center py-3 text-sm text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                                    {gig.status !== 'open' ? 'This gig is no longer accepting applications' : 'Log in as a freelancer to apply'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {showApplyForm && canApply && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-[#0a85a0] to-[#0d9f6f]" />
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                                <Send size={15} className="text-[#0d9f6f]" />
                                <h2 className="text-sm font-bold text-[#1a2332] uppercase tracking-wide">Submit Your Proposal</h2>
                            </div>
                            {error && (
                                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm mb-4">
                                    <AlertCircle size={16} className="flex-shrink-0" /> {error}
                                </div>
                            )}
                            <form onSubmit={handleSubmitProposal} className="space-y-4">
                                <div>
                                    <label className={labelClass}>Cover Letter <span className="text-red-400">*</span></label>
                                    <textarea name="coverLetter" value={proposal.coverLetter} onChange={handleProposalChange}
                                        rows="5" placeholder="Introduce yourself and explain why you're the best fit..."
                                        className={`${inputClass} resize-none`} required />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Bid Amount with validation */}
                                    <div>
                                        <label className={labelClass}>Bid Amount (INR) <span className="text-red-400">*</span></label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                            <input
                                                type="number"
                                                name="bidAmount"
                                                value={proposal.bidAmount}
                                                onChange={handleProposalChange}
                                                placeholder={`Max: ₹${gig.budget?.max}`}
                                                className={`${inputClass} pl-7`}
                                                required
                                                max={gig.budget?.max}
                                            />
                                        </div>
                                        {bidInINR && (
                                            <p className="text-xs text-[#0d9f6f] font-medium mt-1">≈ {bidInINR}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Budget: {formatAmount(gig.budget?.min)} – {formatAmount(gig.budget?.max)}
                                        </p>
                                        {proposal.bidAmount && parseInt(proposal.bidAmount) > gig.budget?.max && (
                                            <p className="text-xs text-red-500 mt-1">
                                                ⚠️ Bid cannot exceed ₹{gig.budget?.max}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className={labelClass}>Estimated Days <span className="text-red-400">*</span></label>
                                        <div className="relative">
                                            <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            <input type="number" name="estimatedDays" value={proposal.estimatedDays} onChange={handleProposalChange}
                                                placeholder="14" className={`${inputClass} pl-9`} required />
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" disabled={submitting || (proposal.bidAmount && parseInt(proposal.bidAmount) > gig.budget?.max)}
                                    className="w-full bg-[#0d9f6f] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#0a8560] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    {submitting ? <><Loader size={15} className="animate-spin" /> Submitting...</> : <><Send size={15} /> Submit Proposal</>}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default GigDetail;