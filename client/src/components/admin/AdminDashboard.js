import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaUserCheck, FaUsers, FaChartLine, FaUserTie } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        pendingVerifications: 0,
        totalUsers: 0,
        totalProjects: 0,
        totalFreelancers: 0,
        totalClients: 0,
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const [verifications, users, projects, activity] = await Promise.all([
                api.get('/admin/freelancers/pending-verification'),
                api.get('/admin/users/stats'),
                api.get('/admin/projects/stats'),
                api.get('/admin/activity')
            ]);

            setStats({
                pendingVerifications: verifications.data.length,
                totalUsers: users.data.totalUsers,
                totalProjects: projects.data.totalProjects,
                totalFreelancers: users.data.totalFreelancers,
                totalClients: users.data.totalClients,
                recentActivity: activity.data.recentActivity
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            toast.error('Failed to load dashboard data');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <FaUserCheck className="text-blue-500 text-2xl" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-gray-500 text-sm">Pending Verifications</h3>
                            <p className="text-2xl font-semibold">{stats.pendingVerifications}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-full">
                            <FaUsers className="text-green-500 text-2xl" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-gray-500 text-sm">Total Users</h3>
                            <p className="text-2xl font-semibold">{stats.totalUsers}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-full">
                            <FaUserTie className="text-purple-500 text-2xl" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-gray-500 text-sm">Total Freelancers</h3>
                            <p className="text-2xl font-semibold">{stats.totalFreelancers}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <FaUsers className="text-yellow-500 text-2xl" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-gray-500 text-sm">Total Clients</h3>
                            <p className="text-2xl font-semibold">{stats.totalClients}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link
                            to="/admin/verifications"
                            className="flex items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            <FaUserCheck className="text-blue-500 mr-2" />
                            <span>Manage Verifications</span>
                        </Link>
                        <Link
                            to="/admin/notifications"
                            className="flex items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                            <FaUsers className="text-green-500 mr-2" />
                            <span>Notification Settings</span>
                        </Link>
                        <Link
                            to="/admin/analytics"
                            className="flex items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                            <FaChartLine className="text-purple-500 mr-2" />
                            <span>View Analytics</span>
                        </Link>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        {stats.recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                    {activity.type === 'project' ? (
                                        <FaChartLine className="text-purple-500" />
                                    ) : (
                                        <FaUserCheck className="text-blue-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm">{activity.message}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(activity.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {stats.recentActivity.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No recent activity</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Verification Queue */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Pending Verifications</h2>
                    <Link
                        to="/admin/verifications"
                        className="text-blue-500 hover:text-blue-600"
                    >
                        View All
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Submitted
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stats.pendingVerifications > 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center">
                                        <Link
                                            to="/admin/verifications"
                                            className="text-blue-500 hover:text-blue-600"
                                        >
                                            View {stats.pendingVerifications} pending verifications
                                        </Link>
                                    </td>
                                </tr>
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                        No pending verifications
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard; 