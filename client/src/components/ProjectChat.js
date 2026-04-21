import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../utils/api';
import {
    initSocket,
    joinProjectRoom,
    leaveProjectRoom,
    sendMessage,
    subscribeToMessages,
    markMessageAsRead,
    subscribeToMessageRead
} from '../utils/socket';

const ProjectChat = ({ projectId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const retryTimeoutRef = useRef(null);
    const { user } = useSelector((state) => state.auth);
    const { project } = useSelector((state) => state.projects);

    // Load existing messages
    useEffect(() => {
        const loadMessages = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get(`/messages/${projectId}`);
                setMessages(response.data);
                scrollToBottom();
            } catch (err) {
                console.error('Error loading messages:', err);
                setError('Failed to load messages');
                toast.error('Failed to load chat messages');
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            loadMessages();
        }
    }, [projectId]);

    // Initialize socket connection
    useEffect(() => {
        let unsubscribeMessages = null;
        let unsubscribeMessageRead = null;

        const initializeSocket = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.log('No auth token available');
                    return;
                }

                if (!projectId) {
                    console.log('No project ID available');
                    return;
                }

                // Initialize socket
                socketRef.current = initSocket(token);

                // Wait for connection, but handle already-connected sockets
                await new Promise((resolve, reject) => {
                    if (socketRef.current.connected) {
                        setIsConnected(true);
                        resolve();
                        return;
                    }
                    const timeout = setTimeout(() => {
                        reject(new Error('Socket connection timeout'));
                    }, 5000);

                    socketRef.current.on('connect', () => {
                        clearTimeout(timeout);
                        setIsConnected(true);
                        resolve();
                    });

                    socketRef.current.on('connect_error', (error) => {
                        clearTimeout(timeout);
                        reject(error);
                    });
                });

                // Join project room
                console.log('Joining project room:', projectId);
                joinProjectRoom(projectId);

                // Subscribe to messages
                unsubscribeMessages = subscribeToMessages((message) => {
                    console.log('Received new message:', message);
                    setMessages(prev => {
                        if (prev.some(m => m._id === message._id)) {
                            return prev;
                        }
                        return [...prev, message];
                    });
                    scrollToBottom();
                    if (message.senderId !== user?._id) {
                        markMessageAsRead(message._id);
                    }
                });

                // Subscribe to read receipts
                unsubscribeMessageRead = subscribeToMessageRead((data) => {
                    console.log('Message read:', data);
                    setMessages(prev => prev.map(msg => 
                        msg._id === data.messageId 
                            ? { ...msg, read: true }
                            : msg
                    ));
                });

            } catch (error) {
                console.error('Socket initialization error:', error);
                setError('Chat connection failed');
                setIsConnected(false);

                // Retry connection after delay
                retryTimeoutRef.current = setTimeout(() => {
                    console.log('Retrying socket connection...');
                    initializeSocket();
                }, 5000);
            }
        };

        initializeSocket();

        // Cleanup function
        return () => {
            if (socketRef.current) {
                if (unsubscribeMessages) unsubscribeMessages();
                if (unsubscribeMessageRead) unsubscribeMessageRead();
                if (projectId) leaveProjectRoom(projectId);
                socketRef.current = null;
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            setIsConnected(false);
        };
    }, [projectId, user?._id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        if (!isConnected) {
            toast.error('Chat is not connected. Please wait or refresh the page.');
            return;
        }

        try {
            let receiverIds = [];
            if (user.role === 'client') {
                if (project?.freelancer?._id) {
                    receiverIds = [project.freelancer._id];
                } else if (project?.bids && project.bids.length > 0) {
                    // Collect all unique bidder IDs
                    const bidderIds = Array.from(new Set(project.bids.map(bid => bid.freelancer?._id).filter(Boolean)));
                    receiverIds = bidderIds;
                }
            } else {
                receiverIds = [project?.client?._id];
            }

            if (!receiverIds || receiverIds.length === 0) {
                toast.error('Cannot send message: No recipient found');
                return;
            }

            // Optimistically add message to UI
            const tempMessage = {
                _id: Date.now().toString(),
                senderId: user._id,
                text: newMessage.trim(),
                timestamp: new Date(),
                read: false,
                temporary: true
            };
            setMessages(prev => [...prev, tempMessage]);
            setNewMessage('');
            scrollToBottom();

            // Send message to all receiverIds
            await Promise.all(receiverIds.map(rid => sendMessage(projectId, rid, newMessage.trim())));
        } catch (error) {
            console.error('Send message error:', error);
            toast.error('Failed to send message');
            setMessages(prev => prev.filter(msg => !msg.temporary));
        }
    };

    const formatMessageTime = (timestamp) => {
        return format(new Date(timestamp), 'MMM d, h:mm a');
    };

    if (!user) {
        return (
            <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg items-center justify-center">
                <p className="text-gray-600">Please log in to access the chat.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-gray-600">Loading chat...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg items-center justify-center">
                <p className="text-red-600">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
            {/* Chat Header */}
            <div className="px-4 py-3 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold">Project Chat</h3>
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        {project?.client?.name && project?.freelancer?.name 
                            ? `${project.client.name} ↔ ${project.freelancer.name}`
                            : 'Loading participants...'}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        isConnected 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <p className="text-center text-gray-500">No messages yet. Start the conversation!</p>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message._id}
                            className={`flex ${
                                message.senderId === user._id ? 'justify-end' : 'justify-start'
                            }`}
                        >
                            <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                    message.senderId === user._id
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100'
                                } ${message.temporary ? 'opacity-70' : ''}`}
                            >
                                <p className="text-sm break-words">{message.text}</p>
                                <div className="mt-1 text-xs text-right flex items-center justify-end gap-2">
                                    <span>{formatMessageTime(message.timestamp)}</span>
                                    {message.read && message.senderId === user._id && (
                                        <span className="text-green-500">✓</span>
                                    )}
                                    {message.temporary && (
                                        <span className="animate-pulse">Sending...</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isConnected ? "Type your message..." : "Connecting to chat..."}
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={300}
                        disabled={!isConnected}
                    />
                    <button
                        type="submit"
                        disabled={!isConnected || !newMessage.trim()}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectChat; 