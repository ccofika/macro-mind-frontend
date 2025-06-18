import React, { useEffect, useState } from 'react';
import { useCollaboration } from '../../context/CollaborationContext';
import { useCanvas } from '../../context/CanvasContext';
import './CursorTrail.css';

const CursorTrail = () => {
  const { activeUsers, currentUser } = useCollaboration();
  const { zoomLevel, panOffset } = useCanvas();
  const [cursors, setCursors] = useState({});
  
  // Update cursors with animation
  useEffect(() => {
    // Safety check for activeUsers array
    if (!Array.isArray(activeUsers) || activeUsers.length === 0) {
      return;
    }
    
    // Filter out current user and users without cursor position
    const otherUsers = activeUsers.filter(user => 
      user && 
      typeof user === 'object' &&
      user.id !== currentUser?.id && 
      user.cursorPosition && 
      typeof user.cursorPosition === 'object' &&
      typeof user.cursorPosition.x === 'number' && 
      typeof user.cursorPosition.y === 'number'
    );
    
    // Update cursor positions with smooth animation
    otherUsers.forEach(user => {
      // Extra safety check for user object
      if (!user || typeof user !== 'object') {
        return;
      }
      
      // Safely destructure with defaults
      const { 
        id = null, 
        cursorPosition = null, 
        username = user.name || 'Unknown', 
        color = '#000000' 
      } = user;
      
      // Safely check if we have all required data
      if (!id || !cursorPosition || 
          typeof cursorPosition.x !== 'number' || 
          typeof cursorPosition.y !== 'number') {
        return;
      }
      
      // Apply zoom and pan transformations
      const adjustedX = cursorPosition.x * zoomLevel + panOffset.x;
      const adjustedY = cursorPosition.y * zoomLevel + panOffset.y;
      
      setCursors(prev => ({
        ...prev,
        [id]: {
          position: { x: adjustedX, y: adjustedY },
          username,
          color,
          timestamp: Date.now(),
          visible: true
        }
      }));
      
      // Hide cursor after inactivity (5 seconds)
      const hideTimeout = setTimeout(() => {
        setCursors(prev => ({
          ...prev,
          [id]: { ...prev[id], visible: false }
        }));
      }, 5000);
      
      return () => clearTimeout(hideTimeout);
    });
  }, [activeUsers, currentUser, zoomLevel, panOffset]);
  
  return (
    <div className="cursor-container">
      {Object.entries(cursors).map(([userId, cursor]) => {
        // Safety check for cursor object
        if (!cursor || !cursor.position || cursor.visible !== true) {
          return null;
        }
        
        return (
          <div 
            key={userId} 
            className="remote-cursor"
            style={{
              left: `${cursor.position.x || 0}px`,
              top: `${cursor.position.y || 0}px`,
              '--user-color': cursor.color || '#000000'
            }}
          >
            <div className="cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path 
                  fill={cursor.color} 
                  d="M0,0 L16,5.5 L9,9 L5.5,16 L0,0" 
                />
              </svg>
            </div>
            <div className="cursor-label" style={{ backgroundColor: cursor.color || '#000000' }}>
              {cursor.username || 'Unknown'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CursorTrail; 