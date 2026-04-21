import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    config.headers.Authorization = `Bearer ${token}`;
    console.log('API Request:', {
        url: config.url,
        method: config.method,
        headers: config.headers
    });
    return config;
}, (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => {
        console.log('API Response:', {
            url: response.config.url,
            status: response.status,
            data: response.data
        });
        return response;
    },
    (error) => {
        console.error('API Error:', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.response?.data?.message || error.message
        });
        return Promise.reject(error);
    }
);

// Get freelancer profile
export const getFreelancerProfile = createAsyncThunk(
    'freelancer/getProfile',
    async (id, thunkAPI) => {
        try {
            console.log('Fetching freelancer profile for id:', id);
            const response = await api.get(`/freelancers/profile/${id}`);
            console.log('Received freelancer profile:', response.data);
            return response.data;
        } catch (error) {
            console.error('Profile fetch error:', error);
            const message = error.response?.data?.message || error.message || 'Failed to fetch profile';
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Update freelancer profile
export const updateProfile = createAsyncThunk(
    'freelancer/updateProfile',
    async ({ userId, ...profileData }, thunkAPI) => {
        try {
            console.log('Updating freelancer profile:', profileData);
            const response = await api.put('/freelancers/profile', profileData);
            console.log('Profile update response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Profile update error:', error);
            const message = error.response?.data?.message || error.message || 'Failed to update profile';
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Add skill
export const addSkill = createAsyncThunk(
    'freelancer/addSkill',
    async ({ skill, userId }, thunkAPI) => {
        try {
            let payload;
            if (typeof skill === 'string') {
                payload = { name: skill, level: 'Beginner' };
            } else {
                payload = skill;
            }
            const response = await api.post(`/skills`, payload);
            // Re-fetch the updated profile after adding a skill
            const profileRes = await api.get(`/freelancers/profile/${userId}`);
            return profileRes.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add skill');
        }
    }
);

// Remove skill
export const removeSkill = createAsyncThunk(
    'freelancer/removeSkill',
    async ({ skillId }, thunkAPI) => {
        try {
            const response = await api.delete(`/skills/${skillId}`);
            return { id: skillId };
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to remove skill');
        }
    }
);

// Add portfolio item
export const addPortfolioItem = createAsyncThunk(
    'freelancer/addPortfolioItem',
    async (portfolioData, thunkAPI) => {
        try {
            console.log('Adding portfolio item:', portfolioData);
            const response = await api.post('/freelancers/portfolio', portfolioData);
            console.log('Portfolio item added:', response.data);
            return response.data;
        } catch (error) {
            console.error('Add portfolio error:', error);
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Remove portfolio item
export const removePortfolioItem = createAsyncThunk(
    'freelancer/removePortfolioItem',
    async (itemId, thunkAPI) => {
        try {
            console.log('Removing portfolio item:', itemId);
            const response = await api.delete(`/freelancers/portfolio/${itemId}`);
            console.log('Portfolio item removed:', response.data);
            return response.data;
        } catch (error) {
            console.error('Remove portfolio error:', error);
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Submit bid
export const submitBid = createAsyncThunk(
    'freelancer/submitBid',
    async (bidData, thunkAPI) => {
        try {
            const response = await api.post(`/freelancers/bids`, bidData);
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);

// Fetch bids
export const fetchBids = createAsyncThunk(
    'freelancer/fetchBids',
    async (freelancerId, thunkAPI) => {
        try {
            const response = await api.get(`/freelancers/bids/${freelancerId}`);
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);

// Fetch freelancer stats
export const fetchFreelancerStats = createAsyncThunk(
    'freelancer/fetchStats',
    async (userId, thunkAPI) => {
        try {
            console.log('Fetching freelancer stats for user:', userId);
            const response = await api.get(`/freelancers/stats/${userId}`);
            console.log('Received freelancer stats:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching freelancer stats:', error);
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const initialState = {
    profile: null,
    bids: [],
    stats: {
        rating: 0,
        totalReviews: 0,
        completedProjects: 0
    },
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
};

const freelancerSlice = createSlice({
    name: 'freelancer',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            // Get Profile
            .addCase(getFreelancerProfile.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getFreelancerProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.profile = action.payload;
            })
            .addCase(getFreelancerProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.profile = null;
            })
            // Update Profile
            .addCase(updateProfile.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.profile = action.payload;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Add Skill
            .addCase(addSkill.fulfilled, (state, action) => {
                state.profile = action.payload;
                state.isSuccess = true;
            })
            // Remove Skill
            .addCase(removeSkill.fulfilled, (state, action) => {
                state.profile.skills = state.profile.skills.filter(
                    skill => skill._id !== action.payload.id
                );
                state.isSuccess = true;
            })
            // Add Portfolio Item
            .addCase(addPortfolioItem.fulfilled, (state, action) => {
                state.profile.portfolio.push(action.payload);
                state.isSuccess = true;
            })
            // Remove Portfolio Item
            .addCase(removePortfolioItem.fulfilled, (state, action) => {
                state.profile.portfolio = state.profile.portfolio.filter(
                    item => item._id !== action.payload.id
                );
                state.isSuccess = true;
            })
            // Submit Bid
            .addCase(submitBid.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(submitBid.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.bids.push(action.payload);
            })
            .addCase(submitBid.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Fetch Bids
            .addCase(fetchBids.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchBids.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.bids = action.payload;
            })
            .addCase(fetchBids.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.bids = [];
            })
            // Fetch Stats
            .addCase(fetchFreelancerStats.pending, (state) => {
                console.log('fetchFreelancerStats.pending');
                state.isLoading = true;
                state.isError = false;
                state.message = '';
            })
            .addCase(fetchFreelancerStats.fulfilled, (state, action) => {
                console.log('fetchFreelancerStats.fulfilled:', action.payload);
                state.isLoading = false;
                state.isSuccess = true;
                state.stats = action.payload;
            })
            .addCase(fetchFreelancerStats.rejected, (state, action) => {
                console.log('fetchFreelancerStats.rejected:', action.payload);
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset } = freelancerSlice.actions;
export default freelancerSlice.reducer; 