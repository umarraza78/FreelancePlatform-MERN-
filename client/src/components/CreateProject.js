import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../features/projects/projectSlice';
import { toast } from 'react-toastify';

const CreateProject = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        deadline: '',
        requirements: '',
        skills: ''
    });

    const { title, description, budget, deadline, requirements, skills } = formData;
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateForm = () => {
        if (!title.trim()) {
            toast.error('Title is required');
            return false;
        }
        if (description.trim().length < 3) {
            toast.error('Description must be at least 3 characters long');
            return false;
        }
        if (!budget || budget <= 0) {
            toast.error('Please enter a valid budget');
            return false;
        }
        if (!deadline) {
            toast.error('Deadline is required');
            return false;
        }
        // Check if deadline is in the future
        if (new Date(deadline) < new Date()) {
            toast.error('Deadline must be in the future');
            return false;
        }
        if (!requirements.trim()) {
            toast.error('Requirements are required');
            return false;
        }
        if (!skills.trim()) {
            toast.error('Skills are required');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const projectData = {
                title: title.trim(),
                description: description.trim(),
                budget: parseFloat(budget),
                deadline: new Date(deadline).toISOString(),
                requirements: requirements.split(',').map(req => req.trim()),
                skills: skills.split(',').map(skill => skill.trim())
            };

            const createdProject = await dispatch(createProject(projectData)).unwrap();
            toast.success('Project created successfully!');
            navigate('/client/dashboard');
        } catch (error) {
            toast.error(error?.message || 'Failed to create project');
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        type="text"
                        name="title"
                        value={title}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        name="description"
                        value={description}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        rows="4"
                        required
                        minLength={10}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Minimum 10 characters ({description.length} / 10)
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Budget ($)</label>
                    <input
                        type="number"
                        name="budget"
                        value={budget}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        min="1"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Deadline</label>
                    <input
                        type="date"
                        name="deadline"
                        value={deadline}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        min={new Date().toISOString().split('T')[0]}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Requirements (comma-separated)</label>
                    <textarea
                        name="requirements"
                        value={requirements}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="e.g. Must have experience, Available for meetings"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Required Skills (comma-separated)</label>
                    <textarea
                        name="skills"
                        value={skills}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="e.g. React, Node.js, MongoDB"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Create Project
                </button>
            </form>
        </div>
    );
};

export default CreateProject; 