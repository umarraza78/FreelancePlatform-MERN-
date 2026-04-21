import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Get user from localStorage
const user = JSON.parse(localStorage.getItem('user'));

const initialState = {
    user: user || null,
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: ''
};

// Register user
export const register = createAsyncThunk(
    'auth/register',
    async (userData, thunkAPI) => {
        try {
            const response = await api.post('/auth/register', userData);
            if (response.data) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Login user
export const login = createAsyncThunk(
    'auth/login',
    async (userData, thunkAPI) => {
        try {
            console.log('Attempting login with:', userData.email);
            const response = await api.post('/auth/login', userData);
            console.log('Login response:', response.data);
            if (response.data) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            const message = error.response?.data?.message || error.message;
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get current user
export const getCurrentUser = createAsyncThunk(
    'auth/getCurrentUser',
    async (_, thunkAPI) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return thunkAPI.rejectWithValue('No token found');
            }
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Logout user
export const logout = createAsyncThunk('auth/logout', async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
});

// Update user profile
export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (userData, { rejectWithValue, getState }) => {
        try {
            const { user } = getState().auth;
            const endpoint = user.role === 'freelancer' ? '/freelancers/profile' : '/clients/profile';
            const response = await api.put(endpoint, userData);
            if (response.data) {
                localStorage.setItem('user', JSON.stringify(response.data));
                return response.data;
            }
            return rejectWithValue('Profile update failed: No data received');
        } catch (error) {
            console.error('Profile update error:', error);
            return rejectWithValue(
                error.response?.data?.message || 
                error.message || 
                'Profile update failed'
            );
        }
    }
);

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        clearError: (state) => {
            state.isError = false;
            state.message = '';
        }
    },
    extraReducers: (builder) => {
        builder
            // Register cases
            .addCase(register.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload.user;
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.user = null;
            })
            // Login cases
            .addCase(login.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload.user;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.user = null;
            })
            // Get current user cases
            .addCase(getCurrentUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload;
            })
            .addCase(getCurrentUser.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Logout cases
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
            })
            // Update profile cases
            .addCase(updateProfile.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.isSuccess = false;
                state.message = '';
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    }
});

export const { reset, clearError } = authSlice.actions;
export default authSlice.reducer; 