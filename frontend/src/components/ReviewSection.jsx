import { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Calendar } from 'lucide-react';

function ReviewsSection({ freelancerId }) {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({
        averageRating: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchReviews(1);
    }, [freelancerId]);

    const fetchReviews = async (pageNum) => {
        setLoading(true);
        try {
            const res = await axios.get(
                `http://localhost:5000/api/reviews/freelancer/${freelancerId}?page=${pageNum}&limit=10`
            );
            setReviews(res.data.reviews);
            setStats({
                averageRating: res.data.averageRating,
                total: res.data.total,
                distribution: res.data.distribution
            });
            setPage(res.data.currentPage);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
        setLoading(false);
    };

    const renderStars = (rating, size = 14) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={size}
                    className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-[#0d9f6f]" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Reviews & Ratings</h3>

            {/* Rating Summary */}
            <div className="flex items-center gap-6 mb-6 pb-4 border-b border-gray-100">
                <div className="text-center">
                    <div className="text-4xl font-bold text-gray-800">
                        {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                    </div>
                    <div className="flex justify-center mt-1">
                        {renderStars(Math.round(stats.averageRating), 16)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                        {stats.total} {stats.total === 1 ? 'review' : 'reviews'}
                    </div>
                </div>

                {/* Distribution Bars */}
                <div className="flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = stats.distribution[star] || 0;
                        const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                        return (
                            <div key={star} className="flex items-center gap-2 text-sm">
                                <span className="w-8 text-gray-600 text-xs">{star} ★</span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="w-6 text-gray-400 text-xs text-right">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <Star size={48} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No reviews yet</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review._id} className="border-b border-gray-100 pb-4 last:border-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {renderStars(review.rating)}
                                            <span className="text-sm font-semibold text-gray-800">
                                                {review.clientId?.name || 'Anonymous'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                                            <Calendar size={11} />
                                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                month: 'short', day: 'numeric', year: 'numeric'
                                            })}
                                            {review.gigId?.title && (
                                                <span className="text-gray-300">·</span>
                                            )}
                                            {review.gigId?.title && (
                                                <span className="text-gray-400 truncate max-w-[160px]">
                                                    {review.gigId.title}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm mt-2 leading-relaxed">{review.review}</p>
                                {review.response && (
                                    <div className="mt-3 pl-4 border-l-2 border-[#0d9f6f] bg-[#0d9f6f]/5 rounded-r-lg py-2 pr-3">
                                        <p className="text-xs text-[#0d9f6f] font-semibold mb-1">Response from freelancer</p>
                                        <p className="text-sm text-gray-600">{review.response}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => fetchReviews(page - 1)}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-xs text-gray-400">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => fetchReviews(page + 1)}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default ReviewsSection;import { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Calendar } from 'lucide-react';

function ReviewsSection({ freelancerId }) {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({
        averageRating: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchReviews(1);
    }, [freelancerId]);

    const fetchReviews = async (pageNum) => {
        setLoading(true);
        try {
            const res = await axios.get(
                `http://localhost:5000/api/reviews/freelancer/${freelancerId}?page=${pageNum}&limit=10`
            );
            setReviews(res.data.reviews);
            setStats({
                averageRating: res.data.averageRating,
                total: res.data.total,
                distribution: res.data.distribution
            });
            setPage(res.data.currentPage);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
        setLoading(false);
    };

    const renderStars = (rating, size = 14) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={size}
                    className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-[#0d9f6f]" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Reviews & Ratings</h3>

            {/* Rating Summary */}
            <div className="flex items-center gap-6 mb-6 pb-4 border-b border-gray-100">
                <div className="text-center">
                    <div className="text-4xl font-bold text-gray-800">
                        {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                    </div>
                    <div className="flex justify-center mt-1">
                        {renderStars(Math.round(stats.averageRating), 16)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                        {stats.total} {stats.total === 1 ? 'review' : 'reviews'}
                    </div>
                </div>

                {/* Distribution Bars */}
                <div className="flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = stats.distribution[star] || 0;
                        const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                        return (
                            <div key={star} className="flex items-center gap-2 text-sm">
                                <span className="w-8 text-gray-600 text-xs">{star} ★</span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="w-6 text-gray-400 text-xs text-right">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <Star size={48} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No reviews yet</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review._id} className="border-b border-gray-100 pb-4 last:border-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {renderStars(review.rating)}
                                            <span className="text-sm font-semibold text-gray-800">
                                                {review.clientId?.name || 'Anonymous'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                                            <Calendar size={11} />
                                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                month: 'short', day: 'numeric', year: 'numeric'
                                            })}
                                            {review.gigId?.title && (
                                                <span className="text-gray-300">·</span>
                                            )}
                                            {review.gigId?.title && (
                                                <span className="text-gray-400 truncate max-w-[160px]">
                                                    {review.gigId.title}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm mt-2 leading-relaxed">{review.review}</p>
                                {review.response && (
                                    <div className="mt-3 pl-4 border-l-2 border-[#0d9f6f] bg-[#0d9f6f]/5 rounded-r-lg py-2 pr-3">
                                        <p className="text-xs text-[#0d9f6f] font-semibold mb-1">Response from freelancer</p>
                                        <p className="text-sm text-gray-600">{review.response}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => fetchReviews(page - 1)}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-xs text-gray-400">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => fetchReviews(page + 1)}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default ReviewsSection;