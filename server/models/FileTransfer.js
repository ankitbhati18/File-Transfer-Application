const mongoose = require('mongoose');

const fileTransferSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User ',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User ',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed', 'failed'],
    default: 'pending'
  },
  transferredAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FileTransfer', fileTransferSchema);
