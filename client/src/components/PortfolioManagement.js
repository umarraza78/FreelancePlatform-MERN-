import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaPlus, FaTimes, FaEdit } from 'react-icons/fa';
import { updateProfile, getCurrentUser } from '../features/auth/authSlice';
import api from '../utils/api';

const PortfolioManagement = () => {
    const dispatch = useDispatch();
    const { user, isLoading } = useSelector((state) => state.auth);
    
    // Add a local state to track portfolio items
    const [portfolioItems, setPortfolioItems] = useState([]);
    
    useEffect(() => {
        if (!user) {
            dispatch(getCurrentUser());
        } else {
            setPortfolioItems(user.portfolio || []);
        }
    }, [dispatch, user]);

    const [newItem, setNewItem] = useState({
        title: '',
        description: '',
        link: '',
        image: null
    });

    const [editingItem, setEditingItem] = useState(null);
    const [editingImage, setEditingImage] = useState(null);

    const refreshPortfolio = async () => {
        try {
            const response = await dispatch(getCurrentUser()).unwrap();
            if (response) {
                setPortfolioItems(response.portfolio || []);
            }
        } catch (error) {
            console.error('Error refreshing portfolio:', error);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('Image size should be less than 5MB');
                return;
            }
            setNewItem({ ...newItem, image: file });
        }
    };

    const handleAddItem = async () => {
        try {
            if (!newItem.title.trim() || !newItem.description.trim()) {
                toast.error('Please fill in all required fields');
                return;
            }

            const formData = new FormData();
            formData.append('title', newItem.title);
            formData.append('description', newItem.description);
            if (newItem.link) {
                formData.append('link', newItem.link);
            }
            if (newItem.image) {
                formData.append('image', newItem.image);
            }

            const response = await api.post('/freelancers/portfolio', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data) {
                // Update local state immediately
                setPortfolioItems(response.data.portfolio || []);
                // Refresh the global state
                await refreshPortfolio();
                toast.success('Portfolio item added successfully');
                setNewItem({ title: '', description: '', link: '', image: null });
            }
        } catch (error) {
            console.error('Add portfolio error:', error);
            toast.error(error.response?.data?.message || 'Failed to add portfolio item');
        }
    };

    const handleRemoveItem = async (itemId) => {
        try {
            await api.delete(`/freelancers/portfolio/${itemId}`);
            // Update local state immediately
            setPortfolioItems(portfolioItems.filter(item => item._id !== itemId));
            // Refresh the global state
            await refreshPortfolio();
            toast.success('Portfolio item removed successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to remove portfolio item');
        }
    };

    const handleUpdateItem = async (item) => {
        try {
            let response;
            if (editingImage) {
                const formData = new FormData();
                formData.append('title', item.title);
                formData.append('description', item.description);
                if (item.link) formData.append('link', item.link);
                formData.append('image', editingImage);
                response = await api.put(`/freelancers/portfolio/${item._id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                response = await api.put(`/freelancers/portfolio/${item._id}`, {
                    title: item.title,
                    description: item.description,
                    link: item.link
                });
            }
            if (response.data) {
                setPortfolioItems(portfolioItems.map(p => p._id === item._id ? response.data.item || item : p));
                await refreshPortfolio();
                toast.success('Portfolio item updated successfully');
                setEditingItem(null);
                setEditingImage(null);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update portfolio item');
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto text-center">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto text-center">
                    <p>Please log in to manage your portfolio</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Manage Your Portfolio</h1>

                {/* Add New Portfolio Item */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Add New Portfolio Item</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={newItem.title}
                                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                placeholder="Project title"
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description *
                            </label>
                            <textarea
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                placeholder="Project description"
                                rows="4"
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Project Link
                            </label>
                            <input
                                type="url"
                                value={newItem.link}
                                onChange={(e) => setNewItem({ ...newItem, link: e.target.value })}
                                placeholder="https://example.com"
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Project Image
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
                        </div>
                        <button
                            onClick={handleAddItem}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
                        >
                            <FaPlus className="mr-2" />
                            Add Portfolio Item
                        </button>
                    </div>
                </div>

                {/* Current Portfolio Items */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Current Portfolio Items</h2>
                    {!portfolioItems.length ? (
                        <p className="text-gray-500 text-center py-4">No portfolio items added yet</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {portfolioItems.map((item) => (
                                <div
                                    key={item._id}
                                    className="border rounded-lg overflow-hidden"
                                >
                                    {item.image && (
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    )}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-lg">{item.title}</h3>
                                        <p className="text-gray-600 mt-2">{item.description}</p>
                                            <div className="flex justify-end mt-4 space-x-2">
                                            <button
                                                onClick={() => setEditingItem(item)}
                                                className="text-blue-500 hover:text-blue-700"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleRemoveItem(item._id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Portfolio Item Modal */}
            {editingItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                        <h2 className="text-xl font-semibold mb-4">Edit Portfolio Item</h2>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={editingItem.title}
                                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                className="w-full p-2 border rounded"
                                placeholder="Title"
                            />
                            <textarea
                                value={editingItem.description}
                                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                className="w-full p-2 border rounded"
                                rows="4"
                                placeholder="Description"
                            />
                            <input
                                type="url"
                                value={editingItem.link}
                                onChange={(e) => setEditingItem({ ...editingItem, link: e.target.value })}
                                className="w-full p-2 border rounded"
                                placeholder="Project Link"
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setEditingImage(e.target.files[0])}
                                    className="w-full p-2 border rounded"
                                />
                                <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => { setEditingItem(null); setEditingImage(null); }}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleUpdateItem(editingItem)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioManagement; 