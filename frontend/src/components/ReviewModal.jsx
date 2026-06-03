import { useState } from 'react';
import axios from 'axios';
import { X, Star } from 'lucide-react';

function ReviewModal({ gig, freelancer, onClose, onSuccess }) {
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Guard: if freelancer is missing, show an error instead of crashing
    if (!freelancer?._id) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Rate Your Experience</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                        Could not find the freelancer for this gig. Please try again.
                    </div>
                    <button
                        onClick={onClose}
                        className="mt-4 w-full border border-gray-200 text-gray-500 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!review.trim()) {
            setError('Please write a review before submitting.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/reviews', {
                gigId: gig._id,
                freelancerId: freelancer._id,
                rating,
                review: review.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Rate Your Experience</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="text-center mb-4">
                    <p className="text-gray-600 mb-2">
                        How was your experience with <strong>{freelancer.name}</strong>?
                    </p>

                    {/* Star Rating */}
                    <div className="flex justify-center gap-2 my-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <Star
                                    size={36}
                                    className={`${
                                        (hoverRating || rating) >= star
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                    } transition-colors`}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="text-sm text-gray-400">
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hoverRating || rating]}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Write your review
                        </label>
                        <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            rows="4"
                            maxLength={1000}
                            placeholder="Share your experience working with this freelancer..."
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0d9f6f] resize-none"
                            required
                        />
                        <p className="text-xs text-gray-400 text-right mt-1">{review.length}/1000</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border border-gray-200 text-gray-500 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !review.trim()}
                            className="flex-1 bg-[#0d9f6f] text-white py-2.5 rounded-lg font-semibold hover:bg-[#0a8560] disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ReviewModal;