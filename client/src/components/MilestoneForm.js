import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addMilestone, updateMilestoneStatus } from '../features/projects/projectSlice';
import { toast } from 'react-toastify';

const MilestoneForm = ({ project }) => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        amount: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error('Please login to add milestones');
            return;
        }

        if (user._id !== project.client._id) {
            toast.error('Only the project owner can add milestones');
            return;
        }

        try {
            await dispatch(addMilestone({
                projectId: id,
                milestoneData: formData
            })).unwrap();
            toast.success('Milestone added successfully');
            setFormData({
                title: '',
                description: '',
                dueDate: '',
                amount: ''
            });
        } catch (error) {
            toast.error(error.message || 'Failed to add milestone');
        }
    };

    const handleStatusUpdate = async (milestoneId, newStatus) => {
        try {
            await dispatch(updateMilestoneStatus({
                projectId: id,
                milestoneId,
                status: newStatus
            })).unwrap();
            toast.success('Milestone status updated successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to update milestone status');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Milestones</h2>

            {user && user._id === project.client._id && (
                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
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
                            rows="3"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Due Date</label>
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                                min="0"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        Add Milestone
                    </button>
                </form>
            )}

            <div className="space-y-4">
                {project.milestones && project.milestones.map((milestone) => (
                    <div key={milestone._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold">{milestone.title}</h3>
                                <p className="text-gray-600 mt-1">{milestone.description}</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-lg font-bold">${milestone.amount}</span>
                                <span className="text-sm text-gray-500">
                                    Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                            <div>
                                <span className={`px-2 py-1 rounded-full text-sm ${
                                    milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    milestone.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {milestone.status}
                                </span>
                            </div>

                            {user && (
                                <div className="flex gap-2">
                                    {user._id === project.freelancer?._id && milestone.status === 'pending' && (
                                        <button
                                            onClick={() => handleStatusUpdate(milestone._id, 'completed')}
                                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                                        >
                                            Mark as Completed
                                        </button>
                                    )}
                                    {user._id === project.client._id && milestone.status === 'completed' && (
                                        <button
                                            onClick={() => handleStatusUpdate(milestone._id, 'approved')}
                                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            Approve
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MilestoneForm; 