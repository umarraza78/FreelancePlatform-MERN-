import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createProject, updateProject } from '../features/projects/projectSlice';
import { toast } from 'react-toastify';

const ProjectForm = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: [''],
        deadline: '',
        budget: '',
        skills: [''],
        status: 'open'
    });

    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { projects, isLoading, isError, message } = useSelector((state) => state.projects);

    useEffect(() => {
        if (id) {
            const project = projects.find((p) => p._id === id);
            if (project) {
                setFormData({
                    title: project.title,
                    description: project.description,
                    requirements: project.requirements,
                    deadline: new Date(project.deadline).toISOString().split('T')[0],
                    budget: project.budget,
                    skills: project.skills,
                    status: project.status
                });
            }
        }
    }, [id, projects]);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSkillChange = (index, value) => {
        const newSkills = [...formData.skills];
        newSkills[index] = value;
        setFormData((prev) => ({
            ...prev,
            skills: newSkills
        }));
    };

    const addSkill = () => {
        setFormData((prev) => ({
            ...prev,
            skills: [...prev.skills, '']
        }));
    };

    const removeSkill = (index) => {
        setFormData((prev) => ({
            ...prev,
            skills: prev.skills.filter((_, i) => i !== index)
        }));
    };

    const handleRequirementChange = (index, value) => {
        const newRequirements = [...formData.requirements];
        newRequirements[index] = value;
        setFormData(prev => ({
            ...prev,
            requirements: newRequirements
        }));
    };

    const addRequirement = () => {
        setFormData(prev => ({
            ...prev,
            requirements: [...prev.requirements, '']
        }));
    };

    const removeRequirement = (index) => {
        setFormData(prev => ({
            ...prev,
            requirements: prev.requirements.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formattedData = {
                ...formData,
                requirements: formData.requirements.filter(req => req.trim()),
                budget: Number(formData.budget),
                deadline: new Date(formData.deadline).toISOString()
            };

            if (id) {
                await dispatch(updateProject({ id, ...formattedData })).unwrap();
                toast.success('Project updated successfully');
            } else {
                await dispatch(createProject(formattedData)).unwrap();
                toast.success('Project created successfully');
            }
            navigate('/client/dashboard');
        } catch (error) {
            console.error('Error submitting project:', error);
            toast.error(error.message || 'Failed to submit project');
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">
                {id ? 'Edit Project' : 'Create New Project'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Requirements</label>
                    {formData.requirements.map((requirement, index) => (
                        <div key={index} className="flex gap-2 mt-2">
                            <input
                                type="text"
                                value={requirement}
                                onChange={(e) => handleRequirementChange(index, e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder="Enter a requirement"
                            />
                            <button
                                type="button"
                                onClick={() => removeRequirement(index)}
                                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addRequirement}
                        className="mt-2 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
                    >
                        Add Requirement
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Deadline</label>
                    <input
                        type="date"
                        name="deadline"
                        value={formData.deadline}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Budget</label>
                    <input
                        type="number"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Skills</label>
                    {formData.skills.map((skill, index) => (
                        <div key={index} className="flex gap-2 mt-2">
                            <input
                                type="text"
                                value={skill}
                                onChange={(e) => handleSkillChange(index, e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={() => removeSkill(index)}
                                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addSkill}
                        className="mt-2 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
                    >
                        Add Skill
                    </button>
                </div>

                {id && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    {id ? 'Update Project' : 'Create Project'}
                </button>
            </form>
        </div>
    );
};

export default ProjectForm; 