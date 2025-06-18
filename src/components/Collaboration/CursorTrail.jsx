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
    // Filter out current user and users without cursor position
    const otherUsers = activeUsers.filter(user => 
      user.id !== currentUser?.id && 
      user.cursorPosition && 
      user.cursorPosition.x !== undefined && 
      user.cursorPosition.y !== undefined
    );
    
    // Update cursor positions with smooth animation
    otherUsers.forEach(user => {
      const { id, cursorPosition, username, color } = user;
      
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
      {Object.entries(cursors).map(([userId, cursor]) => (
        cursor.visible && (
          <div 
            key={userId} 
            className="remote-cursor"
            style={{
              left: `${cursor.position.x}px`,
              top: `${cursor.position.y}px`,
              '--user-color': cursor.color
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
            <div className="cursor-label" style={{ backgroundColor: cursor.color }}>
              {cursor.username}
            </div>
          </div>
        )
      ))}
    </div>
  );
};

export default CursorTrail; 