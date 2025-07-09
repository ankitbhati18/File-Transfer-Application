# File Transfer Application

A secure, real-time file transfer application built with React, Node.js, and Socket.IO.

## Features

- 🔐 **Secure Authentication**: JWT-based authentication with password strength validation
- 📁 **File Upload & Transfer**: Drag-and-drop file upload with real-time transfer progress
- 🔒 **File Encryption**: Server-side file encryption for enhanced security
- 👥 **User Management**: User registration, login, and online status tracking
- 📊 **Transfer History**: Complete history of file transfers with download/delete options
- 🔔 **Real-time Notifications**: Live notifications for transfer requests and status updates
- 📱 **Responsive Design**: Mobile-friendly interface
- 🛡️ **Security Features**: Rate limiting, input validation, and secure file handling

## Tech Stack

### Frontend
- React 18
- Socket.IO Client
- Axios for API calls
- CSS3 with responsive design

### Backend
- Node.js with Express
- Socket.IO for real-time communication
- MongoDB with Mongoose
- JWT for authentication
- Multer for file uploads
- CryptoJS for file encryption
- Helmet for security headers
- Express Rate Limit for API protection

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd File-Transfer-Application
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables**

   Create `.env` file in the server directory:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/filetransfer
   JWT_SECRET=your-super-secret-jwt-key-here
   ENCRYPTION_KEY=your-32-character-encryption-key
   CLIENT_URL=http://localhost:3000
   MAX_FILE_SIZE=52428800
   UPLOAD_PATH=uploads
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   UPLOAD_RATE_LIMIT_MAX=10
   ```

   Create `.env` file in the client directory:
   ```env
   REACT_APP_API_BASE_URL=http://localhost:5000/api
   ```

5. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

6. **Start the server**
   ```bash
   cd server
   npm start
   ```

7. **Start the client**
   ```bash
   cd client
   npm start
   ```

8. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/health

## Usage

1. **Register a new account** or **login** with existing credentials
2. **Upload files** by dragging and dropping or clicking the upload area
3. **Select a recipient** from the dropdown list
4. **Monitor transfer progress** in real-time
5. **Download or delete files** from the transfer history

## File Types & Limits

### Supported File Types
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX
- Text: TXT, CSV, JSON, XML
- Archives: ZIP, RAR
- Media: MP4, WebM, MP3, WAV

### File Size Limits
- Maximum file size: 50MB
- Rate limit: 10 uploads per 15 minutes

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Strength**: Enforced strong password requirements
- **File Encryption**: Server-side AES encryption for uploaded files
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive client and server-side validation
- **CORS Protection**: Configured CORS for security
- **Helmet Security**: Security headers for Express

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/users` - Get all users

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/download/:fileId` - Download file
- `GET /api/files/transfers` - Get transfer history
- `POST /api/files/record-transfer` - Record file transfer
- `DELETE /api/files/delete/:fileId` - Delete file

### Health Check
- `GET /health` - Server health status

## Socket.IO Events

### Client to Server
- `initiate-transfer` - Start file transfer
- `accept-transfer` - Accept incoming transfer
- `file-chunk` - Send file chunk
- `transfer-complete` - Mark transfer as complete

### Server to Client
- `transfer-request` - Incoming transfer request
- `transfer-accepted` - Transfer accepted notification
- `receive-chunk` - Receive file chunk
- `transfer-progress` - Transfer progress update
- `transfer-finished` - Transfer completion notification
- `transfer-error` - Transfer error notification

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the connection string in `.env`
   - Verify MongoDB port (default: 27017)

2. **File Upload Fails**
   - Check file size (max 50MB)
   - Verify file type is supported
   - Ensure uploads directory exists

3. **Socket Connection Issues**
   - Check if server is running on port 5000
   - Verify CORS configuration
   - Check browser console for errors

4. **Authentication Errors**
   - Clear browser localStorage
   - Check JWT_SECRET in server .env
   - Verify token expiration

### Development

1. **Enable debug logging**
   ```bash
   # Server
   NODE_ENV=development npm start

   # Client
   REACT_APP_DEBUG=true npm start
   ```

2. **Reset database**
   ```bash
   # Connect to MongoDB and drop database
   mongo
   use filetransfer
   db.dropDatabase()
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub.
