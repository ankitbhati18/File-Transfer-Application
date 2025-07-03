import React from 'react';

const Notification = ({ notifications, removeNotification }) => {
  return (
    <div className="notifications">
      {notifications.map(notification => (
        <div key={notification.id} className="notification">
          <span>{notification.message}</span>
          <button onClick={() => removeNotification(notification.id)}>×</button>
        </div>
      ))}
    </div>
  );
};

export default Notification;
