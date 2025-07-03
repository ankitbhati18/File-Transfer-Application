import React, { useState } from 'react';
import { getSocket } from '../services/socket';
import api from '../services/api';

const FileUpload = ({ users, onFileUpload, onTransferStart }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleUploadAndTransfer = async () => {
    if (!selectedFile || !selectedRecipient) {
      alert('Please select a file and recipient');
      return;
    }

    setUploading(true);
    
    try {
      // Upload file first
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const uploadResponse = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const { file } = uploadResponse.data;
      
      // Record transfer in database
      await api.post('/files/record-transfer', {
        recipientId: selectedRecipient,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      });

      // Start real-time transfer
      const socket = getSocket();
      const fileId = Date.now().toString();
      
      // Notify recipient
      socket.emit('initiate-transfer', {
        recipientId: selectedRecipient,
        fileId: fileId,
        fileName: selectedFile.name,
        fileSize: selectedFile.size
      });

      // Start transfer progress tracking
      onTransferStart({
        fileId: fileId,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        recipientId: selectedRecipient,
        progress: 0
      });

      // Simulate file chunk transfer
      await simulateFileTransfer(socket, selectedFile, selectedRecipient, fileId);

      onFileUpload(file);
      setSelectedFile(null);
      setSelectedRecipient('');
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.response?.data?.message || error.message);
    } finally {
      setUploading(false);
    }
  };

  const simulateFileTransfer = async (socket, file, recipientId, fileId) => {
    const chunkSize = 1024 * 64; // 64KB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      // Convert chunk to base64
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = () => {
          const progress = Math.round(((i + 1) / totalChunks) * 100);
          
          socket.emit('file-chunk', {
            recipientId: recipientId,
            chunk: reader.result,
            progress: progress,
            fileId: fileId
          });
          
          resolve();
        };
        reader.readAsDataURL(chunk);
      });
      
      // Small delay to simulate network transfer
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Mark transfer as complete
    socket.emit('transfer-complete', {
      recipientId: recipientId,
      fileId: fileId
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="file-upload-container">
      <h3>Upload & Transfer File</h3>
      
      <div 
        className={`file-drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {selectedFile ? (
          <div className="selected-file">
            <div className="file-icon">📄</div>
            <div className="file-details">
              <div className="file-name">{selectedFile.name}</div>
              <div className="file-size">{formatFileSize(selectedFile.size)}</div>
            </div>
          </div>
        ) : (
          <div className="drop-zone-content">
            <div className="upload-icon">📤</div>
            <p>Drag & drop a file here or click to select</p>
            <p className="file-limit">Maximum file size: 10MB</p>
          </div>
        )}
      </div>
      
      <div className="recipient-selection">
        <h4>Select Recipient</h4>
        <select 
          value={selectedRecipient} 
          onChange={(e) => setSelectedRecipient(e.target.value)}
        >
          <option value="">Choose a recipient...</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.username} ({user.isOnline ? 'Online' : 'Offline'})
            </option>
          ))}
        </select>
      </div>
      
      <button 
        className="transfer-button"
        onClick={handleUploadAndTransfer}
        disabled={!selectedFile || !selectedRecipient || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload & Transfer'}
      </button>
    </div>
  );
};

export default FileUpload;
