import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { FaUsers, FaProjectDiagram, FaDollarSign, FaChartLine } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const AdminAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        userGrowth: [],
        revenue: [],
        totalRevenue: 0,
        projectStats: {},
        skillStats: [],
        transactions: []
    });
    const [timeRange, setTimeRange] = useState('month'); // month, quarter, year

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        try {
            const [userStats, revenueStats, projectStats, skillStats, transactionStats] = await Promise.all([
                api.get(`/admin/analytics/users?range=${timeRange}`),
                api.get(`/admin/analytics/revenue?range=${timeRange}`),
                api.get('/admin/analytics/projects'),
                api.get('/admin/analytics/skills'),
                api.get(`/admin/analytics/transactions?range=${timeRange}`)
            ]);

            setStats({
                userGrowth: userStats.data,
                revenue: revenueStats.data.revenueData,
                totalRevenue: revenueStats.data.totalEarnings,
                projectStats: projectStats.data,
                skillStats: skillStats.data,
                transactions: transactionStats.data
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics data');
            setLoading(false);
        }
    };

    const userGrowthData = {
        labels: stats.userGrowth.map(item => item.date),
        datasets: [{
            label: 'New Users',
            data: stats.userGrowth.map(item => item.count),
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    const revenueData = {
        labels: stats.revenue.map(item => item.date),
        datasets: [{
            label: 'Platform Revenue',
            data: stats.revenue.map(item => item.amount),
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
        }]
    };

    const skillsData = {
        labels: stats.skillStats.map(skill => skill.name),
        datasets: [{
            data: stats.skillStats.map(skill => skill.count),
            backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(153, 102, 255, 0.5)',
            ]
        }]
    };

    // Add a tooltip callback to show skill levels
    const skillsChartOptions = {
        responsive: true,
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const skill = stats.skillStats[context.dataIndex];
                        const levels = skill.levels.reduce((acc, level) => {
                            acc[level] = (acc[level] || 0) + 1;
                            return acc;
                        }, {});
                        
                        const levelBreakdown = Object.entries(levels)
                            .map(([level, count]) => `${level}: ${count}`)
                            .join(', ');
                            
                        return [
                            `Total: ${skill.count}`,
                            `Levels: ${levelBreakdown}`
                        ];
                    }
                }
            }
        }
    };

    // Calculate growth rate
    const calculateGrowthRate = (data) => {
        if (!data || data.length < 2) return 0;
        
        // Get first and last period counts
        const oldestCount = data[0].count;
        const newestCount = data[data.length - 1].count;
        
        // Calculate percentage change
        if (oldestCount === 0) return 0;
        return ((newestCount - oldestCount) / oldestCount) * 100;
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
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Platform Analytics</h1>
                <div className="flex space-x-4">
                    <button
                        onClick={() => setTimeRange('month')}
                        className={`px-4 py-2 rounded ${
                            timeRange === 'month'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        Month
                    </button>
                    <button
                        onClick={() => setTimeRange('quarter')}
                        className={`px-4 py-2 rounded ${
                            timeRange === 'quarter'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        Quarter
                    </button>
                    <button
                        onClick={() => setTimeRange('year')}
                        className={`px-4 py-2 rounded ${
                            timeRange === 'year'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        Year
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <FaUsers className="text-blue-500 text-2xl" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-gray-500 text-sm">Total Users</h3>
                            <p className="text-2xl font-semibold">
                                {stats.userGrowth.reduce((sum, item) => sum + item.count, 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-full">
                            <FaProjectDiagram className="text-green-500 text-2xl" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-gray-500 text-sm">Active Projects</h3>
                            <p className="text-2xl font-semibold">{stats.projectStats.active || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <FaDollarSign className="text-yellow-500 text-2xl" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-gray-500 text-sm">Platform Revenue</h3>
                            <p className="text-2xl font-semibold">
                                ${stats.totalRevenue?.toFixed(2) || '0.00'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-full">
                            <FaChartLine className="text-purple-500 text-2xl" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-gray-500 text-sm">Growth Rate</h3>
                            <p className="text-2xl font-semibold">
                                {calculateGrowthRate(stats.userGrowth).toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">User Growth</h2>
                    <Line data={userGrowthData} options={{ responsive: true }} />
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Platform Revenue</h2>
                    <Bar data={revenueData} options={{ responsive: true }} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Popular Skills</h2>
                    <div className="aspect-w-16 aspect-h-9">
                        <Doughnut data={skillsData} options={skillsChartOptions} />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Freelancer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.transactions && stats.transactions.length > 0 ? (
                                    stats.transactions.map((transaction, index) => (
                                        <tr key={index} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(transaction.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {transaction.projectTitle}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {transaction.clientName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {transaction.freelancerName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                                ${transaction.amount.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No completed projects found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics; 