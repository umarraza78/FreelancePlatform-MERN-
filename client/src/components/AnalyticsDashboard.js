import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { fetchAnalytics } from '../features/analytics/analyticsSlice';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

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

const AnalyticsDashboard = () => {
    const dispatch = useDispatch();
    const { analytics, isLoading } = useSelector((state) => state.analytics);
    const { user } = useSelector((state) => state.auth);
    const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const [endDate, setEndDate] = useState(new Date());

    useEffect(() => {
        if (user && user.role === 'client') {
            dispatch(fetchAnalytics({ startDate, endDate, clientId: user._id }));
        } else {
            dispatch(fetchAnalytics({ startDate, endDate }));
        }
    }, [dispatch, startDate, endDate, user]);

    const exportData = async (exportFormat) => {
        if (exportFormat === 'csv') {
            // Fetch CSV from backend
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                format: 'csv',
                ...(user && user.role === 'client' ? { clientId: user._id } : {})
            });
            const response = await fetch(
                `http://localhost:5000/api/analytics/export?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            if (!response.ok) {
                alert('Failed to export CSV');
                return;
            }
            const blob = await response.blob();
            saveAs(blob, `analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        } else if (exportFormat === 'pdf') {
            // Fetch PDF from backend
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                format: 'pdf',
                ...(user && user.role === 'client' ? { clientId: user._id } : {})
            });
            const response = await fetch(
                `http://localhost:5000/api/analytics/export?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            if (!response.ok) {
                alert('Failed to export PDF');
                return;
            }
            const blob = await response.blob();
            saveAs(blob, `analytics_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        }
    };

    const generateCSV = () => {
        const headers = ['Date', 'Projects', 'Revenue', 'Active Freelancers'];
        const rows = analytics.projectData.map((data, index) => [
            data.date,
            data.count,
            analytics.revenueData[index].amount,
            analytics.freelancerData[index].count
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const projectChartData = {
        labels: analytics?.projectData.map(data => format(new Date(data.date), 'MMM dd')),
        datasets: [{
            label: 'Active Projects',
            data: analytics?.projectData.map(data => data.count),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    const revenueChartData = {
        labels: analytics?.revenueData.map(data => format(new Date(data.date), 'MMM dd')),
        datasets: [{
            label: 'Revenue',
            data: analytics?.revenueData.map(data => data.amount),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
        }]
    };

    const freelancerPerformanceData = {
        labels: ['Excellent', 'Good', 'Average', 'Poor'],
        datasets: [{
            data: [
                analytics?.performanceData.excellent || 0,
                analytics?.performanceData.good || 0,
                analytics?.performanceData.average || 0,
                analytics?.performanceData.poor || 0
            ],
            backgroundColor: [
                'rgba(75, 192, 192, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(255, 99, 132, 0.5)'
            ]
        }]
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <span>From:</span>
                        <DatePicker
                            selected={startDate}
                            onChange={date => setStartDate(date)}
                            className="border rounded p-2"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span>To:</span>
                        <DatePicker
                            selected={endDate}
                            onChange={date => setEndDate(date)}
                            className="border rounded p-2"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => exportData('csv')}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Export CSV
                        </button>
                        <button
                            onClick={() => exportData('pdf')}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            Export PDF
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Project Trends</h2>
                    <Line data={projectChartData} options={{
                        responsive: true,
                        plugins: {
                            legend: { position: 'top' },
                            title: { display: true, text: 'Active Projects Over Time' }
                        }
                    }} />
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Revenue Analysis</h2>
                    <Bar data={revenueChartData} options={{
                        responsive: true,
                        plugins: {
                            legend: { position: 'top' },
                            title: { display: true, text: 'Revenue Distribution' }
                        }
                    }} />
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Freelancer Performance</h2>
                    <Doughnut data={freelancerPerformanceData} options={{
                        responsive: true,
                        plugins: {
                            legend: { position: 'right' },
                            title: { display: true, text: 'Performance Distribution' }
                        }
                    }} />
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded">
                            <h3 className="text-lg font-semibold text-blue-700">
                                {analytics?.totalProjects || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Total Projects</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded">
                            <h3 className="text-lg font-semibold text-green-700">
                                ${analytics?.totalRevenue?.toFixed(2) || '0.00'}
                            </h3>
                            <p className="text-sm text-green-600">Total Revenue</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded">
                            <h3 className="text-lg font-semibold text-yellow-700">
                                {analytics?.activeFreelancers || 0}
                            </h3>
                            <p className="text-sm text-yellow-600">Active Freelancers</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded">
                            <h3 className="text-lg font-semibold text-purple-700">
                                {analytics?.averageRating?.toFixed(1) || '0.0'}
                            </h3>
                            <p className="text-sm text-purple-600">Average Rating</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard; 