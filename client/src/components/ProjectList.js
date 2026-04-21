import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getProjects } from '../features/projects/projectSlice';
import { toast } from 'react-toastify';

const ProjectList = () => {
    const dispatch = useDispatch();
    const { projects, isLoading, isError, message } = useSelector((state) => state.projects);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const user = useSelector((state) => state.auth.user);

    useEffect(() => {
        dispatch(getProjects());
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            toast.error(message);
        }
    }, [isError, message]);

    const filteredProjects = projects?.filter(project => {
        const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
        const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            project.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Projects</h1>
                {user && user.role === 'client' && (
                    <Link
                        to="/projects/new"
                        className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Create Project
                    </Link>
                )}
            </div>

            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects?.map((project) => (
                    <Link
                        key={project._id}
                        to={`/projects/${project._id}`}
                        className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">{project.title}</h2>
                                <span className={`px-2 py-1 rounded-full text-sm ${
                                    project.status === 'open' ? 'bg-green-100 text-green-800' :
                                    project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                    project.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {project.status}
                                </span>
                            </div>
                            <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>Budget: ${project.budget}</span>
                                <span>Bids: {project.bids?.length || 0}</span>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {project.skills?.slice(0, 3).map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                                    >
                                        {skill}
                                    </span>
                                ))}
                                {project.skills?.length > 3 && (
                                    <span className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                                        +{project.skills.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredProjects?.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-600">No projects found matching your criteria.</p>
                </div>
            )}
        </div>
    );
};

export default ProjectList; 