import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = (userId) => {
  if (socket?.connected) {
    // If already connected, just ensure user room is joined
    if (userId) {
      socket.emit('join-user-room', userId);
    }
    return socket;
  }

  const token = localStorage.getItem('token');
  // Socket.IO connects to the base server URL, not the API path
  // If VITE_API_URL includes /api, remove it for socket connection
  let backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Clean up the URL
  if (backendUrl.endsWith('/api')) {
    backendUrl = backendUrl.replace('/api', '');
  } else if (backendUrl.endsWith('/api/')) {
    backendUrl = backendUrl.replace('/api/', '');
  }

  // Remove trailing slash
  backendUrl = backendUrl.replace(/\/$/, '');

  // If it's not a full URL, assume localhost
  if (!backendUrl.includes('://')) {
    backendUrl = 'http://localhost:3000';
  }

  socket = io(backendUrl, {
    path: '/socket.io/',
    auth: {
      token,
    },
    transports: ['polling', 'websocket'], // Prefer polling for Render compatibility
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity, // Keep trying to reconnect indefinitely
    timeout: 20000,
    forceNew: false,
    upgrade: true, // Allow transport upgrades
    rememberUpgrade: false, // Don't remember upgrade preference (always try polling first)
  });

  socket.on('connect', () => {
    if (userId) {
      socket.emit('join-user-room', userId);

      // Send presence ping every 30 seconds to keep lastActiveAt updated
      const pingInterval = setInterval(() => {
        if (socket && socket.connected) {
          socket.emit('presence:ping', { userId });
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);

      // Store interval ID on socket for cleanup
      socket._presencePingInterval = pingInterval;
    }
  });

  socket.on('disconnect', () => {
    // Clear presence ping interval
    if (socket && socket._presencePingInterval) {
      clearInterval(socket._presencePingInterval);
      socket._presencePingInterval = null;
    }
  });

  socket.on('connect_error', (error) => {
  });

  socket.on('error', (error) => {
  });

  socket.on('reconnect', (attemptNumber) => {
    if (userId) {
      socket.emit('join-user-room', userId);
    }
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
  });

  socket.on('reconnect_failed', () => {
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    // Clear presence ping interval before disconnecting
    if (socket._presencePingInterval) {
      clearInterval(socket._presencePingInterval);
      socket._presencePingInterval = null;
    }
    socket.disconnect();
    socket = null;
  }
};

// Chat Helpers
export const joinChatRoom = (room) => {
  if (!socket) return;
  socket.emit('join:chat', { room });
};

export const leaveChatRoom = (room) => {
  if (!socket) return;
  socket.emit('leave:chat', { room });
};

export const sendChatMessage = (payload) => {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('No socket connection'));

    socket.emit('message:send', payload, (response) => {
      if (response && response.success) {
        resolve(response);
      } else {
        reject(new Error(response?.error || 'Failed to send message'));
      }
    });
  });
};

export const sendTypingStart = (room) => {
  if (!socket) return;
  socket.emit('typing:start', { room });
};

export const sendTypingStop = (room) => {
  if (!socket) return;
  socket.emit('typing:stop', { room });
};

export const sendReadReceipt = (room, conversationId, messageIds) => {
  if (!socket) return;
  socket.emit('message:seen', { room, conversationId, messageIds });
};

