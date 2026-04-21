import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const EarningsOverview = () => {
    const [earningsData, setEarningsData] = useState({
        total: 0,
        monthly: 0,
        history: [],
        monthlyData: []
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchEarningsData();
    }, []);

    const fetchEarningsData = async () => {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));
            
            console.log('Fetching earnings with:', {
                token: token ? 'Present' : 'Missing',
                user: user ? {
                    id: user.id,
                    role: user.role
                } : 'Missing'
            });

            if (!token) {
                console.log('No token found, redirecting to login');
                navigate('/login');
                return;
            }

            if (!user || user.role !== 'freelancer') {
                console.log('User is not a freelancer:', user?.role);
                toast.error('Only freelancers can view earnings');
                navigate('/');
                return;
            }

            console.log('Making API request to /users/earnings');
            const response = await api.get('/users/earnings');
            
            console.log('Earnings response:', response.data);
            setEarningsData(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching earnings:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    baseURL: error.config?.baseURL,
                    headers: error.config?.headers
                }
            });

            const errorMessage = error?.response?.data?.message || 'Failed to load earnings data';
            toast.error(errorMessage);
            
            if (error?.response?.status === 401) {
                console.log('Unauthorized, clearing token and redirecting');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else if (error?.response?.status === 403) {
                console.log('Forbidden - not a freelancer');
                navigate('/');
            }
            
            setLoading(false);
        }
    };

    const chartData = {
        labels: earningsData.monthlyData.map(data => {
            const [year, month] = data.month.split('-');
            return `${new Date(year, month - 1).toLocaleString('default', { month: 'short' })} ${year}`;
        }),
        datasets: [
            {
                label: 'Monthly Earnings',
                data: earningsData.monthlyData.map(data => data.amount),
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Monthly Earnings Overview'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return '$' + value;
                    }
                }
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Earnings Overview</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Earnings</h2>
                    <p className="text-3xl font-bold text-green-600">${earningsData.total.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">This Month</h2>
                    <p className="text-3xl font-bold text-blue-600">${earningsData.monthly.toFixed(2)}</p>
                </div>
            </div>

            {/* Earnings Chart */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                {earningsData.monthlyData.length > 0 ? (
                    <Line data={chartData} options={chartOptions} />
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No earnings data available to display chart
                    </div>
                )}
            </div>

            {/* Recent Earnings History */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Earnings History</h2>
                <div className="overflow-x-auto">
                    {earningsData.history.length > 0 ? (
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Project
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Client
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {earningsData.history.map((earning) => (
                                    <tr key={earning._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(earning.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {earning.project?.title || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {earning.project?.client?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                                            ${earning.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No earnings history available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EarningsOverview; 