import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaProjectDiagram, FaUsers, FaCheckCircle, FaClock, FaPlus } from 'react-icons/fa';
import { getProjects } from '../features/projects/projectSlice';

const ClientDashboard = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { projects, isLoading } = useSelector((state) => state.projects);

    useEffect(() => {
        dispatch(getProjects());
    }, [dispatch]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Calculate statistics
    const totalProjects = projects?.length || 0;
    const activeProjects = projects?.filter(p => p.status === 'in-progress').length || 0;
    const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
    const cancelledProjects = projects?.filter(p => p.status === 'cancelled').length || 0;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
                    <p className="text-gray-600">Manage your projects and freelancers</p>
                </div>
                <Link
                    to="/projects/new"
                    className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                    <FaPlus className="mr-2" />
                    Post New Project
                </Link>
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
                        <FaUsers className="text-green-500 text-2xl mr-4" />
                        <div>
                            <h3 className="text-lg font-semibold">Active Projects</h3>
                            <p className="text-2xl font-bold">{activeProjects}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <FaCheckCircle className="text-purple-500 text-2xl mr-4" />
                        <div>
                            <h3 className="text-lg font-semibold">Completed</h3>
                            <p className="text-2xl font-bold">{completedProjects}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <FaClock className="text-orange-500 text-2xl mr-4" />
                        <div>
                            <h3 className="text-lg font-semibold">Cancelled</h3>
                            <p className="text-2xl font-bold">{cancelledProjects}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Projects */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Recent Projects</h2>
                    <Link
                        to="/projects"
                        className="text-blue-500 hover:text-blue-700"
                    >
                        View All
                    </Link>
                </div>

                {projects?.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">No projects found</p>
                        <Link
                            to="/projects/new"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Create Your First Project
                        </Link>
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
                                        Bids
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Budget
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
                                            {project.bids?.length || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            ${project.budget}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(project.deadline).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link
                                                to={`/projects/${project._id}`}
                                                className="text-blue-500 hover:text-blue-700 mr-4"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                    to="/projects/new"
                    className="bg-blue-50 p-6 rounded-lg hover:bg-blue-100 transition-colors"
                >
                    <h3 className="text-lg font-semibold text-blue-700 mb-2">Post a Project</h3>
                    <p className="text-blue-600">Create a new project and find freelancers</p>
                </Link>

                <Link
                    to="/freelancers"
                    className="bg-green-50 p-6 rounded-lg hover:bg-green-100 transition-colors"
                >
                    <h3 className="text-lg font-semibold text-green-700 mb-2">Browse Freelancers</h3>
                    <p className="text-green-600">Find and hire talented freelancers</p>
                </Link>

                <Link
                    to="/analytics"
                    className="bg-purple-50 p-6 rounded-lg hover:bg-purple-100 transition-colors"
                >
                    <h3 className="text-lg font-semibold text-purple-700 mb-2">View Analytics</h3>
                    <p className="text-purple-600">Track your project metrics and spending</p>
                </Link>
            </div>
        </div>
    );
};

export default ClientDashboard; 