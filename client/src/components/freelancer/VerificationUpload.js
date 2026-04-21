import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const VerificationUpload = () => {
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState('not_submitted');
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        if (user) {
            setVerificationStatus(user.verificationStatus || 'not_submitted');
            setDocuments(user.documents || []);
        }
    }, [user]);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length === 0) return;
        
        // Validate file types and sizes
        const validFileTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        const invalidFiles = files.filter(
            file => !validFileTypes.includes(file.type) || file.size > maxSize
        );
        
        if (invalidFiles.length > 0) {
            toast.error('Please upload only images (JPG, PNG) or PDF files under 10MB');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        files.forEach(file => {
            formData.append('documents', file);
        });

        try {
            const response = await api.post('/freelancer/verification-documents', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setDocuments(response.data.documents);
            setVerificationStatus(response.data.verificationStatus);
            toast.success('Documents uploaded successfully');
        } catch (error) {
            console.error('Error uploading documents:', error);
            toast.error(error.response?.data?.message || 'Failed to upload documents');
        } finally {
            setUploading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            not_submitted: 'bg-gray-100 text-gray-800',
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-sm ${statusClasses[status]}`}>
                {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Verification Documents</h2>
                {getStatusBadge(verificationStatus)}
            </div>

            {verificationStatus === 'not_submitted' || verificationStatus === 'rejected' ? (
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Please upload your identification documents (ID card, passport, or driver's license) 
                        for verification. We accept JPG, PNG, and PDF files.
                    </p>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="document-upload"
                            disabled={uploading}
                        />
                        <label
                            htmlFor="document-upload"
                            className="cursor-pointer text-blue-500 hover:text-blue-700"
                        >
                            {uploading ? 'Uploading...' : 'Click to upload documents'}
                        </label>
                        <p className="text-sm text-gray-500 mt-2">
                            Maximum 5 files, 10MB each (JPG, PNG, PDF)
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-gray-600">
                        {verificationStatus === 'pending' 
                            ? 'Your documents are under review. We will notify you once the verification is complete.'
                            : 'Your account has been verified.'}
                    </p>
                    
                    {documents.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-lg font-medium mb-2">Uploaded Documents</h3>
                            <div className="space-y-2">
                                {documents.map((doc, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                        <div>
                                            <p className="font-medium">{doc.name}</p>
                                            <p className="text-sm text-gray-500">
                                                Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:text-blue-700"
                                        >
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VerificationUpload; 