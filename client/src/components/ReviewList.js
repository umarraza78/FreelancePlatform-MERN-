import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { respondToReview } from '../features/reviews/reviewSlice';
import { toast } from 'react-toastify';

const ReviewList = ({ reviews, freelancerId }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [responseText, setResponseText] = React.useState('');
    const [activeResponseId, setActiveResponseId] = React.useState(null);

    const handleResponse = async (reviewId) => {
        try {
            await dispatch(respondToReview({
                reviewId,
                response: responseText
            })).unwrap();
            setResponseText('');
            setActiveResponseId(null);
            toast.success('Response submitted successfully!');
        } catch (err) {
            toast.error(err.message || 'Failed to submit response');
        }
    };

    const calculateAverageRating = () => {
        if (!reviews.length) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / reviews.length).toFixed(1);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl font-bold">{calculateAverageRating()}</div>
                <div>
                    <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className="text-yellow-400 text-xl">
                                {star <= calculateAverageRating() ? '★' : '☆'}
                            </span>
                        ))}
                    </div>
                    <div className="text-gray-600">
                        Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {reviews.map((review) => (
                <div key={review._id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{review.client.name}</span>
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex text-yellow-400 mt-1">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i}>
                                        {i < review.rating ? '★' : '☆'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <p className="text-gray-700 mb-4">{review.comment}</p>

                    {review.response && (
                        <div className="ml-8 mt-4 p-4 bg-gray-50 rounded-lg">
                            <p className="font-semibold mb-2">Freelancer's Response:</p>
                            <p className="text-gray-700">{review.response}</p>
                        </div>
                    )}

                    {!review.response && user?._id === freelancerId && (
                        <div className="mt-4">
                            {activeResponseId === review._id ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={responseText}
                                        onChange={(e) => setResponseText(e.target.value)}
                                        className="w-full p-2 border rounded"
                                        placeholder="Write your response..."
                                        rows="3"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleResponse(review._id)}
                                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                        >
                                            Submit Response
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActiveResponseId(null);
                                                setResponseText('');
                                            }}
                                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setActiveResponseId(review._id)}
                                    className="text-blue-500 hover:text-blue-600"
                                >
                                    Respond to Review
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ReviewList; 