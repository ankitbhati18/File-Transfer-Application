import React from 'react';

const Header = ({ user, onLogout }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo">
          <h1>FileShare</h1>
        </div>
        
        <div className="user-info">
          <span className="username">Welcome, {user.username}!</span>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
