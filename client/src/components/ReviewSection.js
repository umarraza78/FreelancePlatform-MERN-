import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaStar } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { getProjectReviews, createReview, reset } from '../features/reviews/reviewSlice';

const ReviewSection = ({ projectId }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');

    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { reviews, isLoading, error, success } = useSelector((state) => state.reviews);

    useEffect(() => {
        dispatch(getProjectReviews(projectId));
    }, [dispatch, projectId]);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
        if (success) {
            setRating(0);
            setComment('');
            dispatch(reset());
        }
    }, [error, success, dispatch]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!rating) {
            toast.error('Please select a rating');
            return;
        }
        if (!comment.trim()) {
            toast.error('Please enter a comment');
            return;
        }
        dispatch(createReview({ projectId, rating, comment }));
    };

    if (isLoading) {
        return <div className="text-center py-4">Loading reviews...</div>;
    }

    return (
        <div className="space-y-6">
            {user && (
                <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, index) => {
                            const ratingValue = index + 1;
                            return (
                                <label key={index}>
                                    <input
                                        type="radio"
                                        name="rating"
                                        className="hidden"
                                        value={ratingValue}
                                        onClick={() => setRating(ratingValue)}
                                    />
                                    <FaStar
                                        className="cursor-pointer transition-colors"
                                        color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                                        size={24}
                                        onMouseEnter={() => setHover(ratingValue)}
                                        onMouseLeave={() => setHover(0)}
                                    />
                                </label>
                            );
                        })}
                    </div>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Write your review..."
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            )}

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Reviews</h3>
                {reviews.length === 0 ? (
                    <p className="text-gray-500">No reviews yet.</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review._id} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">{review.reviewer.name}</span>
                                    <div className="flex">
                                        {[...Array(5)].map((_, index) => (
                                            <FaStar
                                                key={index}
                                                color={index < review.rating ? "#ffc107" : "#e4e5e9"}
                                                size={16}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {format(new Date(review.createdAt), 'MMM d, yyyy')}
                                </span>
                            </div>
                            <p className="text-gray-700">{review.comment}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewSection; 