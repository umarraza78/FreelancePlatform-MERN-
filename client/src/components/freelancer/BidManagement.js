import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submitBid, fetchBids } from '../../features/freelancers/freelancerSlice';
import { format } from 'date-fns';
import { FaDollarSign, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const BidManagement = () => {
    const dispatch = useDispatch();
    const { bids, isLoading } = useSelector((state) => state.freelancer);
    const { user } = useSelector((state) => state.auth);

    const [newBid, setNewBid] = useState({
        projectId: '',
        amount: '',
        deliveryTime: '',
        proposal: '',
    });

    useEffect(() => {
        if (user?._id) {
            dispatch(fetchBids(user._id));
        }
    }, [dispatch, user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewBid(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitBid = async (e) => {
        e.preventDefault();
        await dispatch(submitBid({ ...newBid, freelancerId: user._id }));
        setNewBid({
            projectId: '',
            amount: '',
            deliveryTime: '',
            proposal: '',
        });
    };

    const getBidStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'accepted':
                return 'text-green-600';
            case 'rejected':
                return 'text-red-600';
            case 'pending':
                return 'text-yellow-600';
            default:
                return 'text-gray-600';
        }
    };

    const getBidStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'accepted':
                return <FaCheckCircle className="w-5 h-5 text-green-600" />;
            case 'rejected':
                return <FaTimesCircle className="w-5 h-5 text-red-600" />;
            case 'pending':
                return <FaClock className="w-5 h-5 text-yellow-600" />;
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* New Bid Form */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold mb-6">Submit New Bid</h2>
                <form onSubmit={handleSubmitBid} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Project ID</label>
                        <input
                            type="text"
                            name="projectId"
                            value={newBid.projectId}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Bid Amount ($)</label>
                            <input
                                type="number"
                                name="amount"
                                value={newBid.amount}
                                onChange={handleInputChange}
                                required
                                min="0"
                                step="0.01"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Delivery Time (days)</label>
                            <input
                                type="number"
                                name="deliveryTime"
                                value={newBid.deliveryTime}
                                onChange={handleInputChange}
                                required
                                min="1"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Proposal</label>
                        <textarea
                            name="proposal"
                            value={newBid.proposal}
                            onChange={handleInputChange}
                            required
                            rows="4"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Describe your approach, experience, and why you're the best fit for this project..."
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                    >
                        Submit Bid
                    </button>
                </form>
            </div>

            {/* Bids List */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-6">My Bids</h2>
                <div className="space-y-6">
                    {bids.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No bids submitted yet</p>
                    ) : (
                        bids.map((bid) => (
                            <div
                                key={bid._id}
                                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">Project: {bid.projectTitle}</h3>
                                        <p className="text-gray-600 text-sm">
                                            Submitted on {format(new Date(bid.createdAt), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {getBidStatusIcon(bid.status)}
                                        <span className={`font-medium ${getBidStatusColor(bid.status)}`}>
                                            {bid.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-center space-x-2">
                                        <FaDollarSign className="text-gray-400" />
                                        <span className="font-medium">${bid.amount}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <FaClock className="text-gray-400" />
                                        <span>{bid.deliveryTime} days</span>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm">{bid.proposal}</p>
                                {bid.clientFeedback && (
                                    <div className="mt-4 bg-gray-50 p-3 rounded">
                                        <p className="text-sm font-medium text-gray-700">Client Feedback:</p>
                                        <p className="text-sm text-gray-600">{bid.clientFeedback}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default BidManagement; 