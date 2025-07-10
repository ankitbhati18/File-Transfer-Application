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
// Decryption utility
const { decryptFile } = require('../utils/encryption');

router.get('/download/:transferId', authenticate, async (req, res) => {
  try {
    const { transferId } = req.params;
    const transfer = await FileTransfer.findById(transferId)
      .populate('sender', 'username')
      .populate('recipient', 'username');

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    const userId = req.user.userId;
    if (
      transfer.sender._id.toString() !== userId &&
      transfer.recipient._id.toString() !== userId
    ) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const encryptedPath = path.join(__dirname, '..', 'uploads', transfer.fileName); // adjust if needed
    const decryptedPath = await decryptFile(encryptedPath); // returns temp decrypted file path

    res.download(decryptedPath, transfer.fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Optionally delete the temp decrypted file after download
      fs.unlink(decryptedPath, () => {});
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error during download' });
  }
});
router.get('/download/:id', authenticate, async (req, res) => {
  try {
    const transfer = await FileTransfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', transfer.fileName); // Adjust if needed
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(filePath, transfer.fileName);
  } catch (error) {
    res.status(500).json({ message: 'Error downloading file', error: error.message });
  }
});

// Update transfer status
router.put('/transfer-status/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const transfer = await FileTransfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    // Only allow recipient to update status
    if (transfer.recipient.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to update this transfer' });
    }

    transfer.status = status;
    await transfer.save();

    res.json({ message: 'Transfer status updated', transfer });
  } catch (error) {
    res.status(500).json({ message: 'Error updating transfer status', error: error.message });
  }
});

module.exports = router;
