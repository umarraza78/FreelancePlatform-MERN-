import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FreelancerRating } from './FreelancerRating';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';

const FreelancerList = () => {
    const [freelancers, setFreelancers] = useState([]);
    const [filteredFreelancers, setFilteredFreelancers] = useState([]);
    const [skillsMap, setSkillsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [minRating, setMinRating] = useState('');
    const [sortBy, setSortBy] = useState('rating');
    const [availableSkills, setAvailableSkills] = useState([]);

    useEffect(() => {
        const fetchFreelancersAndSkills = async () => {
            try {
                const token = localStorage.getItem('token');
                const [freelancersRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/freelancer', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                setFreelancers(freelancersRes.data);
                setFilteredFreelancers(freelancersRes.data);

                // Create a Set to store unique skills
                const uniqueSkills = new Set();
                
                // Fetch skills for each freelancer
                const skillsMap = {};
                await Promise.all(freelancersRes.data.map(async (freelancer) => {
                    try {
                        const skillsRes = await axios.get(`http://localhost:5000/api/skills/user/${freelancer._id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        skillsMap[String(freelancer._id)] = skillsRes.data;
                        
                        // Add skills to unique skills set
                        skillsRes.data.forEach(skill => {
                            uniqueSkills.add(skill.name.toLowerCase());
                        });
                    } catch (err) {
                        console.error(`Failed to fetch skills for freelancer ${freelancer._id}:`, err);
                        skillsMap[String(freelancer._id)] = [];
                    }
                }));

                // Convert Set to sorted array and update state
                const sortedSkills = Array.from(uniqueSkills).sort();
                setAvailableSkills(sortedSkills);
                setSkillsMap(skillsMap);

            } catch (err) {
                setError('Failed to fetch freelancers or skills');
            } finally {
                setLoading(false);
            }
        };
        fetchFreelancersAndSkills();
    }, []);

    useEffect(() => {
        let filtered = [...freelancers];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(freelancer =>
                freelancer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                freelancer.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply skills filter
        if (selectedSkills.length > 0) {
            filtered = filtered.filter(freelancer => {
                const freelancerSkills = skillsMap[freelancer._id] || [];
                return selectedSkills.every(skill =>
                    freelancerSkills.some(fs => fs.name.toLowerCase() === skill.toLowerCase())
                );
            });
        }

        // Apply rating filter
        if (minRating) {
            filtered = filtered.filter(freelancer => (freelancer.rating || 0) >= parseInt(minRating));
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'reviews':
                    return (b.totalReviews || 0) - (a.totalReviews || 0);
                default:
                    return 0;
            }
        });

        setFilteredFreelancers(filtered);
    }, [freelancers, searchTerm, selectedSkills, minRating, sortBy, skillsMap]);

    const handleSkillToggle = (skill) => {
        const normalizedSkill = skill.toLowerCase();
        setSelectedSkills(prev =>
            prev.includes(normalizedSkill)
                ? prev.filter(s => s !== normalizedSkill)
                : [...prev, normalizedSkill]
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedSkills([]);
        setMinRating('');
        setSortBy('rating');
    };

    if (loading) return <div className="p-8 text-center">Loading freelancers...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-6">Browse Freelancers</h1>

                {/* Search and Filter Header */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search freelancers by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        <FaFilter />
                        Filters
                    </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Filters</h2>
                            <button
                                onClick={clearFilters}
                                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                            >
                                <FaTimes />
                                Clear All
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Skills Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Skills
                                </label>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {Array.from(new Set(availableSkills)).map((skill) => (
                                        <label key={skill} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedSkills.includes(skill.toLowerCase())}
                                                onChange={() => handleSkillToggle(skill.toLowerCase())}
                                                className="rounded text-blue-600"
                                            />
                                            <span className="ml-2">{skill}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Rating Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Minimum Rating
                                </label>
                                <select
                                    value={minRating}
                                    onChange={(e) => setMinRating(e.target.value)}
                                    className="w-full rounded-md border-gray-300"
                                >
                                    <option value="">Any Rating</option>
                                    <option value="4">4+ Stars</option>
                                    <option value="3">3+ Stars</option>
                                    <option value="2">2+ Stars</option>
                                </select>
                            </div>

                            {/* Sort Options */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sort By
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full rounded-md border-gray-300"
                                >
                                    <option value="rating">Highest Rated</option>
                                    <option value="reviews">Most Reviews</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFreelancers.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                        <p className="text-gray-500">No freelancers found matching your criteria</p>
                    </div>
                ) : (
                    filteredFreelancers.map(freelancer => {
                        const freelancerId = String(freelancer._id);
                        const skills = skillsMap[freelancerId] || [];
                        return (
                            <div key={freelancer._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-semibold">{freelancer.name}</h2>
                                        <p className="text-gray-600">{freelancer.email}</p>
                                    </div>
                                    <FreelancerRating freelancerId={freelancer._id} />
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Skills:</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {skills && skills.length > 0 ? (
                                            skills.map((skill, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                                                >
                                                    {skill.name} ({skill.level})
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-500">No skills listed</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default FreelancerList; 