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
    // Multiple safety checks to prevent any undefined access
    if (!Array.isArray(activeUsers) || 
        activeUsers.length === 0 || 
        !currentUser || 
        typeof zoomLevel !== 'number' || 
        !panOffset || 
        typeof panOffset.x !== 'number' || 
        typeof panOffset.y !== 'number') {
      return;
    }
    
    // Filter and validate users with strict checking
    const validUsers = [];
    for (const user of activeUsers) {
      // Multiple strict validations
      if (!user || 
          typeof user !== 'object' || 
          !user.id || 
          user.id === currentUser.id ||
          !user.cursorPosition ||
          typeof user.cursorPosition !== 'object' ||
          typeof user.cursorPosition.x !== 'number' ||
          typeof user.cursorPosition.y !== 'number' ||
          isNaN(user.cursorPosition.x) ||
          isNaN(user.cursorPosition.y)) {
        continue; // Skip invalid users
      }
      validUsers.push(user);
    }
    
    // Process only validated users
    validUsers.forEach(user => {
      try {
        // Extract validated data
        const id = user.id;
        const cursorPosition = user.cursorPosition;
        const username = user.username || user.name || 'Unknown';
        const color = user.color || '#000000';
        
        // Final safety check before calculations
        if (!id || !cursorPosition) {
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
          setCursors(prev => {
            if (prev && prev[id]) {
              return {
                ...prev,
                [id]: { ...prev[id], visible: false }
              };
            }
            return prev;
          });
        }, 5000);
        
      } catch (error) {
        console.warn('CursorTrail: Error processing user cursor:', error);
      }
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