import React from 'react';
import { useCollaboration } from '../../context/CollaborationContext';
import './ActiveUsers.css';

const ActiveUsers = () => {
  const { activeUsers, currentUser } = useCollaboration();
  
  if (!activeUsers || activeUsers.length === 0) {
    return (
      <div className="active-users">
        <span className="active-users-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </span>
        <span className="users-count">0 users</span>
      </div>
    );
  }
  
  return (
    <div className="active-users">
      <span className="active-users-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </span>
      <span className="users-count">{activeUsers.length} user{activeUsers.length !== 1 ? 's' : ''}</span>
      <div className="users-list">
        {activeUsers
          .filter(user => user && user.id) // Filter out invalid users
          .map(user => (
          <div 
            key={user.id} 
            className={`user-item ${user.id === currentUser?.id ? 'current-user' : ''}`}
          >
            <div 
              className="user-avatar" 
              style={{ 
                backgroundColor: user.color || '#3B82F6',
                border: user.id === currentUser?.id ? '2px solid white' : 'none'
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">
                {user.name || 'Anonymous'}
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