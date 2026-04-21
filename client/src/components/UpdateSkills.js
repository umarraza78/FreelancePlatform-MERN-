import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api'; // Import the configured API instance

const UpdateSkills = () => {
    const [skills, setSkills] = useState([]);
    const [newSkill, setNewSkill] = useState({ name: '', level: 'Beginner' });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    
    const auth = useSelector((state) => state.auth);
    const navigate = useNavigate();

    // Debug log the entire auth state
    console.log('Current auth state:', auth);

    // Format skills array to ensure consistent structure
    const formatSkills = (skillsData) => {
        if (!Array.isArray(skillsData)) return [];
        
        return skillsData.map((skill, index) => formatSkill(skill, index));
    };

    const formatSkill = (skill, index) => {
        if (typeof skill === 'string') {
            return {
                _id: `skill_${index}`, // Generate temporary ID for string-based skills
                name: skill,
                level: 'Intermediate' // Default level for legacy skills
            };
        }
        return skill;
    };

    const getUserData = () => {
        // First try Redux state
        if (auth?.user?._id || auth?.user?.id) {
            console.log('Found user in Redux state:', auth.user);
            return {
                ...auth.user,
                _id: auth.user._id || auth.user.id
            };
        }
        
        // Then try localStorage
        try {
            const storedUserStr = localStorage.getItem('user');
            console.log('localStorage user data:', storedUserStr);
            
            if (storedUserStr) {
                const storedUser = JSON.parse(storedUserStr);
                console.log('Parsed user data:', storedUser);
                
                if (storedUser?.id || storedUser?._id) {
                    return {
                        ...storedUser,
                        _id: storedUser._id || storedUser.id
                    };
                }
            }
        } catch (error) {
            console.error('Error parsing localStorage data:', error);
        }
        
        console.log('No valid user data found in any source');
        return null;
    };

    useEffect(() => {
        const userData = getUserData();
        console.log('UpdateSkills mounted, complete user state:', userData);

        if (!userData) {
            console.log('No user data found, redirecting to login');
            toast.error('Please login to manage skills');
            navigate('/login');
            return;
        }
        
        if (!userData._id) {
            console.log('No user ID found, redirecting to login');
            toast.error('Please login again');
            navigate('/login');
            return;
        }

        if (userData.role !== 'freelancer') {
            console.log('User is not a freelancer:', userData.role);
            toast.error('Only freelancers can manage skills');
            navigate('/profile');
            return;
        }

        console.log('Starting skills fetch with user:', userData);
        setLoading(true);
        fetchSkills(userData);
    }, [auth, navigate]);

    const fetchSkills = async (userData) => {
        console.log('fetchSkills called with user data:', userData);
        try {
            if (!userData?._id) {
                console.log('User ID missing in fetchSkills');
                setLoading(false);
                setError('Please login again to manage skills');
                toast.error('Session expired. Please login again.');
                navigate('/login');
                return;
            }

            console.log('Making API request:', {
                url: `/skills`,
                token: localStorage.getItem('token')
            });

            const response = await api.get(`/skills`);
            console.log('API response received:', response.data);
            
            if (response.data) {
                const formattedSkills = formatSkills(response.data);
                console.log('Setting formatted skills:', formattedSkills);
                setSkills(formattedSkills);
                setError(null);
            }
        } catch (error) {
            console.error('Error fetching skills:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                error: error.message,
                token: localStorage.getItem('token') // Log token for debugging
            });

            const errorMessage = error.response?.data?.message || 'Failed to fetch skills';
            setError(errorMessage);
            
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                navigate('/login');
            } else if (error.response?.status === 404) {
                console.log('Profile not found, navigating to profile page');
                toast.error('Profile not found');
                navigate('/profile');
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async (e) => {
        e.preventDefault();
        const userData = getUserData();
        console.log('\n=== CLIENT: ADDING SKILL ===');
        console.log('User data:', userData);
        console.log('New skill data:', newSkill);

        if (!userData) {
            console.log('Error: No user data found');
            toast.error('Please login to manage skills');
            navigate('/login');
            return;
        }

        if (!newSkill.name.trim()) {
            console.log('Error: Empty skill name');
            toast.error('Please enter a skill name');
            return;
        }

        if (skills.some(skill => skill.name.toLowerCase() === newSkill.name.toLowerCase())) {
            console.log('Error: Duplicate skill found:', newSkill.name);
            toast.error('This skill already exists');
            return;
        }

        setSaving(true);
        try {
            console.log('Making API request to add skill:', {
                endpoint: '/skills',
                payload: newSkill
            });

            const response = await api.post('/skills', {
                name: newSkill.name,
                level: newSkill.level
            });
            
            console.log('API Response:', response.data);
            if (response.data) {
                await fetchSkills(userData);
                setNewSkill({ name: '', level: 'Beginner' });
                toast.success('Skill added successfully');
                setError(null);
            }
            console.log('=== END ADDING SKILL ===\n');
        } catch (error) {
            console.error('\n=== CLIENT ERROR: ADDING SKILL ===');
            console.error('Error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
                token: localStorage.getItem('token')
            });
            console.error('=== END ERROR ===\n');
            
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                navigate('/login');
            } else {
                const errorMessage = error.response?.data?.message || 'Failed to add skill';
                toast.error(errorMessage);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveSkill = async (skillId) => {
        console.log('\n=== CLIENT: REMOVING SKILL ===');
        console.log('Skill ID to remove:', skillId);
        setSaving(true);
        try {
            const response = await api.delete(`/skills/${skillId}`);
            console.log('API Response:', response.data);
            
            if (response.status === 200) {
                const userData = getUserData();
                await fetchSkills(userData);
                toast.success('Skill removed successfully');
            }
            console.log('=== END REMOVING SKILL ===\n');
        } catch (error) {
            console.error('\n=== CLIENT ERROR: REMOVING SKILL ===');
            console.error('Error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
                token: localStorage.getItem('token')
            });
            console.error('=== END ERROR ===\n');
            
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                navigate('/login');
            } else {
                const errorMessage = error.response?.data?.message || 'Failed to remove skill';
                toast.error(errorMessage);
            }
        } finally {
            setSaving(false);
        }
    };

    console.log('Rendering UpdateSkills component:', {
        loading,
        error,
        skillsCount: skills.length,
        saving,
        hasUser: !!getUserData()
    });

    const userData = getUserData();
    if (!userData) {
        console.log('No user in render, returning null');
        return null;
    }

    if (loading) {
        console.log('Showing loading spinner');
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        console.log('Showing error state:', error);
        return (
            <div className="container mx-auto p-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Update Skills</h2>
            
            <form onSubmit={handleAddSkill} className="mb-6">
                <div className="flex gap-4 mb-4">
                    <input
                        type="text"
                        value={newSkill.name}
                        onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                        placeholder="Enter skill name"
                        className="flex-1 p-2 border rounded"
                        disabled={saving}
                    />
                    <select
                        value={newSkill.level}
                        onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                        className="p-2 border rounded"
                        disabled={saving}
                    >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                    </select>
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                        disabled={saving}
                    >
                        {saving ? 'Adding...' : 'Add Skill'}
                    </button>
                </div>
            </form>

            <div className="space-y-4">
                {skills.length === 0 ? (
                    <p className="text-gray-500 text-center">No skills added yet</p>
                ) : (
                    skills.map((skill) => (
                        <div key={skill._id} className="flex items-center justify-between p-4 border rounded">
                            <div>
                                <span className="font-semibold">{skill.name}</span>
                                <span className="ml-2 text-gray-600">- {skill.level}</span>
                            </div>
                            <button
                                onClick={() => handleRemoveSkill(skill._id)}
                                className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                disabled={saving}
                            >
                                {saving ? 'Removing...' : 'Remove'}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default UpdateSkills; 