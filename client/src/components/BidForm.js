import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { submitBid } from '../features/projects/projectSlice';
import { toast } from 'react-toastify';

const BidForm = ({ project }) => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        amount: '',
        proposal: '',
        estimatedTime: ''
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
            toast.error('Please login to submit a bid');
            return;
        }

        if (user._id === project.client._id) {
            toast.error('You cannot bid on your own project');
            return;
        }

        try {
            await dispatch(submitBid({
                projectId: id,
                bidData: {
                    ...formData,
                    freelancerId: user._id
                }
            })).unwrap();
            toast.success('Bid submitted successfully');
            setFormData({
                amount: '',
                proposal: '',
                estimatedTime: ''
            });
        } catch (error) {
            toast.error(error.message || 'Failed to submit bid');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Submit a Bid</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Bid Amount ($)</label>
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

                <div>
                    <label className="block text-sm font-medium text-gray-700">Proposal</label>
                    <textarea
                        name="proposal"
                        value={formData.proposal}
                        onChange={handleChange}
                        rows="4"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                        placeholder="Describe your approach and why you're the best fit for this project..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Estimated Time (days)</label>
                    <input
                        type="number"
                        name="estimatedTime"
                        value={formData.estimatedTime}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                        min="1"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    Submit Bid
                </button>
            </form>
        </div>
    );
};

export default BidForm; 