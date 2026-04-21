import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
});

// Add response interceptor for better error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// Async thunks
export const getProjects = createAsyncThunk(
    'projects/getAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/projects');
            return response.data;
        } catch (error) {
            console.error('Get Projects Error:', error);
            return rejectWithValue(
                error.response?.data?.message || 
                error.message || 
                'Failed to fetch projects. Please check your connection and try again.'
            );
        }
    }
);

export const getProjectById = createAsyncThunk(
    'projects/getById',
    async (id, { rejectWithValue }) => {
        try {
            if (!id) {
                throw new Error('Project ID is required');
            }

            // Validate MongoDB ObjectId format
            if (!/^[0-9a-fA-F]{24}$/.test(id)) {
                throw new Error('Invalid project ID format');
            }

            const response = await api.get(`/projects/${id}`);
            if (!response.data) {
                throw new Error('Project not found');
            }
            return response.data;
        } catch (error) {
            console.error('Get Project By ID Error:', error);
            if (error.message === 'Invalid project ID format' || error.message === 'Project ID is required') {
                return rejectWithValue(error.message);
            }
            return rejectWithValue(
                error.response?.data?.message || 
                error.message || 
                'Failed to fetch project details'
            );
        }
    }
);

export const createProject = createAsyncThunk(
    'projects/create',
    async (projectData, { rejectWithValue }) => {
        try {
            const response = await api.post('/projects', projectData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateProject = createAsyncThunk(
    'projects/updateProject',
    async (projectData, { rejectWithValue }) => {
        try {
            const response = await api.put(`/projects/${projectData.id}`, projectData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateProjectStatus = createAsyncThunk(
    'projects/updateStatus',
    async ({ id, status }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/projects/${id}/status`, { status });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteProject = createAsyncThunk(
    'projects/delete',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/projects/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const submitBid = createAsyncThunk(
    'projects/submitBid',
    async ({ projectId, bidData }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/projects/${projectId}/bids`, bidData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const acceptBid = createAsyncThunk(
    'projects/acceptBid',
    async ({ projectId, bidId }, { rejectWithValue }) => {
        try {
            console.log('Accepting bid:', { projectId, bidId });
            // Accept the bid and update project status in one request
            const response = await api.put(`/projects/${projectId}/bids/${bidId}/accept`, {
                updateStatus: true, // Tell backend to update project status
                rejectOthers: true  // Tell backend to reject other bids
            });
            return response.data;
        } catch (error) {
            console.error('Accept bid error:', error.response || error);
            return rejectWithValue(
                error.response?.data?.message || 
                error.message || 
                'Failed to accept bid. Please try again.'
            );
        }
    }
);

export const rejectBid = createAsyncThunk(
    'projects/rejectBid',
    async ({ projectId, bidId }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/projects/${projectId}/bids/${bidId}/reject`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const addMilestone = createAsyncThunk(
    'projects/addMilestone',
    async ({ projectId, milestoneData }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/projects/${projectId}/milestones`, milestoneData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateMilestoneStatus = createAsyncThunk(
    'projects/updateMilestoneStatus',
    async ({ projectId, milestoneId, status }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/projects/${projectId}/milestones/${milestoneId}/status`, { status });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const sendCounterOffer = createAsyncThunk(
    'projects/sendCounterOffer',
    async ({ projectId, bidId, amount, message }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/projects/${projectId}/bids/${bidId}/counter`, { amount, message });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const completeProject = createAsyncThunk(
    'projects/completeProject',
    async (projectId, { rejectWithValue }) => {
        try {
            const response = await api.put(`/projects/${projectId}/complete`);
            
            // Return both project and user data
            return {
                project: response.data.project,
                user: response.data.user
            };
        } catch (error) {
            console.error('Complete project error:', error.response || error);
            return rejectWithValue(
                error.response?.data?.message || 
                error.message || 
                'Failed to complete project. Please try again.'
            );
        }
    }
);

// Initial state
const initialState = {
    projects: [],
    project: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: '',
};

// Slice
const projectSlice = createSlice({
    name: 'projects',
    initialState,
    reducers: {
        resetProjectState: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.isSuccess = false;
            state.message = '';
        }
    },
    extraReducers: (builder) => {
        builder
            // Get all projects
            .addCase(getProjects.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getProjects.fulfilled, (state, action) => {
                state.isLoading = false;
                state.projects = action.payload;
            })
            .addCase(getProjects.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.message || 'Failed to fetch projects';
            })
            // Get project by ID
            .addCase(getProjectById.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = '';
            })
            .addCase(getProjectById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.project = action.payload;
                state.isError = false;
                state.message = '';
            })
            .addCase(getProjectById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.message || 'Failed to fetch project';
            })
            // Create project
            .addCase(createProject.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createProject.fulfilled, (state, action) => {
                state.isLoading = false;
                state.projects.push(action.payload);
            })
            .addCase(createProject.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.message || 'Failed to create project';
            })
            // Update project
            .addCase(updateProject.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateProject.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.project = action.payload;
                // Update the project in the projects array if it exists
                if (state.projects) {
                    state.projects = state.projects.map(project =>
                        project._id === action.payload._id ? action.payload : project
                    );
                }
            })
            .addCase(updateProject.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update project status
            .addCase(updateProjectStatus.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateProjectStatus.fulfilled, (state, action) => {
                state.isLoading = false;
                state.projects = state.projects.map(project =>
                    project._id === action.payload._id ? action.payload : project
                );
                if (state.project?._id === action.payload._id) {
                    state.project = action.payload;
                }
            })
            .addCase(updateProjectStatus.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.message || 'Failed to update project status';
            })
            // Delete project
            .addCase(deleteProject.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteProject.fulfilled, (state, action) => {
                state.isLoading = false;
                state.projects = state.projects.filter(project => project._id !== action.payload);
                if (state.project?._id === action.payload) {
                    state.project = null;
                }
            })
            .addCase(deleteProject.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload?.message || 'Failed to delete project';
            })
            // Accept bid
            .addCase(acceptBid.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = '';
            })
            .addCase(acceptBid.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;
                state.message = '';
                // Update the project with the accepted bid, assigned freelancer, and new status
                if (action.payload) {
                    state.project = action.payload;
                    // Also update the project in the projects array if it exists
                    if (state.projects) {
                        state.projects = state.projects.map(project => 
                            project._id === action.payload._id ? action.payload : project
                        );
                    }
                }
            })
            .addCase(acceptBid.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || 'Failed to accept bid';
            })
            // Complete project
            .addCase(completeProject.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(completeProject.fulfilled, (state, action) => {
                state.isLoading = false;
                // Update the project in projects array
                state.projects = state.projects.map(project =>
                    project._id === action.payload.project._id ? action.payload.project : project
                );
                // Update current project if it matches
                if (state.project?._id === action.payload.project._id) {
                    state.project = action.payload.project;
                }
            })
            .addCase(completeProject.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    }
});

export const { resetProjectState } = projectSlice.actions;
export default projectSlice.reducer; 