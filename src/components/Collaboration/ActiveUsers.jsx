import React from 'react';
import { useCollaboration } from '../../context/CollaborationContext';
import './ActiveUsers.css';

const ActiveUsers = () => {
  const { activeUsers, currentUser } = useCollaboration();
  
  if (!activeUsers || activeUsers.length === 0) {
    return (
      <div className="active-users-container">
        <div className="active-users-header">
          <span className="active-users-icon">👥</span>
          <span className="active-users-title">Active Users</span>
        </div>
        <div className="active-users-list">
          <div className="no-active-users">No other users active</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="active-users-container">
      <div className="active-users-header">
        <span className="active-users-icon">👥</span>
        <span className="active-users-title">Active Users</span>
        <span className="active-users-count">{activeUsers.length}</span>
      </div>
      
      <div className="active-users-list">
        {activeUsers
          .filter(user => user && user.id) // Filter out invalid users
          .map(user => (
          <div 
            key={user.id} 
            className={`active-user ${user.id === currentUser?.id ? 'current-user' : ''}`}
          >
            <div 
              className="user-avatar" 
              style={{ 
                backgroundColor: user.color || '#666666',
                border: user.id === currentUser?.id ? '2px solid white' : 'none'
              }}
            >
              {(user.username || user.name || 'U').substring(0, 1).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">
                {user.username || user.name || 'Unknown User'}
                {user.id === currentUser?.id && <span className="you-label">(You)</span>}
              </div>
              <div className="user-status">
                <span className="status-indicator"></span>
                <span className="status-text">Online</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveUsers; 