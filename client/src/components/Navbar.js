import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';

const Navbar = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-lg">
            <div className="container mx-auto px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <Link to="/" className="text-xl font-bold text-gray-800">
                            Freelance Platform
                        </Link>
                        {user && user.role !== 'admin' && (
                            <div className="hidden md:flex items-center space-x-4">
                                <Link
                                    to="/projects"
                                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Projects
                                </Link>
                                {user.role === 'client' && (
                                    <Link
                                        to="/projects/new"
                                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Create Project
                                    </Link>
                                )}
                                <Link
                                    to="/profile"
                                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Profile
                                </Link>
                                {user.role === 'freelancer' && (
                                    <>
                                        <Link
                                            to="/profile/skills"
                                            className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                        >
                                            Skills
                                        </Link>
                                        <Link
                                            to="/profile/portfolio"
                                            className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                        >
                                            Portfolio
                                        </Link>
                                    </>
                                )}
                            </div>
                        )}
                        {user && user.role === 'admin' && (
                            <div className="hidden md:flex items-center space-x-4">
                                <Link
                                    to="/admin/dashboard"
                                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/admin/verifications"
                                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Verifications
                                </Link>
                                <Link
                                    to="/admin/analytics"
                                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Analytics
                                </Link>
                                <Link
                                    to="/admin/notifications"
                                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Notifications
                                </Link>
                            </div>
                        )}
                    </div>

                    {user ? (
                        <div className="flex items-center space-x-4">
                            <div className="relative group">
                                <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                                    <span className="text-sm font-medium">{user.name}</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                                    {user.role !== 'admin' && (
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            My Profile
                                        </Link>
                                    )}
                                    {user.role === 'freelancer' && (
                                        <>
                                            <Link
                                                to="/profile/skills"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Manage Skills
                                            </Link>
                                            <Link
                                                to="/profile/portfolio"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Manage Portfolio
                                            </Link>
                                        </>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/login"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600"
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 