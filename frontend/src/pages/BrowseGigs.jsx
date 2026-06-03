import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Search, Clock, Briefcase, X, SlidersHorizontal, Tag, Star } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

function BrowseGigs() {
    const { formatAmount } = useCurrency();
    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ category: 'all', search: '', minBudget: '', maxBudget: '' });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => { fetchGigs(); }, [filters]);

    const fetchGigs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.category !== 'all') params.append('category', filters.category);
            if (filters.search) params.append('search', filters.search);
            if (filters.minBudget) params.append('minBudget', filters.minBudget);
            if (filters.maxBudget) params.append('maxBudget', filters.maxBudget);
            const res = await axios.get(`http://localhost:5000/api/gigs?${params}`);
            setGigs(res.data.gigs);
        } catch (error) {
            console.error('Error fetching gigs:', error);
        }
        setLoading(false);
    };

    const clearFilters = () => setFilters({ category: 'all', search: '', minBudget: '', maxBudget: '' });
    const hasActiveFilters = filters.category !== 'all' || filters.search || filters.minBudget || filters.maxBudget;
    const categories = ['all', 'Web Development', 'Mobile Development', 'AI/ML', 'Design', 'Writing', 'Marketing', 'Other'];

    // Helper to render stars
    const renderStars = (rating) => {
        if (!rating || rating === 0) return null;
        return (
            <div className="flex items-center gap-1">
                <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            size={12}
                            className={star <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                    ))}
                </div>
                <span className="text-xs font-semibold text-gray-700">{rating}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2332]">Browse Gigs</h1>
                        <p className="text-gray-500 mt-1 text-sm">Find your next opportunity</p>
                    </div>
                    {hasActiveFilters && (
                        <button onClick={clearFilters}
                            className="flex items-center gap-1.5 text-sm font-semibold text-[#0d9f6f] border border-[#0d9f6f] px-4 py-1.5 rounded-lg hover:bg-[#0d9f6f]/5 transition-colors self-start sm:self-auto">
                            <X size={14} /> Clear Filters
                        </button>
                    )}
                </div>

                <div className="mb-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Search by title, description, or skills..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1a2332] placeholder-gray-400 focus:outline-none focus:border-[#0d9f6f] shadow-sm transition-colors" />
                    </div>
                </div>

                <button onClick={() => setShowFilters(!showFilters)}
                    className="md:hidden flex items-center gap-2 mb-4 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-[#1a2332]">
                    <SlidersHorizontal size={16} className="text-[#0d9f6f]" />
                    Filters
                    {hasActiveFilters && <span className="ml-1 w-2 h-2 rounded-full bg-[#0d9f6f]" />}
                </button>

                <div className={`${showFilters ? 'flex' : 'hidden'} md:flex flex-wrap gap-3 mb-6`}>
                    <div className="relative">
                        <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0d9f6f] pointer-events-none" />
                        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a2332] focus:outline-none focus:border-[#0d9f6f] shadow-sm appearance-none cursor-pointer">
                            {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="number" placeholder="Min Budget" value={filters.minBudget}
                            onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
                            className="w-28 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a2332] placeholder-gray-400 focus:outline-none focus:border-[#0d9f6f] shadow-sm" />
                        <span className="text-gray-400 text-sm">–</span>
                        <input type="number" placeholder="Max Budget" value={filters.maxBudget}
                            onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
                            className="w-28 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a2332] placeholder-gray-400 focus:outline-none focus:border-[#0d9f6f] shadow-sm" />
                    </div>
                </div>

                <div className="mb-4 text-sm text-gray-400 font-medium">
                    {loading ? 'Searching...' : `${gigs.length} gig${gigs.length !== 1 ? 's' : ''} found`}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#0d9f6f]" />
                    </div>
                ) : gigs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-[#0d9f6f]/10 flex items-center justify-center mb-4">
                            <Briefcase size={28} className="text-[#0d9f6f]" />
                        </div>
                        <h3 className="text-base font-bold text-[#1a2332]">No gigs found</h3>
                        <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {gigs.map((gig) => (
                            <Link key={gig._id} to={`/gigs/${gig._id}`}
                                className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#0d9f6f]/30 transition-all duration-200 p-5 block">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs font-semibold text-[#0d9f6f] bg-[#0d9f6f]/10 px-2.5 py-1 rounded-md">
                                        {gig.category}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(gig.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <h2 className="text-base font-bold text-[#1a2332] mb-2 line-clamp-2 group-hover:text-[#0d9f6f] transition-colors">
                                    {gig.title}
                                </h2>
                                <p className="text-gray-500 text-sm mb-4 line-clamp-3 leading-relaxed">{gig.description}</p>
                                
                                {/* ✅ Freelancer Rating - if available */}
                                {gig.clientId?.averageRating > 0 && (
                                    <div className="mb-3">
                                        {renderStars(gig.clientId?.averageRating)}
                                        <span className="text-xs text-gray-400 ml-1">
                                            ({gig.clientId?.totalReviews || 0} reviews)
                                        </span>
                                    </div>
                                )}

                                <div className="border-t border-gray-100 pt-3 mb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="font-bold text-[#0d9f6f] text-sm">
                                            {formatAmount(gig.budget.min)} – {formatAmount(gig.budget.max)}
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                                            <Clock size={13} /><span>{gig.duration}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {gig.skills.slice(0, 3).map(skill => (
                                        <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">{skill}</span>
                                    ))}
                                    {gig.skills.length > 3 && (
                                        <span className="text-xs text-gray-400 self-center">+{gig.skills.length - 3} more</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default BrowseGigs;