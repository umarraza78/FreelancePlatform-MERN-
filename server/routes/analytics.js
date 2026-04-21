console.log('Analytics route loaded');
const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

router.get('/', auth, async (req, res) => {
    try {
        const { startDate, endDate, clientId } = req.query;
        let projectQuery = {
            createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
        };
        if (clientId) {
            projectQuery.client = clientId;
        }

        console.log('Analytics Query:', JSON.stringify(projectQuery));
        const projects = await Project.find(projectQuery);
        console.log('Projects found:', projects.length);

        const totalProjects = projects.length;
        const totalRevenue = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
        const activeFreelancers = new Set(projects.map(p => p.freelancer?.toString())).size;
        const ratings = projects.map(p => p.averageRating || 0).filter(r => r > 0);
        const averageRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;

        // Generate daily data for the charts
        const start = new Date(startDate);
        const end = new Date(endDate);
        const projectData = [];
        const revenueData = [];
        const freelancerData = [];

        for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
            const currentDate = new Date(date);
            const dayProjects = projects.filter(p => 
                p.createdAt.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
            );
            
            projectData.push({
                date: currentDate.toISOString().split('T')[0],
                count: dayProjects.filter(p => p.status === 'in-progress').length
            });

            revenueData.push({
                date: currentDate.toISOString().split('T')[0],
                amount: dayProjects.reduce((sum, p) => sum + (p.budget || 0), 0)
            });

            freelancerData.push({
                date: currentDate.toISOString().split('T')[0],
                count: new Set(dayProjects.map(p => p.freelancer?.toString())).size
            });
        }

        // Calculate performance data
        const performanceData = {
            excellent: projects.filter(p => (p.averageRating || 0) >= 4.5).length,
            good: projects.filter(p => (p.averageRating || 0) >= 4 && p.averageRating < 4.5).length,
            average: projects.filter(p => (p.averageRating || 0) >= 3 && p.averageRating < 4).length,
            poor: projects.filter(p => (p.averageRating || 0) < 3).length
        };

        res.json({
            projectData,
            revenueData,
            freelancerData,
            performanceData,
            totalProjects,
            totalRevenue,
            activeFreelancers,
            averageRating
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
    }
});

// Export analytics as CSV or PDF
router.get('/export', auth, async (req, res) => {
    try {
        const { startDate, endDate, format, clientId } = req.query;
        let projectQuery = {
            createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
        };
        if (clientId) {
            projectQuery.client = clientId;
        }
        const projects = await Project.find(projectQuery);
        console.log('CSV Export - Projects found:', projects.length);
        if (projects.length > 0) {
            console.log('Sample project:', {
                createdAt: projects[0].createdAt,
                title: projects[0].title,
                budget: projects[0].budget,
                freelancer: projects[0].freelancer,
                client: projects[0].client
            });
        }
        // For CSV, export all projects as rows for easier verification
        if (format === 'csv') {
            const headers = ['Date', 'Title', 'Budget', 'Freelancer', 'Client'];
            const rows = projects.map(p => [
                new Date(p.createdAt).toISOString().slice(0, 10),
                p.title || '',
                p.budget || 0,
                p.freelancer ? p.freelancer.toString() : '',
                p.client ? p.client.toString() : ''
            ]);
            const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"');
            return res.send(csvContent);
        } else if (format === 'pdf') {
            // Generate PDF using pdfkit
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="analytics.pdf"');
            doc.pipe(res);
            doc.fontSize(18).text('Analytics Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12);
            // Table header
            doc.text('Date', 50, doc.y, { continued: true });
            doc.text('Projects', 150, doc.y, { continued: true });
            doc.text('Revenue', 250, doc.y, { continued: true });
            doc.text('Active Freelancers', 350, doc.y);
            doc.moveDown(0.5);
            // Table rows
            for (let i = 0; i < projects.length; i++) {
                doc.text(projects[i].createdAt.toISOString().slice(0, 10), 50, doc.y, { continued: true });
                doc.text(projects[i].title || '', 150, doc.y, { continued: true });
                doc.text(projects[i].budget?.toString() || '', 250, doc.y, { continued: true });
                doc.text(projects[i].freelancer ? projects[i].freelancer.toString() : '', 350, doc.y);
            }
            doc.end();
            return;
        } else {
            return res.status(400).json({ message: 'Invalid format. Use csv or pdf.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to export analytics', error: error.message });
    }
});

module.exports = router; 