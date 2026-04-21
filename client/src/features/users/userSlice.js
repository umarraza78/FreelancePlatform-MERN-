import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with auth header
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Fetch freelancer profile
export const fetchFreelancerProfile = createAsyncThunk(
    'users/fetchFreelancerProfile',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.get(`/users/freelancer/${id}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch freelancer profile');
        }
    }
);

// Update freelancer profile
export const updateFreelancerProfile = createAsyncThunk(
    'users/updateFreelancerProfile',
    async (profileData, { rejectWithValue }) => {
        try {
            const response = await api.put(`/users/freelancer/profile`, profileData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
        }
    }
);

// Add experience
export const addExperience = createAsyncThunk(
    'users/addExperience',
    async (experienceData, { rejectWithValue }) => {
        try {
            const response = await api.post(`/users/freelancer/experience`, experienceData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add experience');
        }
    }
);

// Update experience
export const updateExperience = createAsyncThunk(
    'users/updateExperience',
    async ({ experienceId, experienceData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/users/freelancer/experience/${experienceId}`, experienceData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update experience');
        }
    }
);

// Delete experience
export const deleteExperience = createAsyncThunk(
    'users/deleteExperience',
    async (experienceId, { rejectWithValue }) => {
        try {
            const response = await api.delete(`/users/freelancer/experience/${experienceId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete experience');
        }
    }
);

const initialState = {
    freelancer: null,
    isLoading: false,
    isError: false,
    message: '',
    isSuccess: false
};

const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        resetUserState: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.isSuccess = false;
            state.message = '';
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch freelancer profile
            .addCase(fetchFreelancerProfile.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = '';
            })
            .addCase(fetchFreelancerProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.freelancer = action.payload;
            })
            .addCase(fetchFreelancerProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.freelancer = null;
            })
            // Update freelancer profile
            .addCase(updateFreelancerProfile.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = '';
            })
            .addCase(updateFreelancerProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.freelancer = action.payload;
            })
            .addCase(updateFreelancerProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Add experience
            .addCase(addExperience.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = '';
            })
            .addCase(addExperience.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.freelancer = action.payload;
            })
            .addCase(addExperience.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update experience
            .addCase(updateExperience.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = '';
            })
            .addCase(updateExperience.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.freelancer = action.payload;
            })
            .addCase(updateExperience.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Delete experience
            .addCase(deleteExperience.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = '';
            })
            .addCase(deleteExperience.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.freelancer = action.payload;
            })
            .addCase(deleteExperience.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    }
});

export const { resetUserState } = userSlice.actions;
export default userSlice.reducer; 