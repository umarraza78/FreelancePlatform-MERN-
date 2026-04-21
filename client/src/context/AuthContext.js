import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check for stored token and user data
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            setUser(JSON.parse(userData));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const register = async (userData) => {
        try {
            setError(null);
            const response = await api.post('/auth/register', userData);
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            
            return { success: true };
        } catch (error) {
            setError(error.response?.data?.message || 'Registration failed');
            return { success: false, error: error.response?.data?.message };
        }
    };

    const login = async (credentials) => {
        try {
            setError(null);
            const response = await api.post('/auth/login', credentials);
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            
            return { success: true };
        } catch (error) {
            setError(error.response?.data?.message || 'Login failed');
            return { success: false, error: error.response?.data?.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const verifyEmail = async (token) => {
        try {
            setError(null);
            await api.post('/auth/verify-email', { token });
            return { success: true };
        } catch (error) {
            setError(error.response?.data?.message || 'Email verification failed');
            return { success: false, error: error.response?.data?.message };
        }
    };

    const verifyPhone = async (code, phone) => {
        try {
            setError(null);
            await api.post('/auth/verify-phone', { code, phone });
            return { success: true };
        } catch (error) {
            setError(error.response?.data?.message || 'Phone verification failed');
            return { success: false, error: error.response?.data?.message };
        }
    };

    const resendVerificationEmail = async (email) => {
        try {
            setError(null);
            await api.post('/auth/resend-verification-email', { email });
            return { success: true };
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to resend verification email');
            return { success: false, error: error.response?.data?.message };
        }
    };

    const value = {
        user,
        loading,
        error,
        register,
        login,
        logout,
        verifyEmail,
        verifyPhone,
        resendVerificationEmail
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}; 