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
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Socket.IO connection handling
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`User  connected: ${socket.user.username}`);
  
  // Join user to their personal room
  socket.join(socket.user.id);
  
  // Handle file transfer initiation
  socket.on('initiate-transfer', (data) => {
    const { recipientId, fileId, fileName, fileSize } = data;
    
    // Notify recipient about incoming transfer
    socket.to(recipientId).emit('transfer-request', {
      senderId: socket.user.id,
      senderName: socket.user.username,
      fileId,
      fileName,
      fileSize
    });
  });
  
  // Handle transfer acceptance
  socket.on('accept-transfer', (data) => {
    const { senderId, fileId } = data;
    
    // Notify sender that transfer was accepted
    socket.to(senderId).emit('transfer-accepted', {
      recipientId: socket.user.id,
      fileId
    });
  });
  
  // Handle file chunk transfer
  socket.on('file-chunk', (data) => {
    const { recipientId, chunk, progress, fileId } = data;
    
    // Forward chunk to recipient
    socket.to(recipientId).emit('receive-chunk', {
      chunk,
      progress,
      fileId,
      senderId: socket.user.id
    });
    
    // Send progress update back to sender
    socket.emit('transfer-progress', { progress, fileId });
  });
  
  // Handle transfer completion
  socket.on('transfer-complete', (data) => {
    const { recipientId, fileId } = data;
    
    socket.to(recipientId).emit('transfer-finished', {
      fileId,
      senderId: socket.user.id
    });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User  disconnected: ${socket.user.username}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
