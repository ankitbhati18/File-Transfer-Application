const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FileTransfer = require('../models/FileTransfer');
const { authenticate } = require('../middleware/auth');
const { encryptFile } = require('../utils/encryption');

const router = express.Router();

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
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Add file type restrictions if needed
    cb(null, true);
  }
});

// Upload file
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
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
    res.status(500).json({ message: 'Upload failed', error: error.message });
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

module.exports = router;
