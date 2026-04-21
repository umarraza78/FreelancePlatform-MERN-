import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getProjects } from '../features/projects/projectSlice';
import { FaSearch, FaFilter } from 'react-icons/fa';

const ProjectBrowse = () => {
    const dispatch = useDispatch();
    const { projects, isLoading } = useSelector((state) => state.projects);
    const { user } = useSelector((state) => state.auth);

    const [filters, setFilters] = useState({
        search: '',
        category: '',
        budget: '',
        status: 'active'
    });

    useEffect(() => {
        dispatch(getProjects());
    }, [dispatch]);

    // Filter out projects where the freelancer has already bid
    const availableProjects = projects?.filter(project => 
        project.status === 'active' && 
        !project.bids?.some(bid => bid.freelancer === user._id)
    ) || [];

    const filteredProjects = availableProjects.filter(project => {
        const matchesSearch = project.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                            project.description.toLowerCase().includes(filters.search.toLowerCase());
        const matchesCategory = !filters.category || project.category === filters.category;
        const matchesBudget = !filters.budget || project.budget >= parseInt(filters.budget);
        
        return matchesSearch && matchesCategory && matchesBudget;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Available Projects</h1>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Categories</option>
                        <option value="web">Web Development</option>
                        <option value="mobile">Mobile Development</option>
                        <option value="design">Design</option>
                        <option value="writing">Writing</option>
                        <option value="marketing">Marketing</option>
                    </select>
                    <select
                        value={filters.budget}
                        onChange={(e) => setFilters({ ...filters, budget: e.target.value })}
                        className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Budgets</option>
                        <option value="100">$100+</option>
                        <option value="500">$500+</option>
                        <option value="1000">$1000+</option>
                        <option value="5000">$5000+</option>
                    </select>
                </div>
            </div>

            {filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-600 text-lg mb-4">No projects found matching your criteria</p>
                    <button
                        onClick={() => setFilters({ search: '', category: '', budget: '', status: 'active' })}
                        className="text-blue-500 hover:text-blue-700"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <div key={project._id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-semibold">
                                    <Link to={`/projects/${project._id}`} className="hover:text-blue-600">
                                        {project.title}
                                    </Link>
                                </h2>
                                <span className="px-2 py-1 text-sm rounded-full bg-green-100 text-green-800">
                                    ${project.budget}
                                </span>
                            </div>
                            <p className="text-gray-600 mb-4 line-clamp-3">{project.description}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {project.skills?.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 text-sm bg-blue-50 text-blue-600 rounded"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>Posted {new Date(project.createdAt).toLocaleDateString()}</span>
                                <span>{project.bids?.length || 0} bids</span>
                            </div>
                            <div className="mt-4 pt-4 border-t">
                                <Link
                                    to={`/projects/${project._id}`}
                                    className="w-full block text-center bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                                >
                                    View Details & Bid
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectBrowse; 