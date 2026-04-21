import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getFreelancerProfile, updateProfile, addSkill, removeSkill } from '../features/freelancers/freelancerSlice';
import { getCurrentUser } from '../features/auth/authSlice';
import { toast } from 'react-toastify';
import api from '../utils/api';
import VerificationUpload from './freelancer/VerificationUpload';

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useSelector((state) => state.auth);
    const { profile, isLoading: profileLoading, isError, message } = useSelector((state) => state.freelancer);

    const [formData, setFormData] = useState({
        name: '',
        title: '',
        description: '',
        hourlyRate: '',
        skills: [],
        email: '',
        phone: '',
        location: '',
        website: '',
        bio: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [newSkill, setNewSkill] = useState('');

    // First, ensure we have user data
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Please log in to view your profile');
            navigate('/login');
            return;
        }

        if (!user) {
            dispatch(getCurrentUser())
                .unwrap()
                .catch(error => {
                    toast.error(error || 'Failed to load user data');
                    navigate('/login');
                });
        }
    }, [dispatch, navigate, user]);

    // Then, fetch profile data once we have user data
    useEffect(() => {
        if (user?._id) {
            if (user.role === 'freelancer') {
                dispatch(getFreelancerProfile(user._id))
                    .unwrap()
                    .catch(error => {
                        toast.error(error || 'Failed to load profile data');
                    });
            } else if (user.role === 'client') {
                // Fetch client profile directly
                api.get(`/clients/profile/${user._id}`)
                    .then(response => {
                        const profile = response.data;
                        setFormData({
                            name: profile.name || '',
                            email: profile.email || '',
                            phone: profile.phone || ''
                        });
                    })
                    .catch(error => {
                        toast.error(error?.response?.data?.message || 'Failed to load profile data');
                    });
            }
        }
    }, [user, dispatch]);

    useEffect(() => {
        if (isError) {
            toast.error(message || 'An error occurred while loading profile data');
        }

        if (profile) {
            setFormData({
                name: profile.name || user?.name || '',
                title: profile.title || '',
                description: profile.description || '',
                hourlyRate: profile.hourlyRate || '',
                skills: profile.skills || [],
                email: profile.email || user?.email || '',
                phone: profile.phone || '',
                location: profile.location || '',
                website: profile.website || '',
                bio: profile.bio || ''
            });
        }
    }, [profile, isError, message, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?._id) {
            toast.error('User not authenticated');
            return;
        }

        try {
            if (user.role === 'freelancer') {
                await dispatch(updateProfile({ ...formData, userId: user._id })).unwrap();
                toast.success('Profile updated successfully');
                setIsEditing(false);
            } else if (user.role === 'client') {
                // Only send allowed fields
                const updateData = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone
                };
                const response = await api.put('/clients/profile', updateData);
                setFormData({
                    name: response.data.name || '',
                    email: response.data.email || '',
                    phone: response.data.phone || ''
                });
                toast.success('Profile updated successfully');
                setIsEditing(false);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update profile');
        }
    };

    const handleAddSkill = async (e) => {
        e.preventDefault();
        if (!newSkill.trim()) return;

        try {
            const result = await dispatch(addSkill({ skill: newSkill.trim() })).unwrap();
            setNewSkill('');
            toast.success('Skill added successfully');
        } catch (error) {
            console.error('Failed to add skill:', error);
            toast.error(error || 'Failed to add skill');
        }
    };

    const handleRemoveSkill = async (skillId) => {
        try {
            await dispatch(removeSkill({ skillId })).unwrap();
            toast.success('Skill removed successfully');
        } catch (error) {
            console.error('Failed to remove skill:', error);
            toast.error(error || 'Failed to remove skill');
        }
    };

    if (authLoading || profileLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Not Authenticated</h2>
                    <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Profile</h1>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            {/* Only show extra fields for freelancers */}
                            {user.role === 'freelancer' && (
                                <>
                                    <div className="col-span-2">
                                        <VerificationUpload />
                                    </div>
                                </>
                            )}
                        </div>

                        {isEditing && (
                            <div className="mt-6 flex justify-end">
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile; 