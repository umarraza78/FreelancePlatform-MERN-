import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../features/auth/authSlice';
import { getProjects, completeProject } from '../features/projects/projectSlice';
import { FaProjectDiagram, FaMoneyBillWave, FaStar, FaChartLine, FaTools, FaBriefcase } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { FreelancerRating } from './FreelancerRating';

const FreelancerDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const { user, isLoading: authLoading, isError: authError } = useSelector((state) => state.auth);
    const { projects, isLoading: projectsLoading, error: projectError } = useSelector((state) => state.projects);
    const [skills, setSkills] = React.useState([]);
    const [skillsLoading, setSkillsLoading] = React.useState(true);
    const [skillsError, setSkillsError] = React.useState(null);

    useEffect(() => {
        const initializeDashboard = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                if (!user) {
                    await dispatch(getCurrentUser()).unwrap();
                }

                await dispatch(getProjects()).unwrap();
            } catch (error) {
                console.error('Error initializing freelancer dashboard:', error);
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
    }, [dispatch, navigate, user]);

    useEffect(() => {
        const fetchSkills = async () => {
            if (!user?._id) return;
            setSkillsLoading(true);
            try {
                const res = await api.get(`/skills`);
                setSkills(res.data || []);
                setSkillsError(null);
            } catch (err) {
                setSkills([]);
                setSkillsError('Failed to fetch skills');
            } finally {
                setSkillsLoading(false);
            }
        };
        fetchSkills();
    }, [user?._id]);

    const handleCompleteProject = async (projectId) => {
        try {
            // Show loading toast
            const loadingToast = toast.loading('Marking project as complete...');
            
            // Complete the project
            const result = await dispatch(completeProject(projectId)).unwrap();
            
            // Update the loading toast to success
            toast.update(loadingToast, {
                render: 'Project marked as complete!',
                type: 'success',
                isLoading: false,
                autoClose: 3000
            });

            // Refresh user data to get updated earnings
            await dispatch(getCurrentUser()).unwrap();
            
            // Refresh projects list
            await dispatch(getProjects()).unwrap();
        } catch (error) {
            console.error('Error completing project:', error);
            toast.error(error?.message || 'Failed to mark project as complete. Please try again.');
        }
    };

    if ((authLoading && !user) || projectsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (authError || !user) {
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

    // Filter projects where the freelancer has submitted bids or is assigned
    const myBids = projects?.filter(project => 
        project.bids?.some(bid => bid.freelancer._id === user._id) ||
        project.freelancer?._id === user._id
    ) || [];

    // Get assigned projects (where freelancer is assigned and status is in-progress)
    const assignedProjects = projects?.filter(project => 
        project.freelancer?._id === user._id && 
        project.status === 'in-progress'
    ) || [];

    // Calculate statistics
    const activeBids = myBids.filter(project => 
        project.status === 'open' && 
        project.bids?.some(bid => 
            bid.freelancer._id === user._id && 
            bid.status === 'pending'
        )
    ).length;

    const wonProjects = assignedProjects.length;

    const completedProjects = projects?.filter(project => 
        project.freelancer?._id === user._id && 
        project.status === 'completed'
    ).length || 0;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
                <p className="text-gray-600">Manage your freelancing work and track your progress</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <FaProjectDiagram className="text-blue-500 text-2xl mr-4" />
                        <div>
                            <h3 className="text-lg font-semibold">Active Bids</h3>
                            <p className="text-2xl font-bold">{activeBids}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <FaBriefcase className="text-green-500 text-2xl mr-4" />
                        <div>
                            <h3 className="text-lg font-semibold">Won Projects</h3>
                            <p className="text-2xl font-bold">{wonProjects}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <FaChartLine className="text-purple-500 text-2xl mr-4" />
                        <div>
                            <h3 className="text-lg font-semibold">Completed</h3>
                            <p className="text-2xl font-bold">{completedProjects}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <FaStar className="text-yellow-500 text-2xl mr-4" />
                        <div>
                            <h3 className="text-lg font-semibold">Rating</h3>
                            <FreelancerRating freelancerId={user._id} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Link to="/projects" className="bg-blue-50 p-6 rounded-lg hover:bg-blue-100 transition-colors">
                    <h3 className="text-lg font-semibold text-blue-700 mb-2">Find Projects</h3>
                    <p className="text-blue-600">Browse available projects and submit bids</p>
                </Link>

                <Link to="/profile/skills" className="bg-green-50 p-6 rounded-lg hover:bg-green-100 transition-colors">
                    <h3 className="text-lg font-semibold text-green-700 mb-2">Update Skills</h3>
                    <p className="text-green-600">Manage your skills and expertise</p>
                </Link>

                <Link to="/portfolio" className="bg-purple-50 p-6 rounded-lg hover:bg-purple-100 transition-colors">
                    <h3 className="text-lg font-semibold text-purple-700 mb-2">Portfolio</h3>
                    <p className="text-purple-600">Showcase your work and achievements</p>
                </Link>
            </div>

            {/* Active Projects */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Active Projects</h2>
                    <Link
                        to="/projects"
                        className="text-blue-500 hover:text-blue-700"
                    >
                        View All Projects
                    </Link>
                </div>

                {assignedProjects.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600">No active projects found</p>
                        <Link
                            to="/projects"
                            className="text-blue-500 hover:text-blue-700 mt-2 inline-block"
                        >
                            Browse Available Projects
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Project
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Client
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Budget
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Deadline
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {assignedProjects.map((project) => (
                                    <tr key={project._id}>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {project.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500">
                                                {project.client?.name || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                ${project.budget}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                project.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                                project.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500">
                                                {new Date(project.deadline).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 space-x-2">
                                            <Link
                                                to={`/projects/${project._id}`}
                                                className="text-blue-600 hover:text-blue-900 mr-2"
                                            >
                                                View Details
                                            </Link>
                                            <button
                                                onClick={() => handleCompleteProject(project._id)}
                                                disabled={projectsLoading}
                                                className={`text-green-600 hover:text-green-900 font-medium ${
                                                    projectsLoading ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                            >
                                                {projectsLoading ? 'Processing...' : 'Mark Complete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Profile and Skills Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Profile Completion</h2>
                        <Link to="/profile" className="text-blue-500 hover:text-blue-700">
                            <FaTools className="text-xl" />
                        </Link>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-700">Basic Info</span>
                                <span className="text-blue-500">100%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-700">Skills</span>
                                <span className="text-blue-500">
                                    {skillsLoading ? '...' : (skills.length > 0 ? '100%' : '0%')}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-500 h-2 rounded-full" 
                                    style={{ width: skillsLoading ? '0%' : (skills.length > 0 ? '100%' : '0%') }}
                                ></div>
                            </div>
                            {skillsError && <div className="text-red-500 text-xs mt-1">{skillsError}</div>}
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-700">Portfolio</span>
                                <span className="text-blue-500">
                                    {user.portfolio?.length ? '100%' : '0%'}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-500 h-2 rounded-full" 
                                    style={{ width: user.portfolio?.length ? '100%' : '0%' }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Earnings Overview</h2>
                        <Link to="/earnings" className="text-blue-500 hover:text-blue-700">
                            <FaMoneyBillWave className="text-xl" />
                        </Link>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700">This Month</span>
                            <span className="text-2xl font-bold">${user.earnings?.monthly || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700">Total Earnings</span>
                            <span className="text-2xl font-bold">${user.earnings?.total || 0}</span>
                        </div>
                        <Link
                            to="/earnings"
                            className="block text-center bg-green-50 text-green-700 py-2 rounded-md hover:bg-green-100 transition-colors"
                        >
                            View Detailed Report
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FreelancerDashboard; 