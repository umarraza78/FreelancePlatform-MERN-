import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FaSave, FaPlus, FaTrash } from 'react-icons/fa';

const NotificationSettings = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        subject: '',
        body: ''
    });
    const [showAddForm, setShowAddForm] = useState(false);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/admin/notification-templates');
            setTemplates(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error('Failed to load notification templates');
            setLoading(false);
        }
    };

    const handleSaveTemplate = async (template) => {
        try {
            if (template._id) {
                await api.put(`/admin/notification-templates/${template._id}`, template);
                toast.success('Template updated successfully');
            } else {
                await api.post('/admin/notification-templates', template);
                toast.success('Template created successfully');
            }
            fetchTemplates();
            setShowAddForm(false);
            setNewTemplate({ name: '', subject: '', body: '' });
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('Failed to save template');
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            try {
                const response = await api.delete(`/admin/notification-templates/${id}`);
                if (response.data.msg) {
                    toast.success(response.data.msg);
                    fetchTemplates();
                }
            } catch (error) {
                console.error('Error deleting template:', error);
                const errorMessage = error.response?.data?.msg || 'Failed to delete template';
                toast.error(errorMessage);
            }
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
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Notification Settings</h1>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    <FaPlus className="mr-2" />
                    Add Template
                </button>
            </div>

            {/* Add/Edit Template Form */}
            {showAddForm && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                        {newTemplate._id ? 'Edit Template' : 'Add New Template'}
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={newTemplate.name}
                                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subject</label>
                            <input
                                type="text"
                                value={newTemplate.subject}
                                onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Body</label>
                            <textarea
                                value={newTemplate.body}
                                onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                                rows={4}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNewTemplate({ name: '', subject: '', body: '' });
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSaveTemplate(newTemplate)}
                                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                <FaSave className="mr-2" />
                                Save Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Templates List */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Notification Templates</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Body
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {templates.map((template) => (
                                <tr key={template._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{template.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{template.subject}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-md truncate">{template.body}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => {
                                                setNewTemplate(template);
                                                setShowAddForm(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTemplate(template._id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {templates.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                        No templates found
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

export default NotificationSettings; 