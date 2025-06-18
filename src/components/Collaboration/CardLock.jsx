import React from 'react';
import { useCollaboration } from '../../context/CollaborationContext';
import './CardLock.css';

const CardLock = ({ cardId, cardPosition, cardSize = { width: 280, height: 120 } }) => {
  const { lockedCards, getUserById } = useCollaboration();
  
  // Check if card is locked (lockedCards is a Map, not an array)
  const lockInfo = lockedCards.get(cardId);
  
  if (!lockInfo) return null;
  
  // Get user information
  const user = getUserById(lockInfo.userId);
  const username = user ? user.name : lockInfo.userName || 'Unknown User';
  const userColor = user ? user.color : lockInfo.userColor || '#888888';
  
  // Calculate position relative to card
  const lockPosition = {
    x: cardPosition.x + cardSize.width + 10, // Position to the right of the card
    y: cardPosition.y - 5 // Slightly above the card top
  };
  
  return (
    <div 
      className="card-lock" 
      style={{ 
        borderColor: userColor,
        position: 'absolute',
        left: lockPosition.x,
        top: lockPosition.y,
        transform: 'none' // Remove any default transform
      }}
    >
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