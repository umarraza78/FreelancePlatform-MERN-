import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getFreelancerReviews } from '../features/reviews/reviewSlice';

export const FreelancerRating = ({ freelancerId }) => {
  const dispatch = useDispatch();
  const { reviews, averageRating, totalReviews, isLoading, isError, message } = useSelector((state) => state.reviews);

  useEffect(() => {
    if (freelancerId) {
      dispatch(getFreelancerReviews(freelancerId));
    }
  }, [dispatch, freelancerId]);

  if (isLoading) {
    return (
      <div className="flex items-center">
        <span className="text-gray-400">Loading ratings...</span>
      </div>
    );
  }

  if (isError) {
    console.error('Error loading reviews:', message);
    return (
      <div className="flex items-center">
        <span className="text-yellow-400 text-xl mr-1">★</span>
        <span>N/A</span>
        <span className="text-sm text-red-500 ml-2">
          (Error: {message})
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <span className="text-yellow-400 text-xl mr-1">★</span>
      <span>{averageRating || 'N/A'}</span>
      <span className="text-sm text-gray-500 ml-2">
        ({totalReviews || 0} {totalReviews === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
}; 