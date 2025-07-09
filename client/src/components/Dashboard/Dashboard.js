import React, { useState, useEffect } from 'react';
import Header from '../Common/Header';
import FileUpload from './FileUpload';
import FileList from './FileList';
import TransferProgress from './TransferProgress';
import { getSocket, isSocketConnected } from '../services/socket';
import api from '../services/api';

const Dashboard = ({ user, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [activeTransfers, setActiveTransfers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchTransfers();
    setupSocketListeners();
    setLoading(false);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    }
  };

  const fetchTransfers = async () => {
    try {
      const response = await api.get('/files/transfers');
      setTransfers(response.data);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      setError('Failed to load transfer history');
    }
  };

  const setupSocketListeners = () => {
    const socket = getSocket();
    
    if (!socket) {
      console.error('Socket not initialized');
      return;
    }

    socket.on('transfer-request', (data) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'transfer-request',
        message: `${data.senderName} wants to send you ${data.fileName}`,
        data: data
      }]);
    });

    socket.on('transfer-accepted', (data) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'transfer-accepted',
        message: 'Transfer accepted!',
        data: data
      }]);
    });

    socket.on('transfer-progress', (data) => {
      setActiveTransfers(prev => 
        prev.map(transfer => 
          transfer.fileId === data.fileId 
            ? { ...transfer, progress: data.progress }
            : transfer
        )
      );
    });

    socket.on('transfer-finished', (data) => {
      setActiveTransfers(prev => 
        prev.filter(transfer => transfer.fileId !== data.fileId)
      );
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'transfer-complete',
        message: 'File transfer completed!',
        data: data
      }]);
      fetchTransfers(); // Refresh transfer history
    });

    socket.on('transfer-error', (data) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'transfer-error',
        message: `Transfer error: ${data.message}`,
        data: data
      }]);
    });

    socket.on('connect_error', (error) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'connection-error',
        message: 'Connection lost. Trying to reconnect...',
        data: { error }
      }]);
    });

    socket.on('reconnect', () => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'connection-success',
        message: 'Reconnected successfully!',
        data: {}
      }]);
    });
  };

  const handleFileUpload = (fileData) => {
    console.log('File uploaded:', fileData);
    setNotifications(prev => [...prev, {
      id: Date.now(),
      type: 'upload-success',
      message: 'File uploaded successfully!',
      data: fileData
    }]);
    fetchTransfers(); // Refresh transfer history
  };

  const handleTransferStart = (transferData) => {
    setActiveTransfers(prev => [...prev, transferData]);
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleFileOperation = () => {
    // Refresh data after file operations
    fetchTransfers();
  };

  if (loading) {
    return (
      <div className="dashboard">
        <Header user={user} onLogout={onLogout} />
        <div className="dashboard-content">
          <div className="loading">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        {error && (
          <div className="error-message" style={{ marginBottom: '1rem' }}>
            {error}
            <button 
              onClick={() => setError(null)}
              style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        )}

        <div className="dashboard-grid">
          <div className="upload-section">
            <FileUpload 
              users={users}
              onFileUpload={handleFileUpload}
              onTransferStart={handleTransferStart}
            />
          </div>
          
          <div className="transfers-section">
            <TransferProgress transfers={activeTransfers} />
          </div>
          
          <div className="history-section">
            <FileList 
              transfers={transfers} 
              onFileOperation={handleFileOperation}
            />
          </div>
        </div>
        
        {/* Notifications */}
        <div className="notifications">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification ${notification.type === 'transfer-error' || notification.type === 'connection-error' ? 'error' : ''}`}
            >
              <span>{notification.message}</span>
              <button onClick={() => removeNotification(notification.id)}>×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
