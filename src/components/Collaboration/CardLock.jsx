import React from 'react';
import { useCollaboration } from '../../context/CollaborationContext';
import './CardLock.css';

const CardLock = ({ cardId }) => {
  const { lockedCards, getUserById } = useCollaboration();
  
  // Check if card is locked (lockedCards is a Map, not an array)
  const lockInfo = lockedCards.get(cardId);
  
  if (!lockInfo) return null;
  
  // Get user information
  const user = getUserById(lockInfo.userId);
  const username = user ? user.name : lockInfo.userName || 'Unknown User';
  const userColor = user ? user.color : lockInfo.userColor || '#888888';
  
  return (
    <div className="card-lock" style={{ borderColor: userColor }}>
      <div className="lock-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <div className="lock-info">
        <span className="lock-username" style={{ color: userColor }}>
          {username}
        </span>
        <span className="lock-message">is editing</span>
      </div>
    </div>
  );
};

export default CardLock; 