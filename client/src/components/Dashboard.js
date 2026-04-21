import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { getProjects } from '../features/projects/projectSlice';
import { getCurrentUser } from '../features/auth/authSlice';
import { FaProjectDiagram, FaUser, FaFileAlt, FaChartLine, FaEnvelope, FaStar } from 'react-icons/fa';

const Dashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Get auth state
    const { user, token, isLoading: authLoading, isError: authError } = useSelector((state) => state.auth);
    
    // Get projects state
    const { projects, isLoading: projectsLoading } = useSelector((state) => state.projects);

    useEffect(() => {
        const initializeDashboard = async () => {
            try {
                // Check for token
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                // Fetch current user data if needed
                if (!user) {
                    await dispatch(getCurrentUser()).unwrap();
                }

                // Fetch projects
                await dispatch(getProjects()).unwrap();
            } catch (error) {
                console.error('Error initializing dashboard:', error);
                // Check if error is an unauthorized error
                const errorMessage = error?.message || '';
                const isUnauthorized = 
                    errorMessage.includes('401') || 
                    errorMessage.includes('unauthorized') ||
                    error?.response?.status === 401;
                
                if (isUnauthorized) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                }
            }
        };

        initializeDashboard();
    }, [dispatch, navigate]);

    // Show loading state while fetching initial data
    if ((authLoading && !user) || (projectsLoading && !projects?.length)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Show error state if authentication failed
    if (authError || !user || !token) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h2>
                    <Link to="/login" className="text-blue-500 hover:text-blue-700">
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    // Calculate statistics
    const totalProjects = projects?.length || 0;
    const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
    const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
    const totalBids = projects?.reduce((acc, project) => acc + (project.bids?.length || 0), 0) || 0;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
                <p className="text-gray-600">Here's an overview of your {user.role === 'client' ? 'projects' : user.role === 'freelancer' ? 'work' : 'platform'}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <FaProjectDiagram className="text-blue-500 text-2xl mr-4" />
                        <div>
                            <h3 className="text-lg font-semibold">Total Projects</h3>
                            <p className="text-2xl font-bold">{totalProjects}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <FaChartLine className="text-green-500 text-2xl mr-4" />
                        <div>
                            <h3 className="text-lg font-semibold">Active Projects</h3>
                            <p className="text-2xl font-bold">{activeProjects}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <FaFileAlt className="text-purple-500 text-2xl mr-4" />
                        <div>
                            <h3 className="text-lg font-semibold">Completed Projects</h3>
                            <p className="text-2xl font-bold">{completedProjects}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <FaUser className="text-orange-500 text-2xl mr-4" />
                        <div>
                            <h3 className="text-lg font-semibold">Total Bids</h3>
                            <p className="text-2xl font-bold">{totalBids}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Projects Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Recent Projects</h2>
                    {user.role === 'client' && (
                        <Link
                            to="/projects/new"
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                        >
                            Create New Project
                        </Link>
                    )}
                </div>

                {!projects || projects.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600">No projects found</p>
                        {user.role === 'client' && (
                            <Link
                                to="/projects/new"
                                className="text-blue-500 hover:text-blue-700 mt-2 inline-block"
                            >
                                Create your first project
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Deadline
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bids
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {projects.slice(0, 5).map((project) => (
                                    <tr key={project._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link
                                                to={`/projects/${project._id}`}
                                                className="text-blue-500 hover:text-blue-700"
                                            >
                                                {project.title}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    project.status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : project.status === 'completed'
                                                        ? 'bg-gray-100 text-gray-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}
                                            >
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(project.deadline).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {project.bids?.length || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link
                                                to={`/projects/${project._id}`}
                                                className="text-blue-500 hover:text-blue-700 mr-3"
                                            >
                                                View
                                            </Link>
                                            {user.role === 'client' && (
                                                <Link
                                                    to={`/projects/${project._id}/edit`}
                                                    className="text-green-500 hover:text-green-700"
                                                >
                                                    Edit
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Messages and Reviews Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Messages</h2>
                        <Link to="/messages" className="text-blue-500 hover:text-blue-700">
                            <FaEnvelope className="text-xl" />
                        </Link>
                    </div>
                    <div className="text-gray-600">
                        Check your messages and communicate with {user.role === 'client' ? 'freelancers' : 'clients'}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Reviews</h2>
                        <Link to="/reviews" className="text-blue-500 hover:text-blue-700">
                            <FaStar className="text-xl" />
                        </Link>
                    </div>
                    <div className="text-gray-600">
                        View and manage your {user.role === 'client' ? 'given' : 'received'} reviews
                    </div>
                </div>
            </div>

            {/* Role-specific Sections */}
            {user.role === 'admin' && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
                        <Link
                            to="/analytics"
                            className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600"
                        >
                            View Analytics
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-indigo-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-indigo-700">Platform Statistics</h3>
                            <p className="text-indigo-600 mt-2">Monitor key metrics and performance indicators</p>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-purple-700">User Management</h3>
                            <p className="text-purple-600 mt-2">Manage users and handle platform operations</p>
                        </div>
                    </div>
                </div>
            )}

            {user.role === 'freelancer' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">Freelancer Profile</h2>
                            <p className="text-gray-600 mt-2">Manage your professional presence</p>
                        </div>
                        <Link
                            to={`/freelancers/${user._id}`}
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                        >
                            View Profile
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-blue-700">Skills & Experience</h3>
                            <p className="text-blue-600 mt-2">Update your skills and showcase your experience</p>
                        </div>
                        <div className="bg-green-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-green-700">Portfolio</h3>
                            <p className="text-green-600 mt-2">Showcase your best work and achievements</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard; 