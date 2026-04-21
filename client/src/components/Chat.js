import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { fetchMessages, sendMessage, markMessageRead } from '../features/messages/messageSlice';
import { format } from 'date-fns';

const Chat = ({ recipientId, projectId }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { messages, isLoading } = useSelector((state) => state.messages);
    const [messageText, setMessageText] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Connect to WebSocket server
        const newSocket = io('http://localhost:5000', {
            auth: {
                token: localStorage.getItem('token')
            }
        });

        newSocket.on('connect', () => {
            console.log('Connected to chat server');
            newSocket.emit('join', { userId: user._id, projectId });
        });

        newSocket.on('message', (message) => {
            // Handle incoming message
            if (message.sender !== user._id) {
                dispatch(markMessageRead(message._id));
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user._id, projectId]);

    useEffect(() => {
        // Fetch existing messages
        if (projectId && recipientId) {
            dispatch(fetchMessages({ projectId, recipientId }));
        }
    }, [dispatch, projectId, recipientId]);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageText.trim()) return;

        try {
            const message = {
                projectId,
                recipientId,
                content: messageText,
                timestamp: new Date().toISOString()
            };

            // Emit message through socket
            socket.emit('message', message);

            // Save message to database
            await dispatch(sendMessage(message)).unwrap();
            setMessageText('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message._id}
                        className={`flex ${
                            message.sender === user._id ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                                message.sender === user._id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-900'
                            }`}
                        >
                            <p className="break-words">{message.content}</p>
                            <div
                                className={`text-xs mt-1 ${
                                    message.sender === user._id
                                        ? 'text-blue-100'
                                        : 'text-gray-500'
                                }`}
                            >
                                {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                                {message.sender === user._id && (
                                    <span className="ml-2">
                                        {message.read ? '✓✓' : '✓'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        disabled={!messageText.trim()}
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat; 