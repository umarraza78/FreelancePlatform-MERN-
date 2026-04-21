import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFreelancerStats } from '../features/freelancers/freelancerSlice';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { stats, isLoading, isError, message } = useSelector((state) => state.freelancer);

  useEffect(() => {
    if (!user) {
      console.log('No user found, redirecting to login');
      navigate('/login');
      return;
    }

    console.log('Current user:', {
      id: user._id,
      role: user.role,
      name: user.name
    });

    if (user.role === 'freelancer') {
      console.log('Fetching freelancer stats for user:', user._id);
      dispatch(fetchFreelancerStats(user._id));
    }
  }, [user, navigate, dispatch]);

  useEffect(() => {
    console.log('Stats updated:', {
      stats,
      isLoading,
      isError,
      message
    });
  }, [stats, isLoading, isError, message]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}</h1>
        <p className="text-gray-600">Manage your freelancing work and track your progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm">Active Bids</h2>
              <p className="text-2xl font-semibold">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm">Won Projects</h2>
              <p className="text-2xl font-semibold">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm">Completed</h2>
              <p className="text-2xl font-semibold">{stats.completedProjects || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm">Rating</h2>
              <p className="text-2xl font-semibold">
                {isLoading ? (
                  'Loading...'
                ) : isError ? (
                  <span className="text-red-500">Error: {message}</span>
                ) : stats?.rating ? (
                  <span>
                    {Number(stats.rating).toFixed(1)} 
                    <span className="text-sm text-gray-500 ml-1">
                      ({stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'})
                    </span>
                  </span>
                ) : (
                  'N/A'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">Find Projects</h2>
          <p className="text-blue-600 mb-4">Browse available projects and submit bids</p>
          <button
            onClick={() => navigate('/projects')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Browse Projects
          </button>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-green-700 mb-4">Update Skills</h2>
          <p className="text-green-600 mb-4">Manage your skills and expertise</p>
          <button
            onClick={() => navigate('/profile')}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
          >
            Update Profile
          </button>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-purple-700 mb-4">Portfolio</h2>
          <p className="text-purple-600 mb-4">Showcase your work and achievements</p>
          <button
            onClick={() => navigate('/portfolio')}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
          >
            View Portfolio
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 