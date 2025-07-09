import React, { useState } from 'react';
import api from '../services/api';

const FileList = ({ transfers, onFileOperation }) => {
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'failed': return '#F44336';
      default: return '#757575';
    }
  };

  const handleDownload = async (file) => {
    setDownloading(file._id);
    setError(null);
    try {
      const response = await api.get(`/files/download/${file.id}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Download failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete file ${file.fileName}? This cannot be undone.`)) return;
    setDeleting(file._id);
    setError(null);
    try {
      await api.delete(`/files/delete/${file.id}`);
      if (onFileOperation) {
        onFileOperation(); // Use callback instead of reload
      }
    } catch (err) {
      setError('Delete failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="file-list-container">
      <h3>Transfer History</h3>
      {error && <div className="error-message">{error}</div>}
      {transfers.length === 0 ? (
        <div className="empty-state">
          <p>No file transfers yet</p>
        </div>
      ) : (
        <div className="transfers-list">
          {transfers.map(transfer => (
            <div key={transfer._id} className="transfer-item">
              <div className="transfer-info">
                <div className="file-details">
                  <div className="file-name">{transfer.fileName}</div>
                  <div className="file-meta">
                    {formatFileSize(transfer.fileSize)} • {transfer.fileType}
                  </div>
                </div>
                <div className="transfer-details">
                  <div className="participants">
                    <span className="sender">From: {transfer.sender.username}</span>
                    <span className="recipient">To: {transfer.recipient.username}</span>
                  </div>
                  <div className="transfer-meta">
                    <span className="date">{formatDate(transfer.createdAt)}</span>
                    <span 
                      className="status"
                      style={{ color: getStatusColor(transfer.status) }}
                    >
                      {transfer.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="file-actions">
                <button 
                  onClick={() => handleDownload(transfer)}
                  disabled={downloading === transfer._id}
                >
                  {downloading === transfer._id ? 'Downloading...' : 'Download'}
                </button>
                <button 
                  onClick={() => handleDelete(transfer)}
                  disabled={deleting === transfer._id}
                  style={{ marginLeft: 8 }}
                >
                  {deleting === transfer._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileList;
