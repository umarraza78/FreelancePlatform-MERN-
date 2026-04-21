import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import projectReducer from './features/projects/projectSlice';
import reviewReducer from './features/reviews/reviewSlice';
import userReducer from './features/users/userSlice';
import messageReducer from './features/messages/messageSlice';
import analyticsReducer from './features/analytics/analyticsSlice';
import freelancerReducer from './features/freelancers/freelancerSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        projects: projectReducer,
        reviews: reviewReducer,
        users: userReducer,
        messages: messageReducer,
        analytics: analyticsReducer,
        freelancer: freelancerReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false
        })
});

export default store; 