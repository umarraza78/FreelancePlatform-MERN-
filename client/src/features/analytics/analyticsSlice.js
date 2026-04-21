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

// Fetch analytics data
export const fetchAnalytics = createAsyncThunk(
    'analytics/fetchAnalytics',
    async ({ startDate, endDate, clientId }, { rejectWithValue }) => {
        try {
            const response = await api.get('/analytics', {
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    ...(clientId ? { clientId } : {})
                }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
        }
    }
);

// Export analytics data
export const exportAnalytics = createAsyncThunk(
    'analytics/exportAnalytics',
    async ({ startDate, endDate, format }, { rejectWithValue }) => {
        try {
            const response = await api.get('/analytics/export', {
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    format
                },
                responseType: format === 'csv' ? 'blob' : 'json'
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to export analytics');
        }
    }
);

const initialState = {
    analytics: {
        projectData: [],
        revenueData: [],
        freelancerData: [],
        performanceData: {
            excellent: 0,
            good: 0,
            average: 0,
            poor: 0
        },
        totalProjects: 0,
        totalRevenue: 0,
        activeFreelancers: 0,
        averageRating: 0
    },
    isLoading: false,
    isError: false,
    message: ''
};

const analyticsSlice = createSlice({
    name: 'analytics',
    initialState,
    reducers: {
        resetAnalytics: (state) => {
            state.analytics = initialState.analytics;
            state.isLoading = false;
            state.isError = false;
            state.message = '';
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAnalytics.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = '';
            })
            .addCase(fetchAnalytics.fulfilled, (state, action) => {
                state.isLoading = false;
                state.analytics = action.payload;
            })
            .addCase(fetchAnalytics.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(exportAnalytics.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = '';
            })
            .addCase(exportAnalytics.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(exportAnalytics.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    }
});

export const { resetAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer; 