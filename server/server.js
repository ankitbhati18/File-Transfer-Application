const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const { authenticateSocket } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// File upload rate limiting
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 uploads per windowMs
  message: 'Too many uploads from this IP, please try again later.'
});
app.use('/api/files/upload', uploadLimiter);

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Socket.IO connection handling
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username} (ID: ${socket.user._id})`);
  
  // Join user to their personal room
  socket.join(socket.user._id);
  
  // Handle file transfer initiation
  socket.on('initiate-transfer', (data) => {
    try {
      const { recipientId, fileId, fileName, fileSize } = data;
      
      if (!recipientId || !fileId || !fileName || !fileSize) {
        socket.emit('transfer-error', { message: 'Missing required transfer data' });
        return;
      }
      
      // Notify recipient about incoming transfer
      socket.to(recipientId).emit('transfer-request', {
        senderId: socket.user._id,
        senderName: socket.user.username,
        fileId,
        fileName,
        fileSize
      });
    } catch (error) {
      console.error('Transfer initiation error:', error);
      socket.emit('transfer-error', { message: 'Transfer initiation failed' });
    }
  });
  
  // Handle transfer acceptance
  socket.on('accept-transfer', (data) => {
    try {
      const { senderId, fileId } = data;
      
      if (!senderId || !fileId) {
        socket.emit('transfer-error', { message: 'Missing required acceptance data' });
        return;
      }
      
      // Notify sender that transfer was accepted
      socket.to(senderId).emit('transfer-accepted', {
        recipientId: socket.user._id,
        fileId
      });
    } catch (error) {
      console.error('Transfer acceptance error:', error);
      socket.emit('transfer-error', { message: 'Transfer acceptance failed' });
    }
  });
  
  // Handle file chunk transfer
  socket.on('file-chunk', (data) => {
    try {
      const { recipientId, chunk, progress, fileId } = data;
      
      if (!recipientId || !chunk || !fileId) {
        socket.emit('transfer-error', { message: 'Missing required chunk data' });
        return;
      }
      
      // Forward chunk to recipient
      socket.to(recipientId).emit('receive-chunk', {
        chunk,
        progress,
        fileId,
        senderId: socket.user._id
      });
      
      // Send progress update back to sender
      socket.emit('transfer-progress', { progress, fileId });
    } catch (error) {
      console.error('File chunk error:', error);
      socket.emit('transfer-error', { message: 'File chunk transfer failed' });
    }
  });
  
  // Handle transfer completion
  socket.on('transfer-complete', (data) => {
    try {
      const { recipientId, fileId } = data;
      
      if (!recipientId || !fileId) {
        socket.emit('transfer-error', { message: 'Missing required completion data' });
        return;
      }
      
      socket.to(recipientId).emit('transfer-finished', {
        fileId,
        senderId: socket.user._id
      });
    } catch (error) {
      console.error('Transfer completion error:', error);
      socket.emit('transfer-error', { message: 'Transfer completion failed' });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.username} (ID: ${socket.user._id})`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
