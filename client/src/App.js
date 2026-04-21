import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import ClientDashboard from './components/ClientDashboard';
import FreelancerDashboard from './components/FreelancerDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import Login from './components/Login';
import Register from './components/Register';
import ProjectForm from './components/ProjectForm';
import ProjectDetail from './components/ProjectDetail';
import ProjectList from './components/ProjectList';
import Profile from './components/Profile';
import Chat from './components/Chat';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AdminAnalytics from './components/admin/AdminAnalytics';
import PrivateRoute from './components/PrivateRoute';
import UpdateSkills from './components/UpdateSkills';
import PortfolioManagement from './components/PortfolioManagement';
import CreateProject from './components/CreateProject';
import EditProject from './components/EditProject';
import EarningsOverview from './components/EarningsOverview';
import FreelancerList from './components/FreelancerList';
import { useDispatch } from 'react-redux';
import { getCurrentUser } from './features/auth/authSlice';
import FreelancerVerification from './components/admin/FreelancerVerification';
import NotificationSettings from './components/admin/NotificationSettings';

function App() {
    const dispatch = useDispatch();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            dispatch(getCurrentUser());
        }
    }, [dispatch]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route element={<PrivateRoute />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/verifications" element={<FreelancerVerification />} />
                    <Route path="/admin/notifications" element={<NotificationSettings />} />
                    <Route path="/freelancer/dashboard" element={<FreelancerDashboard />} />
                    <Route path="/client/dashboard" element={<ClientDashboard />} />
                    <Route path="/freelancers" element={<FreelancerList />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/skills" element={<UpdateSkills />} />
                    <Route path="/skills" element={<Navigate to="/profile/skills" replace />} />
                    <Route path="/projects" element={<ProjectList />} />
                    <Route path="/projects/new" element={<ProjectForm />} />
                    <Route path="/projects/:id" element={<ProjectDetail />} />
                    <Route path="/projects/:id/edit" element={<EditProject />} />
                    <Route path="/profile/portfolio" element={<PortfolioManagement />} />
                    <Route path="/chat/:projectId?" element={<Chat />} />
                    <Route path="/analytics" element={<AnalyticsDashboard />} />
                    <Route path="/admin/analytics" element={<AdminAnalytics />} />
                    <Route path="/create-project" element={<CreateProject />} />
                    <Route path="/earnings" element={<EarningsOverview />} />
                </Route>

                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/portfolio" element={<Navigate to="/profile/portfolio" replace />} />
            </Routes>
            <ToastContainer />
        </div>
    );
}

export default App; 