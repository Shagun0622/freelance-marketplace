import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    Briefcase, Plus, DollarSign, Clock, Tag, Users,
    Trash2, Edit2, Eye, AlertCircle, Star,
    CheckCircle, XCircle, ChevronRight, MoreVertical,
    Send, TrendingUp, Loader
} from 'lucide-react';
import ReviewModal from '../components/ReviewModal';

function MyGigs() {
    const { user } = useAuth();
    const { formatAmount } = useCurrency();
    const navigate = useNavigate();

    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);

    // Review modal state
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedGig, setSelectedGig] = useState(null);       // gig object
    const [selectedFreelancer, setSelectedFreelancer] = useState(null); // resolved freelancer
    const [reviewLoading, setReviewLoading] = useState(null);   // gigId being loaded
    const [reviewedGigs, setReviewedGigs] = useState(new Set()); // gigIds already reviewed

    useEffect(() => { fetchMyGigs(); }, []);

    useEffect(() => {
        const handleClick = () => setActiveMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const fetchMyGigs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/gigs/my-gigs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGigs(res.data.gigs);

            // Check which completed gigs already have a review from this client
            const completedGigs = res.data.gigs.filter(g => g.status === 'completed');
            if (completedGigs.length > 0) {
                await checkExistingReviews(completedGigs, token);
            }
        } catch (err) {
            setError('Failed to load your gigs.');
        }
        setLoading(false);
    };

    // For each completed gig, check if a review already exists
    const checkExistingReviews = async (completedGigs, token) => {
        const reviewed = new Set();
        await Promise.all(
            completedGigs.map(async (gig) => {
                try {
                    const res = await axios.get(
                        `http://localhost:5000/api/reviews/gig/${gig._id}`
                    );
                    if (res.data.reviews?.length > 0) {
                        reviewed.add(gig._id);
                    }
                } catch {
                    // Ignore errors — just don't mark as reviewed
                }
            })
        );
        setReviewedGigs(reviewed);
    };

    // Fetch the accepted proposal to get the freelancer, then open modal
    const handleOpenReviewModal = async (gig) => {
        setReviewLoading(gig._id);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
                `http://localhost:5000/api/proposals/gig/${gig._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const accepted = res.data.proposals?.find(p => p.status === 'accepted');
            if (!accepted?.freelancerId) {
                setError('No accepted freelancer found for this gig.');
                return;
            }
            setSelectedGig(gig);
            setSelectedFreelancer(accepted.freelancerId); // populated User object
            setShowReviewModal(true);
        } catch {
            setError('Failed to load freelancer info. Please try again.');
        } finally {
            setReviewLoading(null);
        }
    };

    const handleDelete = async (gigId) => {
        setDeleting(true);
        try {
            await axios.delete(`http://localhost:5000/api/gigs/${gigId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setGigs(gigs.filter(g => g._id !== gigId));
            setDeleteConfirm(null);
        } catch (err) {
            setError('Failed to delete gig.');
        }
        setDeleting(false);
    };

    const statusConfig = {
        open:        { label: 'Open',        icon: CheckCircle, color: '#0d9f6f', bg: '#0d9f6f15' },
        in_progress: { label: 'In Progress', icon: Users,       color: '#0a85a0', bg: '#0a85a015' },
        completed:   { label: 'Completed',   icon: CheckCircle, color: '#1d9e75', bg: '#1d9e7515' },
        cancelled:   { label: 'Cancelled',   icon: XCircle,     color: '#e53e3e', bg: '#e53e3e15' },
    };

    const totalProposals  = gigs.reduce((sum, g) => sum + (g.proposalsCount || 0), 0);
    const activeGigs      = gigs.filter(g => g.status === 'open').length;
    const totalBudgetMax  = gigs.reduce((sum, g) => sum + (g.budget?.max || 0), 0);

    const summaryStats = [
        { label: 'Total Gigs',      value: gigs.length,               icon: Briefcase,  color: '#0d9f6f', bg: '#0d9f6f15' },
        { label: 'Active Gigs',     value: activeGigs,                icon: TrendingUp, color: '#0a85a0', bg: '#0a85a015' },
        { label: 'Total Proposals', value: totalProposals,            icon: Send,       color: '#f09f27', bg: '#f09f2715' },
        { label: 'Max Budget Pool', value: formatAmount(totalBudgetMax), icon: DollarSign, color: '#8a2be2', bg: '#8a2be215' },
    ];

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0d9f6f]/10 flex items-center justify-center flex-shrink-0">
                            <Briefcase size={20} className="text-[#0d9f6f]" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2332]">My Gigs</h1>
                            <p className="text-gray-400 text-sm mt-0.5">Manage your posted projects</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/post-gig')}
                        className="flex items-center gap-2 bg-[#0d9f6f] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0a8560] active:scale-[0.98] transition-all shadow-sm self-start sm:self-auto"
                    >
                        <Plus size={16} /> Post New Gig
                    </button>
                </div>

                {error && (
                    <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm mb-4">
                        <AlertCircle size={16} className="flex-shrink-0" /> {error}
                        <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
                            <XCircle size={14} />
                        </button>
                    </div>
                )}

                {!loading && gigs.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        {summaryStats.map((stat) => (
                            <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                                        <stat.icon size={17} style={{ color: stat.color }} />
                                    </div>
                                </div>
                                <p className="text-xl sm:text-2xl font-bold text-[#1a2332]">{stat.value}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#0d9f6f]" />
                    </div>

                ) : gigs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm text-center px-4">
                        <div className="w-16 h-16 rounded-full bg-[#0d9f6f]/10 flex items-center justify-center mb-4">
                            <Briefcase size={28} className="text-[#0d9f6f]" />
                        </div>
                        <h3 className="text-base font-bold text-[#1a2332]">No gigs posted yet</h3>
                        <p className="text-gray-400 text-sm mt-1 mb-5 max-w-xs">
                            Post your first gig and start receiving proposals from talented freelancers.
                        </p>
                        <button
                            onClick={() => navigate('/post-gig')}
                            className="flex items-center gap-2 bg-[#0d9f6f] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0a8560] transition-colors"
                        >
                            <Plus size={15} /> Post Your First Gig
                        </button>
                    </div>

                ) : (
                    <div className="space-y-4">
                        {gigs.map((gig) => {
                            const status = statusConfig[gig.status] || statusConfig.open;
                            const StatusIcon = status.icon;
                            const alreadyReviewed = reviewedGigs.has(gig._id);

                            return (
                                <div
                                    key={gig._id}
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#0d9f6f]/20 transition-all duration-200"
                                >
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md"
                                                    style={{ color: status.color, background: status.bg }}
                                                >
                                                    <StatusIcon size={11} /> {status.label}
                                                </span>
                                                {(gig.proposalsCount || 0) > 0 && (
                                                    <span className="flex items-center gap-1 text-xs font-medium text-[#0a85a0] bg-[#0a85a0]/10 px-2 py-1 rounded-md">
                                                        <Send size={10} /> {gig.proposalsCount} proposal{gig.proposalsCount !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400 hidden sm:block">
                                                    {new Date(gig.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === gig._id ? null : gig._id); }}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#1a2332] hover:bg-gray-100 transition-colors"
                                                    >
                                                        <MoreVertical size={16} />
                                                    </button>
                                                    {activeMenu === gig._id && (
                                                        <div
                                                            className="absolute right-0 top-9 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1.5 w-40"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <Link
                                                                to={`/gigs/${gig._id}`}
                                                                className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#1a2332] hover:bg-gray-50 transition-colors"
                                                            >
                                                                <Eye size={14} className="text-gray-400" /> View Gig
                                                            </Link>
                                                            <button
                                                                onClick={() => { navigate(`/edit-gig/${gig._id}`); setActiveMenu(null); }}
                                                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#1a2332] hover:bg-gray-50 transition-colors"
                                                            >
                                                                <Edit2 size={14} className="text-gray-400" /> Edit Gig
                                                            </button>
                                                            <div className="border-t border-gray-100 my-1" />
                                                            <button
                                                                onClick={() => { setDeleteConfirm(gig._id); setActiveMenu(null); }}
                                                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                                            >
                                                                <Trash2 size={14} /> Delete Gig
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <h2 className="text-base font-bold text-[#1a2332] mb-1.5 leading-snug">{gig.title}</h2>
                                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">{gig.description}</p>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className="flex items-center gap-1.5 text-xs font-medium text-[#0d9f6f] bg-[#0d9f6f]/8 border border-[#0d9f6f]/15 px-2.5 py-1 rounded-md">
                                                <Tag size={11} /> {gig.category}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
                                                <Clock size={11} /> {gig.duration}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
                                                <DollarSign size={11} />
                                                {formatAmount(gig.budget?.min)} – {formatAmount(gig.budget?.max)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <div className="flex flex-wrap gap-1.5">
                                                {gig.skills?.slice(0, 4).map(skill => (
                                                    <span key={skill} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium">{skill}</span>
                                                ))}
                                                {gig.skills?.length > 4 && (
                                                    <span className="text-xs text-gray-400">+{gig.skills.length - 4}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    to={`/gigs/${gig._id}`}
                                                    className="flex items-center gap-1 text-xs font-semibold text-[#0d9f6f] hover:underline flex-shrink-0"
                                                >
                                                    View Proposals <ChevronRight size={13} />
                                                </Link>

                                                {/* Leave Review — only for completed gigs not yet reviewed */}
                                                {gig.status === 'completed' && !alreadyReviewed && (
                                                    <button
                                                        onClick={() => handleOpenReviewModal(gig)}
                                                        disabled={reviewLoading === gig._id}
                                                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-yellow-500 text-white hover:bg-yellow-600 transition-all disabled:opacity-50"
                                                    >
                                                        {reviewLoading === gig._id
                                                            ? <Loader size={12} className="animate-spin" />
                                                            : <Star size={13} />
                                                        }
                                                        Leave Review
                                                    </button>
                                                )}

                                                {/* Already reviewed badge */}
                                                {gig.status === 'completed' && alreadyReviewed && (
                                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-50 text-yellow-600 border border-yellow-200">
                                                        <Star size={12} className="fill-yellow-400 text-yellow-400" /> Reviewed
                                                    </span>
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

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                    onClick={() => setDeleteConfirm(null)}
                >
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={22} className="text-red-500" />
                        </div>
                        <h3 className="text-base font-bold text-[#1a2332] text-center mb-1">Delete this gig?</h3>
                        <p className="text-sm text-gray-400 text-center mb-5">
                            This action cannot be undone. All proposals for this gig will also be removed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                disabled={deleting}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {deleting
                                    ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    : <><Trash2 size={14} /> Delete</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {showReviewModal && selectedGig && selectedFreelancer && (
                <ReviewModal
                    gig={selectedGig}
                    freelancer={selectedFreelancer}
                    onClose={() => {
                        setShowReviewModal(false);
                        setSelectedGig(null);
                        setSelectedFreelancer(null);
                    }}
                    onSuccess={() => {
                        setShowReviewModal(false);
                        setSelectedGig(null);
                        setSelectedFreelancer(null);
                        // Mark this gig as reviewed locally (no full refetch needed)
                        setReviewedGigs(prev => new Set([...prev, selectedGig._id]));
                    }}
                />
            )}
        </div>
    );
}

export default MyGigs;