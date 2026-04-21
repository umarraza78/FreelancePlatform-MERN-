import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    acceptBid, 
    rejectBid, 
    submitBid, 
    sendCounterOffer, 
    getProjectById,
    updateProjectStatus 
} from '../features/projects/projectSlice';
import { toast } from 'react-toastify';
import api from '../utils/api';

const BidList = ({ project }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // State for sorting and filtering
    const [sortBy, setSortBy] = useState('amount');
    const [filterStatus, setFilterStatus] = useState('all');
    
    // State for counter offers
    const [showCounterForm, setShowCounterForm] = useState(null);
    const [counterAmount, setCounterAmount] = useState('');
    const [counterMessage, setCounterMessage] = useState('');
    
    // State for new bids
    const [bidAmount, setBidAmount] = useState('');
    const [bidMessage, setBidMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Get user's bids
    const userBids = project?.bids?.filter(bid => 
        bid.freelancer._id === user?.id || bid.freelancer._id === user?._id
    ) || [];

    // Add debug logging
    useEffect(() => {
        console.log('Current user:', user);
        console.log('User ID:', user?.id);
        console.log('Project client:', project?.client);
        console.log('Project client ID:', project?.client?._id);
        console.log('User bids:', userBids);
    }, [user, project, userBids]);

    const getUserId = () => {
        return user?.id || user?._id;
    };

    const getClientId = () => {
        return project?.client?.id || project?.client?._id;
    };

    const handleAcceptBid = async (bidId) => {
        if (window.confirm('Are you sure you want to accept this bid? This will:\n- Change project status to "in-progress"\n- Reject all other bids\n- Assign the freelancer to the project')) {
            try {
                setIsProcessing(true);
                
                // Accept the bid (backend will handle status update and other bid rejections)
                await dispatch(acceptBid({
                    projectId: project._id,
                    bidId
                })).unwrap();
                
                // Refresh project data to get updated state
                await dispatch(getProjectById(project._id)).unwrap();
                
                toast.success('Bid accepted and project started successfully');
            } catch (error) {
                console.error('Error in bid acceptance process:', error);
                toast.error(error?.message || 'Failed to accept bid');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleRejectBid = async (bidId) => {
        if (window.confirm('Are you sure you want to reject this bid?')) {
            try {
                await dispatch(rejectBid({
                    projectId: project._id,
                    bidId
                })).unwrap();
                toast.success('Bid rejected successfully');
            } catch (error) {
                toast.error(error.message || 'Failed to reject bid');
            }
        }
    };

    const handleCounterOffer = async (e, bidId) => {
        e.preventDefault();
        try {
            await dispatch(sendCounterOffer({
                projectId: project._id,
                bidId,
                amount: counterAmount,
                message: counterMessage
            })).unwrap();
            setShowCounterForm(null);
            setCounterAmount('');
            setCounterMessage('');
            toast.success('Counter-offer sent!');
        } catch (error) {
            toast.error(error.message || 'Failed to send counter-offer');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const userId = getUserId();
        const clientId = getClientId();

        if (!userId) {
            toast.error('Please log in to submit a bid');
            return;
        }

        // Prevent client from bidding on their own project
        if (userId === clientId) {
            toast.error('You cannot bid on your own project');
            return;
        }

        // Validate bid amount
        const parsedAmount = parseFloat(bidAmount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error('Please enter a valid bid amount');
            return;
        }

        try {
            setLoading(true);
            
            // Get token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Log the request details
            console.log('Submitting bid:', {
                projectId: project._id,
                amount: parsedAmount,
                message: bidMessage.trim()
            });

            // Make the API request
            const response = await api.post(
                `/projects/${project._id}/bids`,
                {
                    amount: parsedAmount,
                    message: bidMessage.trim()
                }
            );

            console.log('Bid submission response:', response.data);

            // Refresh project data to show new bid
            await dispatch(getProjectById(project._id));
            
            // Clear form
            setBidAmount('');
            setBidMessage('');
            toast.success('Bid submitted successfully');
        } catch (error) {
            console.error('Bid submission error:', {
                message: error.response?.data?.message || error.message,
                status: error.response?.status,
                data: error.response?.data
            });

            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else if (error.response?.status === 401) {
                toast.error('Please log in again to submit your bid');
            } else if (error.response?.status === 403) {
                toast.error('You are not authorized to submit bids');
            } else {
                toast.error('Failed to submit bid. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Sort and filter bids
    const sortedFilteredBids = project.bids
        ? project.bids
            .filter(bid => filterStatus === 'all' || bid.status === filterStatus)
            .sort((a, b) => sortBy === 'amount' ? a.amount - b.amount : new Date(a.createdAt) - new Date(b.createdAt))
        : [];

    if (!project?._id || isProcessing) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-600">Loading bids...</p>
                </div>
            </div>
        );
    }

    if (!project.bids || project.bids.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Bids</h2>
                <p className="text-gray-500">No bids have been submitted yet.</p>
                {user && getUserId() !== getClientId() && (
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-4">Submit a Bid</h3>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-md">
                            <input
                                type="number"
                                value={bidAmount}
                                onChange={e => setBidAmount(e.target.value)}
                                placeholder="Your Bid Amount"
                                required
                                className="border rounded px-2 py-1"
                            />
                            <textarea
                                value={bidMessage}
                                onChange={e => setBidMessage(e.target.value)}
                                placeholder="Your Bid Message"
                                required
                                className="border rounded px-2 py-1"
                                rows="3"
                            />
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Bid'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
                    <p>Debug Info:</p>
                    <p>User ID: {getUserId()}</p>
                    <p>Client ID: {getClientId()}</p>
                    <p>Is Client: {String(getUserId() === getClientId())}</p>
                    <p>User Bids Count: {userBids.length}</p>
                </div>
            )}

            {/* Show user's existing bids if any */}
            {userBids.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Your Bids</h3>
                    <div className="space-y-3">
                        {userBids.map(bid => (
                            <div key={bid._id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">Amount: ${bid.amount}</p>
                                        <p className="text-gray-600">{bid.message}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-sm ${
                                        bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                        bid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {bid.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    Submitted: {new Date(bid.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">All Bids ({project.bids.length})</h2>
                <div className="flex gap-4">
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="border rounded px-2 py-1"
                    >
                        <option value="amount">Sort by Amount</option>
                        <option value="date">Sort by Date</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="border rounded px-2 py-1"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {sortedFilteredBids.map((bid) => (
                    <div key={bid._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold">{bid.freelancer.name}</h3>
                                <p className="text-gray-600 mt-1">{bid.message}</p>
                                {bid.estimatedTime && (
                                    <p className="text-sm text-gray-500">
                                        Estimated time: {bid.estimatedTime} days
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold text-green-600">
                                    ${bid.amount}
                                </span>
                                <p className="text-sm text-gray-500">
                                    {new Date(bid.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4">
                            <span className={`px-2 py-1 rounded-full text-sm ${
                                bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                bid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                                {bid.status}
                            </span>

                            {user && getUserId() === getClientId() && bid.status === 'pending' && (
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => handleAcceptBid(bid._id)}
                                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleRejectBid(bid._id)}
                                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => setShowCounterForm(bid._id)}
                                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Counter Offer
                                    </button>
                                </div>
                            )}
                        </div>

                        {showCounterForm === bid._id && (
                            <form onSubmit={e => handleCounterOffer(e, bid._id)} className="mt-4 space-y-2">
                                <input
                                    type="number"
                                    value={counterAmount}
                                    onChange={e => setCounterAmount(e.target.value)}
                                    placeholder="Counter Amount"
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                                <textarea
                                    value={counterMessage}
                                    onChange={e => setCounterMessage(e.target.value)}
                                    placeholder="Counter Message"
                                    required
                                    className="w-full border rounded px-3 py-2"
                                    rows="2"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                    >
                                        Send Counter
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCounterForm(null)}
                                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {bid.counterOffer && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <div className="font-semibold text-blue-600">Counter Offer</div>
                                <div className="text-lg font-bold">${bid.counterOffer.amount}</div>
                                <div className="text-gray-600">{bid.counterOffer.message}</div>
                                <div className="mt-2">
                                    <span className={`px-2 py-1 rounded-full text-sm ${
                                        bid.counterOffer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                        bid.counterOffer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        Status: {bid.counterOffer.status}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Bid Submission Form */}
            {user && getUserId() !== getClientId() && project.status === 'open' && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Submit Another Bid</h3>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-md">
                        <input
                            type="number"
                            value={bidAmount}
                            onChange={e => setBidAmount(e.target.value)}
                            placeholder="Your Bid Amount"
                            required
                            className="border rounded px-2 py-1"
                        />
                        <textarea
                            value={bidMessage}
                            onChange={e => setBidMessage(e.target.value)}
                            placeholder="Your Bid Message"
                            required
                            className="border rounded px-2 py-1"
                            rows="3"
                        />
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Bid'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default BidList; 