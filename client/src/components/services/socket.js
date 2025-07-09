import io from 'socket.io-client';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export const initializeSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000', {
    auth: {
      token: token
    },
    transports: ['websocket', 'polling'],
    timeout: 20000,
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
  });

  socket.on('connect', () => {
    console.log('Connected to server');
    reconnectAttempts = 0;
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected from server:', reason);
    if (reason === 'io server disconnect') {
      // Server disconnected us, try to reconnect
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    reconnectAttempts++;
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      // Could show a user notification here
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('Reconnected to server after', attemptNumber, 'attempts');
    reconnectAttempts = 0;
  });

  socket.on('reconnect_error', (error) => {
    console.error('Reconnection error:', error);
  });

  socket.on('reconnect_failed', () => {
    console.error('Reconnection failed');
    // Could show a user notification here
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const isSocketConnected = () => {
  return socket && socket.connected;
};
