const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FileTransfer = require('../models/FileTransfer');
const { authenticate } = require('../middleware/auth');
const { encryptFile, decryptFile } = require('../utils/encryption');

const router = express.Router();

// Allowed file types
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'text/csv', 'application/json', 'application/xml',
  'application/zip', 'application/x-rar-compressed',
  'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav'
];

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Upload file
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Validate file size
    if (req.file.size > 50 * 1024 * 1024) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'File size exceeds 50MB limit' });
    }
    
    // Encrypt the uploaded file
    const encryptedPath = await encryptFile(req.file.path);
    
    // Remove original unencrypted file
    fs.unlinkSync(req.file.path);
    
    res.json({
      message: 'File uploaded successfully',
      file: {
        id: req.file.filename,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        path: encryptedPath
      }
    });
  } catch (error) {
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Download file
router.get('/download/:fileId', authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    const filePath = path.join('uploads', fileId + '.encrypted');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Decrypt file
    const decryptedPath = await decryptFile(filePath);
    
    // Send file
    res.download(decryptedPath, (err) => {
      // Clean up decrypted file after sending
      if (fs.existsSync(decryptedPath)) {
        fs.unlinkSync(decryptedPath);
      }
      if (err) {
        console.error('Download error:', err);
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Download failed', error: error.message });
  }
});

// Get transfer history
router.get('/transfers', authenticate, async (req, res) => {
  try {
    const transfers = await FileTransfer.find({
      $or: [
        { sender: req.user.userId },
        { recipient: req.user.userId }
      ]
    })
    .populate('sender', 'username email')
    .populate('recipient', 'username email')
    .sort({ createdAt: -1 });
    
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Record file transfer
router.post('/record-transfer', authenticate, async (req, res) => {
  try {
    const { recipientId, fileName, fileSize, fileType } = req.body;
    
    if (!recipientId || !fileName || !fileSize || !fileType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const transfer = new FileTransfer({
      sender: req.user.userId,
      recipient: recipientId,
      fileName,
      fileSize,
      fileType,
      status: 'pending'
    });
    
    await transfer.save();
    
    res.json({
      message: 'Transfer recorded',
      transferId: transfer._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete file
router.delete('/delete/:fileId', authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    const filePath = path.join('uploads', fileId + '.encrypted');
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
});

module.exports = router;
