import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Document, Page } from 'react-pdf';
import { FaFilePdf, FaImage, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const getStatusBadge = (status) => {
    switch (status) {
        case 'pending':
            return (
                <span className="px-2 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800">
                    Pending Review
                </span>
            );
        case 'not_submitted':
            return (
                <span className="px-2 py-1 text-sm rounded-full bg-gray-100 text-gray-800">
                    Not Submitted
                </span>
            );
        default:
            return null;
    }
};

const FreelancerVerification = () => {
    const [freelancers, setFreelancers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFreelancer, setSelectedFreelancer] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        fetchFreelancers();
    }, []);

    const fetchFreelancers = async () => {
        try {
            const response = await api.get('/admin/freelancers/pending-verification');
            setFreelancers(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching freelancers:', error);
            toast.error('Failed to load freelancers');
            setLoading(false);
        }
    };

    const handleVerificationAction = async (freelancerId, status, level) => {
        try {
            await api.put(`/admin/freelancers/${freelancerId}/verify`, {
                status,
                verificationLevel: level
            });
            toast.success(`Freelancer ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
            fetchFreelancers();
            setSelectedFreelancer(null);
            setSelectedDocument(null);
        } catch (error) {
            console.error('Error updating verification status:', error);
            toast.error('Failed to update verification status');
        }
    };

    const handleDocumentView = (document) => {
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const documentUrl = document.url.startsWith('http') ? document.url : `${baseUrl}${document.url}`;
        setSelectedDocument({
            ...document,
            url: documentUrl
        });
        setPageNumber(1);
    };

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const renderDocumentPreview = () => {
        if (!selectedDocument) return null;

        const isImage = selectedDocument.type.startsWith('image/');
        const isPDF = selectedDocument.type === 'application/pdf';

        return (
            <div className="mt-4 border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">{selectedDocument.name}</h4>
                    <button
                        onClick={() => setSelectedDocument(null)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <FaTimesCircle />
                    </button>
                </div>

                <div className="document-preview-container">
                    {isImage && (
                        <img
                            src={selectedDocument.url}
                            alt="Document preview"
                            className="max-w-full h-auto"
                            onError={(e) => {
                                console.error('Image failed to load:', e);
                                toast.error('Failed to load image');
                            }}
                        />
                    )}
                    {isPDF && (
                        <div>
                            <Document
                                file={selectedDocument.url}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={(error) => {
                                    console.error('PDF failed to load:', error);
                                    toast.error('Failed to load PDF');
                                }}
                            >
                                <Page pageNumber={pageNumber} />
                            </Document>
                            {numPages > 1 && (
                                <div className="flex justify-center mt-4 space-x-2">
                                    <button
                                        onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                                        disabled={pageNumber <= 1}
                                        className="px-3 py-1 bg-gray-200 rounded"
                                    >
                                        Previous
                                    </button>
                                    <span>
                                        Page {pageNumber} of {numPages}
                                    </span>
                                    <button
                                        onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                                        disabled={pageNumber >= numPages}
                                        className="px-3 py-1 bg-gray-200 rounded"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
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
            <h1 className="text-3xl font-bold mb-6">Freelancer Verification</h1>
            
            <div className="grid md:grid-cols-2 gap-6">
                {/* Freelancer List */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Pending Verifications</h2>
                    <div className="space-y-4">
                        {freelancers.map((freelancer) => (
                            <div 
                                key={freelancer._id}
                                className={`border rounded p-4 hover:bg-gray-50 cursor-pointer ${
                                    selectedFreelancer?._id === freelancer._id ? 'ring-2 ring-blue-500' : ''
                                }`}
                                onClick={() => setSelectedFreelancer(freelancer)}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium">{freelancer.name}</h3>
                                        <p className="text-sm text-gray-600">{freelancer.email}</p>
                                        {freelancer.verificationSubmitted && (
                                            <p className="text-sm text-gray-500">
                                                Submitted: {new Date(freelancer.verificationSubmitted).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    {getStatusBadge(freelancer.verificationStatus)}
                                </div>
                            </div>
                        ))}
                        {freelancers.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No pending verifications</p>
                        )}
                    </div>
                </div>

                {/* Verification Details */}
                {selectedFreelancer && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Verification Details</h2>
                        <div className="space-y-4">
                            {selectedFreelancer.verificationStatus === 'not_submitted' ? (
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                    <p className="text-gray-600">
                                        This freelancer has not submitted any verification documents yet.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <h3 className="font-medium mb-2">Documents</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedFreelancer.documents?.map((doc, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleDocumentView(doc)}
                                                    className={`flex items-center space-x-2 p-3 rounded border ${
                                                        selectedDocument?.name === doc.name
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-blue-500'
                                                    }`}
                                                >
                                                    {doc.type === 'application/pdf' ? (
                                                        <FaFilePdf className="text-red-500" />
                                                    ) : (
                                                        <FaImage className="text-green-500" />
                                                    )}
                                                    <span className="text-sm truncate">
                                                        {doc.name || `Document ${index + 1}`}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {renderDocumentPreview()}

                                    <div>
                                        <h3 className="font-medium mb-2">Verification Level</h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['Basic', 'Verified', 'Premium'].map((level) => (
                                                <button
                                                    key={level}
                                                    onClick={() => handleVerificationAction(selectedFreelancer._id, 'approved', level)}
                                                    className="px-4 py-2 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center space-x-1"
                                                >
                                                    <FaCheckCircle />
                                                    <span>Approve as {level}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <button
                                            onClick={() => handleVerificationAction(selectedFreelancer._id, 'rejected')}
                                            className="w-full px-4 py-2 text-sm rounded-md bg-red-500 text-white hover:bg-red-600 flex items-center justify-center space-x-1"
                                        >
                                            <FaTimesCircle />
                                            <span>Reject Verification</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FreelancerVerification; 