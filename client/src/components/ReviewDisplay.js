import React from 'react';
import { format } from 'date-fns';
import { FaStar } from 'react-icons/fa';

const ReviewDisplay = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center text-gray-500 my-4">
        No reviews yet. Be the first to review!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Reviews</h3>
      {reviews.map((review) => (
        <div key={review._id} className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="flex">
                {[...Array(5)].map((_, index) => (
                  <FaStar
                    key={index}
                    className={`h-5 w-5 ${
                      index < review.rating
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {review.rating}/5
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {format(new Date(review.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
          <p className="text-gray-700">{review.comment}</p>
          <div className="mt-2 text-sm text-gray-500">
            By: {review.user.name}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewDisplay; 