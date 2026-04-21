import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { updateProject, getProjectById } from '../features/projects/projectSlice';
import { toast } from 'react-toastify';

const EditProject = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { project, isLoading, isError, message } = useSelector((state) => state.projects);
    const { user } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        deadline: '',
        requirements: '',
        skills: ''
    });

    useEffect(() => {
        if (id) {
            dispatch(getProjectById(id));
        }
    }, [dispatch, id]);

    useEffect(() => {
        if (project) {
            // Check if user is the project owner
            if (project.client._id !== user.id && project.client._id !== user._id) {
                toast.error('Not authorized to edit this project');
                navigate('/');
                return;
            }

            // Format the date to YYYY-MM-DD for the date input
            const formattedDate = new Date(project.deadline).toISOString().split('T')[0];

            setFormData({
                title: project.title || '',
                description: project.description || '',
                budget: project.budget || '',
                deadline: formattedDate || '',
                requirements: project.requirements?.join(', ') || '',
                skills: project.skills?.join(', ') || ''
            });
        }
    }, [project, user.id, user._id, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateForm = () => {
        if (!formData.title.trim()) {
            toast.error('Title is required');
            return false;
        }
        if (formData.description.trim().length < 3) {
            toast.error('Description must be at least 3 characters long');
            return false;
        }
        if (!formData.budget || formData.budget <= 0) {
            toast.error('Please enter a valid budget');
            return false;
        }
        if (!formData.deadline) {
            toast.error('Deadline is required');
            return false;
        }
        if (!formData.requirements.trim()) {
            toast.error('Requirements are required');
            return false;
        }
        if (!formData.skills.trim()) {
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
                id,
                title: formData.title.trim(),
                description: formData.description.trim(),
                budget: parseFloat(formData.budget),
                deadline: new Date(formData.deadline).toISOString(),
                requirements: formData.requirements.split(',').map(req => req.trim()),
                skills: formData.skills.split(',').map(skill => skill.trim())
            };

            await dispatch(updateProject(projectData)).unwrap();
            toast.success('Project updated successfully!');
            navigate(`/projects/${id}`);
        } catch (error) {
            toast.error(error?.message || 'Failed to update project');
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isError) {
        let errorMsg = '';
        if (typeof message === 'string') {
            errorMsg = message;
        } else if (message && typeof message === 'object') {
            errorMsg = message.message || JSON.stringify(message);
        } else {
            errorMsg = 'An unknown error occurred.';
        }
        return <div>Error: {errorMsg}</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6">Edit Project</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        rows="4"
                        required
                        minLength={3}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Budget ($)</label>
                    <input
                        type="number"
                        name="budget"
                        value={formData.budget}
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
                        value={formData.deadline}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Requirements (comma-separated)</label>
                    <textarea
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Required Skills (comma-separated)</label>
                    <textarea
                        name="skills"
                        value={formData.skills}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                    />
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Update Project
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/projects/${id}`)}
                        className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProject; 