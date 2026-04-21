import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { updateProfile, getCurrentUser } from '../features/auth/authSlice';

const SkillsManagement = () => {
    const dispatch = useDispatch();
    const { user, isLoading } = useSelector((state) => state.auth);
    
    useEffect(() => {
        if (!user) {
            dispatch(getCurrentUser());
        }
    }, [dispatch, user]);

    const [newSkill, setNewSkill] = useState({
        name: '',
        level: 'Intermediate'
    });

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto text-center">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto text-center">
                    <p>Please log in to manage your skills</p>
                </div>
            </div>
        );
    }

    const handleAddSkill = async () => {
        try {
            if (!newSkill.name.trim()) {
                toast.error('Please enter a skill name');
                return;
            }

            const updatedSkills = user.skills ? [...user.skills, newSkill] : [newSkill];
            await dispatch(updateProfile({
                ...user,
                skills: updatedSkills
            })).unwrap();

            toast.success('Skill added successfully');
            setNewSkill({ name: '', level: 'Intermediate' });
        } catch (error) {
            toast.error(error.message || 'Failed to add skill');
        }
    };

    const handleRemoveSkill = async (skillToRemove) => {
        try {
            const updatedSkills = user.skills ? user.skills.filter(skill => skill.name !== skillToRemove.name) : [];
            await dispatch(updateProfile({
                ...user,
                skills: updatedSkills
            })).unwrap();

            toast.success('Skill removed successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to remove skill');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Manage Your Skills</h1>

                {/* Add New Skill */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Add New Skill</h2>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={newSkill.name}
                            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                            placeholder="Enter skill name"
                            className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={newSkill.level}
                            onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Expert">Expert</option>
                        </select>
                        <button
                            onClick={handleAddSkill}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                        >
                            <FaPlus className="mr-2" />
                            Add
                        </button>
                    </div>
                </div>

                {/* Current Skills */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Current Skills</h2>
                    {!user.skills || user.skills.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No skills added yet</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {user.skills.map((skill, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                                >
                                    <div>
                                        <h3 className="font-semibold">{skill.name}</h3>
                                        <p className="text-sm text-gray-600">{skill.level}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveSkill(skill)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Skill Level Guide */}
                <div className="mt-8 bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Skill Level Guide</h3>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold">Beginner</h4>
                            <p className="text-sm text-gray-600">Basic understanding and some practical experience</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">Intermediate</h4>
                            <p className="text-sm text-gray-600">Good working knowledge and regular practical application</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">Expert</h4>
                            <p className="text-sm text-gray-600">Advanced knowledge and extensive practical experience</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkillsManagement; 