import React, { useState, useEffect } from 'react';
import Header from '../Common/Header';
import FileUpload from './FileUpload';
import FileList from './FileList';
import TransferProgress from './TransferProgress';
import { getSocket } from '../services/socket';
import api from '../services/api';

const Dashboard = ({ user, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [activeTransfers, setActiveTransfers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchTransfers();
    setupSocketListeners();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTransfers = async () => {
    try {
      const response = await api.get('/files/transfers');
      setTransfers(response.data);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    }
  };

  const setupSocketListeners = () => {
    const socket = getSocket();
    
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
      fetchTransfers();
    });
  };

  const handleFileUpload = (fileData) => {
    // File uploaded successfully
    console.log('File uploaded:', fileData);
  };

  const handleTransferStart = (transferData) => {
    setActiveTransfers(prev => [...prev, transferData]);
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
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
            <FileList transfers={transfers} />
          </div>
        </div>
        
        {/* Notifications */}
        <div className="notifications">
          {notifications.map(notification => (
            <div key={notification.id} className="notification">
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