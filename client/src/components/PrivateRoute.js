import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = () => {
    const { user, isLoading } = useSelector((state) => state.auth);
    const location = useLocation();
    
    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }
    
    // Check for both user and token
    const token = localStorage.getItem('token');
    if (!user || !token) {
        return <Navigate to="/login" state={{ from: location }} />;
    }

    // Check for admin routes
    if (location.pathname.startsWith('/admin') && user.role !== 'admin') {
        return <Navigate to="/" />;
    }

    // Check for client analytics
    if (location.pathname === '/analytics' && user.role !== 'client') {
        return <Navigate to="/" />;
    }
    
    return <Outlet />;
};

export default PrivateRoute; 