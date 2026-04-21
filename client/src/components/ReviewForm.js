import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { FaStar } from 'react-icons/fa';
import { submitReview } from '../features/reviews/reviewSlice';
import { toast } from 'react-toastify';

const ReviewForm = ({ projectId }) => {
    const dispatch = useDispatch();
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }
        if (!comment.trim()) {
            toast.error('Please enter a comment');
            return;
        }

        try {
            await dispatch(submitReview({ projectId, rating, comment })).unwrap();
            toast.success('Review submitted successfully');
            setRating(0);
            setComment('');
        } catch (error) {
            toast.error(error?.message || 'Failed to submit review');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Submit a Review</h3>
            
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Rating
                </label>
                <div className="flex">
                    {[...Array(5)].map((_, index) => {
                        const ratingValue = index + 1;
                        return (
                            <button
                                type="button"
                                key={index}
                                className={`text-2xl focus:outline-none transition-colors duration-200 ${
                                    ratingValue <= (hover || rating)
                                        ? 'text-yellow-400'
                                        : 'text-gray-300'
                                }`}
                                onClick={() => setRating(ratingValue)}
                                onMouseEnter={() => setHover(ratingValue)}
                                onMouseLeave={() => setHover(rating)}
                            >
                                <FaStar />
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mb-4">
                <label
                    htmlFor="comment"
                    className="block text-gray-700 text-sm font-bold mb-2"
                >
                    Comment
                </label>
                <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows="4"
                    placeholder="Share your experience..."
                ></textarea>
            </div>

            <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
                Submit Review
            </button>
        </form>
    );
};

export default ReviewForm; 