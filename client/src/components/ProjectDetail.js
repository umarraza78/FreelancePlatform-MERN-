import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProjectById, updateProjectStatus, deleteProject } from '../features/projects/projectSlice';
import { toast } from 'react-toastify';
import { initSocket, joinProjectRoom, leaveProjectRoom } from '../utils/socket';
import { submitReview, getProjectReviews, reset, clearReviews } from '../features/reviews/reviewSlice';
import ReviewDisplay from './ReviewDisplay';
import ProjectChat from './ProjectChat';
import BidList from './BidList';
import { Spinner } from '../components/shared/Spinner';

const ReviewForm = ({ projectId, freelancerId, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    onSubmit({ rating, comment });
    // Reset form
    setRating(0);
    setComment('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Submit Review</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Rating</label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={`p-2 rounded transition-colors duration-200 ${
                  rating >= value ? 'text-yellow-500' : 'text-gray-300'
                } hover:text-yellow-400`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select rating'}
            </span>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 border rounded"
            rows="4"
            required
            minLength="10"
            maxLength="500"
            placeholder="Share your experience working with this freelancer..."
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Submit Review
        </button>
      </form>
    </div>
  );
};

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { project, isLoading: projectLoading, isError, message } = useSelector((state) => state.projects);
    const { user } = useSelector((state) => state.auth);
    const { reviews, isLoading: reviewsLoading, isSuccess } = useSelector((state) => state.reviews);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const socketRef = useRef(null);
    const [newStatus, setNewStatus] = useState('');

    useEffect(() => {
        const validateAndFetchProject = async () => {
            try {
                if (!id) {
                    toast.error('No project ID provided');
                    navigate('/');
                    return;
                }

                // Only fetch if ID is valid MongoDB ObjectId
                if (/^[0-9a-fA-F]{24}$/.test(id)) {
                    const result = await dispatch(getProjectById(id)).unwrap();
                    console.log('Fetched project:', result);
                    console.log('Project client:', result?.client);
                    console.log('Current user:', user);
                    
                    if (!result) {
                        toast.error('Project not found');
                        navigate('/');
                    }

                    // Check if user has already submitted a review
                    if (result.reviews && result.reviews.length > 0) {
                        const hasReviewed = result.reviews.some(review => 
                            review.reviewer._id === user.id || review.reviewer._id === user._id
                        );
                        setShowReviewForm(hasReviewed);
                    }
                }
            } catch (error) {
                console.error('Error fetching project:', error);
                toast.error(error?.message || 'Failed to fetch project details');
                navigate('/');
            }
        };

        // Check if user is logged in
        if (!user) {
            toast.error('Please log in to view project details');
            navigate('/login', { state: { from: `/projects/${id}` } });
            return;
        }

        validateAndFetchProject();
    }, [dispatch, id, navigate, user]);

    useEffect(() => {
        if (isError && message) {
            toast.error(message);
        }
    }, [isError, message]);

    useEffect(() => {
        if (project?._id) {
            dispatch(clearReviews());
            dispatch(getProjectReviews(project._id));
        }
    }, [project?._id, dispatch]);

    useEffect(() => {
        return () => {
            dispatch(clearReviews());
        };
    }, []);

    useEffect(() => {
        if (isSuccess) {
            setRating(0);
            setComment('');
            setShowReviewForm(false);
            dispatch(reset());
        }
    }, [isSuccess]);

    useEffect(() => {
        if (!id || !user?.token) return;

        let cleanId = id.replace(/['"()]/g, '');
        if (!/^[0-9a-fA-F]{24}$/.test(cleanId)) return;

        // Initialize socket only once
        const socket = initSocket(user.token);
        socketRef.current = socket;

        if (socket) {
            joinProjectRoom(cleanId);

            const handleNewBid = (bid) => {
                toast.info('New bid received!');
                window.location.reload();
            };

            const handleCounterOffer = (bid) => {
                toast.info('Counter-offer received!');
                window.location.reload();
            };

            const handleBidStatusUpdate = ({ bidId, status }) => {
                toast.info(`Bid ${status}!`);
            };

            socket.on('newBid', handleNewBid);
            socket.on('counterOffer', handleCounterOffer);
            socket.on('bidStatusUpdate', handleBidStatusUpdate);

            return () => {
                leaveProjectRoom(cleanId);
                socket.off('newBid', handleNewBid);
                socket.off('counterOffer', handleCounterOffer);
                socket.off('bidStatusUpdate', handleBidStatusUpdate);
                socket.disconnect();
            };
        }
    }, [id, user?.token]);

    const handleStatusChange = async () => {
        if (!newStatus) return;
        
        try {
            await dispatch(updateProjectStatus({ id, status: newStatus })).unwrap();
            toast.success('Project status updated successfully');
            setNewStatus('');
        } catch (error) {
            toast.error(error?.message || 'Failed to update project status');
        }
    };

    const handleSubmitReview = async ({ rating, comment }) => {
        try {
            await dispatch(submitReview({
                projectId: project._id,
                rating,
                comment
            })).unwrap();
            toast.success('Review submitted successfully');
            // Fetch updated reviews after submission
            dispatch(getProjectReviews(project._id));
        } catch (error) {
            toast.error(error || 'Failed to submit review');
        }
    };

    const canSubmitReview = useMemo(() => {
        if (!project || !user || !reviews) return false;
        
        // Check if user is the client of this project
        const isClient = user.id === project.client?._id || user._id === project.client?._id;
        
        // Check if project is completed
        const isCompleted = project.status === 'completed';
        
        // Check if project has a freelancer assigned
        const hasFreelancer = !!project.freelancer;
        
        // Check if user has already reviewed this project
        const hasAlreadyReviewed = reviews.some(review => 
            (review.reviewer?._id === user.id || review.reviewer?._id === user._id) && 
            review.project === project._id
        );
        
        return isClient && isCompleted && hasFreelancer && !hasAlreadyReviewed;
    }, [project, user, reviews]);

    const handleDeleteProject = async () => {
        if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            try {
                await dispatch(deleteProject(id)).unwrap();
                toast.success('Project deleted successfully');
                navigate('/');
            } catch (error) {
                toast.error(error?.message || 'Failed to delete project');
            }
        }
    };

    if (projectLoading || reviewsLoading) {
        return <Spinner />;
    }

    if (isError) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Error! </strong>
                        <span className="block sm:inline">{message || 'Failed to load project details.'}</span>
                    </div>
                    <button 
                        onClick={() => navigate('/')}
                        className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Not Found! </strong>
                        <span className="block sm:inline">The requested project could not be found.</span>
                    </div>
                    <button 
                        onClick={() => navigate('/')}
                        className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">{project.title}</h1>
                        <p className="text-gray-600 mt-2">{project.description}</p>
                    </div>
                    <div className="flex gap-2">
                        {user && project?.client && (user.id === project.client._id || user._id === project.client._id) && (
                            <>
                                <button
                                    onClick={() => navigate(`/projects/${id}/edit`)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    Edit Project
                                </button>
                                <button
                                    onClick={handleDeleteProject}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    Delete Project
                                </button>
                                {project.status !== 'completed' && project.status !== 'cancelled' && (
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="px-4 py-2 border rounded-md"
                                    >
                                        <option value="">Update Status</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                )}
                                {newStatus && (
                                    <button
                                        onClick={handleStatusChange}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                    >
                                        Update
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Project Details</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <span className={`px-2 py-1 rounded-full text-sm ${
                                    project.status === 'open' ? 'bg-green-100 text-green-800' :
                                    project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                    project.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {project.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Budget</p>
                                <p className="font-semibold">${project.budget}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Deadline</p>
                                <p className="font-semibold">
                                    {new Date(project.deadline).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Created By</p>
                                <p className="font-semibold">{project.client?.name || 'Loading...'}</p>
                            </div>
                            {project.freelancer && (
                                <div>
                                    <p className="text-sm text-gray-500">Assigned Freelancer</p>
                                    <p className="font-semibold">{project.freelancer.name}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-4">Requirements & Skills</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Requirements</p>
                                <ul className="list-disc list-inside mt-1">
                                    {project.requirements.map((req, index) => (
                                        <li key={index} className="text-gray-700">{req}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Required Skills</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {project.skills.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {project && <BidList project={project} />}

                <div className="mt-8">
                    <ProjectChat projectId={id} />
                </div>

                <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
                    {reviews.length === 0 ? (
                        <p className="text-gray-500">No reviews yet for this project.</p>
                    ) : (
                        <div className="space-y-4">
                            {reviews
                                .filter(review => review.project === project._id)
                                .map((review) => (
                                    <div key={review._id} className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">{review.reviewer?.name || 'Anonymous'}</p>
                                                <div className="flex text-yellow-400 mt-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className="text-xl">
                                                            {i < review.rating ? '★' : '☆'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-500">
                                                {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-gray-700">{review.comment}</p>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {canSubmitReview && (
                    <div className="mt-8">
                        <ReviewForm
                            projectId={project._id}
                            freelancerId={project.freelancer._id}
                            onSubmit={handleSubmitReview}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectDetail; 