import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import SHA256 from 'crypto-js/sha256';

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

// Hash message metadata
const hashMetadata = (metadata) => {
    return SHA256(JSON.stringify(metadata)).toString();
};

// Fetch messages
export const fetchMessages = createAsyncThunk(
    'messages/fetchMessages',
    async ({ projectId, recipientId }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/messages/${projectId}/${recipientId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
        }
    }
);

// Send message
export const sendMessage = createAsyncThunk(
    'messages/sendMessage',
    async (messageData, { rejectWithValue }) => {
        try {
            // Hash metadata before sending
            const metadata = {
                sender: messageData.sender,
                recipient: messageData.recipientId,
                timestamp: messageData.timestamp,
                projectId: messageData.projectId
            };
            const metadataHash = hashMetadata(metadata);

            const response = await api.post('/messages', {
                ...messageData,
                metadataHash
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to send message');
        }
    }
);

// Mark message as read
export const markMessageRead = createAsyncThunk(
    'messages/markMessageRead',
    async (messageId, { rejectWithValue }) => {
        try {
            const response = await api.put(`/messages/${messageId}/read`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to mark message as read');
        }
    }
);

const initialState = {
    messages: [],
    isLoading: false,
    isError: false,
    message: ''
};

const messageSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        resetMessages: (state) => {
            state.messages = [];
            state.isLoading = false;
            state.isError = false;
            state.message = '';
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        updateMessageReadStatus: (state, action) => {
            const index = state.messages.findIndex(msg => msg._id === action.payload);
            if (index !== -1) {
                state.messages[index].read = true;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMessages.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = '';
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.isLoading = false;
                state.messages = action.payload;
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(sendMessage.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = '';
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                state.isLoading = false;
                state.messages.push(action.payload);
            })
            .addCase(sendMessage.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(markMessageRead.fulfilled, (state, action) => {
                const index = state.messages.findIndex(msg => msg._id === action.payload._id);
                if (index !== -1) {
                    state.messages[index].read = true;
                }
            });
    }
});

export const { resetMessages, addMessage, updateMessageReadStatus } = messageSlice.actions;
export default messageSlice.reducer; 