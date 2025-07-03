import React from 'react';

const TransferProgress = ({ transfers }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="transfer-progress-container">
      <h3>Active Transfers</h3>
      
      {transfers.length === 0 ? (
        <div className="empty-state">
          <p>No active transfers</p>
        </div>
      ) : (
        <div className="active-transfers">
          {transfers.map(transfer => (
            <div key={transfer.fileId} className="transfer-progress-item">
              <div className="transfer-header">
                <div className="file-info">
                  <span className="file-name">{transfer.fileName}</span>
                  <span className="file-size">{formatFileSize(transfer.fileSize)}</span>
                </div>
                <div className="progress-percentage">
                  {transfer.progress}%
                </div>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${transfer.progress}%` }}
                ></div>
              </div>
              
              <div className="transfer-status">
                {transfer.progress === 100 ? 'Completed' : 'Transferring...'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransferProgress;
