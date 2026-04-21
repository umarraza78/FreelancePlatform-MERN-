import io from 'socket.io-client';
import { toast } from 'react-toastify';

let socket = null;

export const initSocket = (token) => {
    // Get token from parameter or localStorage
    const authToken = token || localStorage.getItem('token');
    
    if (!authToken) {
        console.error('No authentication token found');
        throw new Error('Authentication token is required');
    }

    // If socket exists but is disconnected, try to reconnect
    if (socket && !socket.connected) {
        console.log('Reconnecting existing socket...');
        socket.auth = { token: authToken };
        socket.connect();
        return socket;
    }

    // Create new socket if none exists
    if (!socket) {
        // Use environment variable or fallback to localhost
        const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        
        console.log('Initializing socket connection to:', SOCKET_URL);
        console.log('Using auth token:', authToken.substring(0, 20) + '...');

        socket = io(SOCKET_URL, {
            auth: { token: authToken },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            query: { token: authToken },
            withCredentials: true
        });

        // Debug socket state
        setInterval(() => {
            if (socket) {
                console.log('Socket state:', {
                    connected: socket.connected,
                    id: socket.id,
                    auth: socket.auth
                });
            }
        }, 5000);

        socket.on('connect', () => {
            console.log('Socket connected successfully:', {
                id: socket.id,
                auth: socket.auth
            });
            toast.success('Chat connected successfully');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            toast.error(`Chat connection error: ${error.message}`);
            if (error.message?.includes('authentication')) {
                console.error('Authentication failed. Token may be invalid.');
                socket = null;
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            if (reason === 'io server disconnect') {
                // Server initiated disconnect, attempt reconnection
                console.log('Attempting to reconnect...');
                socket.auth = { token: authToken };
                socket.connect();
            }
            toast.warn('Chat disconnected. Attempting to reconnect...');
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
            toast.error(`Chat error: ${error.message}`);
            if (error.details) {
                console.error('Error details:', error.details);
            }
            if (error.message?.includes('authentication')) {
                socket = null;
            }
        });
    }

    return socket;
};

export const joinProjectRoom = (projectId) => {
    if (!socket?.connected) {
        throw new Error('Socket not connected');
    }
    console.log('Joining project room:', projectId);
    socket.emit('joinProject', { projectId });
};

export const leaveProjectRoom = (projectId) => {
    if (!socket?.connected) {
        return;
    }
    console.log('Leaving project room:', projectId);
    socket.emit('leaveProject', { projectId });
};

export const sendMessage = async (projectId, receiverId, text) => {
    if (!socket?.connected) {
        throw new Error('Socket not connected');
    }
    if (!projectId || !receiverId || !text) {
        throw new Error('Missing required message parameters');
    }

    return new Promise((resolve, reject) => {
        try {
            console.log('Sending message:', { projectId, receiverId, text });
            socket.emit('sendMessage', { projectId, receiverId, text });
            
            // Set a timeout for the response
            const timeout = setTimeout(() => {
                reject(new Error('Message send timeout'));
            }, 5000);

            // Listen for the new message event
            const handleNewMessage = (message) => {
                if (message.text === text) {
                    clearTimeout(timeout);
                    socket.off('newMessage', handleNewMessage);
                    socket.off('error', handleError);
                    resolve(message);
                }
            };

            // Listen for errors
            const handleError = (error) => {
                clearTimeout(timeout);
                socket.off('newMessage', handleNewMessage);
                socket.off('error', handleError);
                reject(new Error(error.details || error.message));
            };

            socket.on('newMessage', handleNewMessage);
            socket.on('error', handleError);
        } catch (error) {
            reject(error);
        }
    });
};

export const subscribeToMessages = (callback) => {
    if (!socket?.connected) {
        throw new Error('Socket not connected');
    }
    
    socket.on('newMessage', callback);
    return () => {
        socket.off('newMessage', callback);
    };
};

export const markMessageAsRead = (messageId) => {
    if (!socket?.connected) {
        throw new Error('Socket not connected');
    }
    console.log('Marking message as read:', messageId);
    socket.emit('markMessageRead', { messageId });
};

export const subscribeToMessageRead = (callback) => {
    if (!socket?.connected) {
        throw new Error('Socket not connected');
    }
    
    socket.on('messageRead', callback);
    return () => {
        socket.off('messageRead', callback);
    };
};

export const disconnectSocket = () => {
    if (socket?.connected) {
        console.log('Disconnecting socket');
        socket.disconnect();
        socket = null;
    }
}; 