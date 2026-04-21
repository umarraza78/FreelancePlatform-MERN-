import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
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

export const fetchReviews = createAsyncThunk(
  'reviews/fetchReviews',
  async (projectId, { rejectWithValue }) => {
    try {
      console.log('Fetching reviews for project:', projectId);
      // Get reviews for the specific project
      const res = await api.get(`/reviews/project/${projectId}`);
      console.log('Received reviews:', res.data);
      return res.data;
    } catch (err) {
      console.error('Error fetching reviews:', err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const submitReview = createAsyncThunk(
  'reviews/submit',
  async ({ projectId, rating, comment }, thunkAPI) => {
    try {
      const response = await api.post('/reviews', {
        projectId,
        rating,
        comment
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const respondToReview = createAsyncThunk(
  'reviews/respondToReview',
  async ({ id, response }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/reviews/${id}/response`, { response });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getProjectReviews = createAsyncThunk(
  'reviews/getProjectReviews',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reviews/project/${projectId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createReview = createAsyncThunk(
  'reviews/createReview',
  async ({ projectId, rating, comment }, thunkAPI) => {
    try {
      const response = await api.post(`/reviews`, {
        projectId,
        rating,
        comment
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async ({ projectId, reviewId }, thunkAPI) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      return reviewId;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Add new thunk to get reviews by reviewer
export const getReviewsByReviewer = createAsyncThunk(
  'reviews/getReviewsByReviewer',
  async (reviewerId, { rejectWithValue }) => {
    try {
      console.log('Fetching reviews for reviewer:', reviewerId);
      // Get reviews where the user is the reviewer
      const response = await api.get(`/reviews/user/${reviewerId}`);
      console.log('Reviews response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getFreelancerReviews = createAsyncThunk(
  'reviews/getFreelancerReviews',
  async (freelancerId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reviews/freelancer/${freelancerId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  reviews: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearReviews: (state) => {
      state.reviews = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        console.log('Setting reviews in state:', action.payload);
        state.reviews = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.reviews = [];
      })
      .addCase(submitReview.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.reviews.push(action.payload);
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(respondToReview.fulfilled, (state, action) => {
        const idx = state.reviews.findIndex(r => r._id === action.payload._id);
        if (idx !== -1) state.reviews[idx] = action.payload;
      })
      .addCase(getProjectReviews.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(getProjectReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.reviews = action.payload;
      })
      .addCase(getProjectReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.reviews = [];
      })
      .addCase(createReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews.push(action.payload);
        state.success = true;
      })
      .addCase(createReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews = state.reviews.filter(
          (review) => review._id !== action.payload
        );
        state.success = true;
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getReviewsByReviewer.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(getReviewsByReviewer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.reviews = action.payload;
      })
      .addCase(getReviewsByReviewer.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.reviews = [];
      })
      .addCase(getFreelancerReviews.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(getFreelancerReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.reviews = action.payload.reviews;
        state.averageRating = action.payload.averageRating;
        state.totalReviews = action.payload.totalReviews;
      })
      .addCase(getFreelancerReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.reviews = [];
      });
  }
});

export const { reset, clearReviews } = reviewSlice.actions;
export default reviewSlice.reducer; 