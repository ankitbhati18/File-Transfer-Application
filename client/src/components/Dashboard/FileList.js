import React from 'react';
import api from '../services/api';

const FileList = ({ transfers }) => {
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

  const handleDownload = async (transferId, fileName) => {
    alert("File - Downloaded");
    try {
      const response = await api.get(`/files/download/${transferId}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'downloaded-file';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="file-list-container">
      <h3>Transfer History</h3>

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

                {/* Download Button */}
                <div className="download-section">
                  <button
                    className="download-btn"
                    onClick={() => handleDownload(transfer._id, transfer.fileName)}
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileList;
