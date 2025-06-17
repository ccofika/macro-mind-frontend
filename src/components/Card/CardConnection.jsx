import React, { memo } from 'react';

// Function to calculate the best anchor points based on card positions
const calculateAnchorPoints = (sourcePosition, targetPosition) => {
  // Card dimensions (approximate)
  const cardWidth = 280;
  const cardHeight = 120;
  const halfWidth = cardWidth / 2;
  const halfHeight = cardHeight / 2;
  
  // Calculate centers of both cards
  const sourceCenter = {
    x: sourcePosition.x + halfWidth,
    y: sourcePosition.y + halfHeight
  };
  
  const targetCenter = {
    x: targetPosition.x + halfWidth,
    y: targetPosition.y + halfHeight
  };
  
  // Calculate the vector between centers
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;
  const angle = Math.atan2(dy, dx);
  
  // Calculate edge points
  // We'll find the intersection points of the line between centers with each card's edges
  
  // Source card edge intersection
  let sourceX, sourceY;
  
  // Horizontal edges (top/bottom)
  if (Math.abs(Math.tan(angle)) > cardHeight / cardWidth) {
    // Intersect with top/bottom edges
    if (dy < 0) {
      // Top edge
      sourceY = sourcePosition.y;
      sourceX = sourceCenter.x - (halfHeight / Math.tan(angle));
    } else {
      // Bottom edge
      sourceY = sourcePosition.y + cardHeight;
      sourceX = sourceCenter.x + (halfHeight / Math.tan(angle));
    }
    
    // Clamp X to card width
    sourceX = Math.max(sourcePosition.x, Math.min(sourcePosition.x + cardWidth, sourceX));
  } 
  // Vertical edges (left/right)
  else {
    if (dx < 0) {
      // Left edge
      sourceX = sourcePosition.x;
      sourceY = sourceCenter.y - (halfWidth * Math.tan(angle));
    } else {
      // Right edge
      sourceX = sourcePosition.x + cardWidth;
      sourceY = sourceCenter.y + (halfWidth * Math.tan(angle));
    }
    
    // Clamp Y to card height
    sourceY = Math.max(sourcePosition.y, Math.min(sourcePosition.y + cardHeight, sourceY));
  }
  
  // Target card edge intersection
  let targetX, targetY;
  
  // Horizontal edges (top/bottom)
  if (Math.abs(Math.tan(angle)) > cardHeight / cardWidth) {
    // Intersect with top/bottom edges
    if (dy < 0) {
      // Bottom edge (of target)
      targetY = targetPosition.y + cardHeight;
      targetX = targetCenter.x + (halfHeight / Math.tan(angle));
    } else {
      // Top edge (of target)
      targetY = targetPosition.y;
      targetX = targetCenter.x - (halfHeight / Math.tan(angle));
    }
    
    // Clamp X to card width
    targetX = Math.max(targetPosition.x, Math.min(targetPosition.x + cardWidth, targetX));
  } 
  // Vertical edges (left/right)
  else {
    if (dx < 0) {
      // Right edge (of target)
      targetX = targetPosition.x + cardWidth;
      targetY = targetCenter.y + (halfWidth * Math.tan(angle));
    } else {
      // Left edge (of target)
      targetX = targetPosition.x;
      targetY = targetCenter.y - (halfWidth * Math.tan(angle));
    }
    
    // Clamp Y to card height
    targetY = Math.max(targetPosition.y, Math.min(targetPosition.y + cardHeight, targetY));
  }
  
  return {
    sourceAnchor: { x: sourceX, y: sourceY },
    targetAnchor: { x: targetX, y: targetY }
  };
};

const CardConnection = ({ sourcePosition, targetPosition, isHighlighted }) => {
  // Calculate the best anchor points
  const { sourceAnchor, targetAnchor } = calculateAnchorPoints(sourcePosition, targetPosition);
  
  // Calculate the distance and angle between the anchor points
  const dx = targetAnchor.x - sourceAnchor.x;
  const dy = targetAnchor.y - sourceAnchor.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  // Use CSS transformations for better performance
  return (
    <div
      className={`card-connection ${isHighlighted ? 'highlighted' : ''}`}
      style={{
        position: 'absolute',
        left: `${sourceAnchor.x}px`,
        top: `${sourceAnchor.y}px`,
        width: `${distance}px`,
        height: isHighlighted ? '3px' : '2px',
        backgroundColor: isHighlighted ? 'var(--accent-color)' : 'rgba(74, 158, 255, 0.6)',
        transformOrigin: 'left center',
        transform: `rotate(${angle}deg) translateZ(0)`, // Add translateZ(0) for hardware acceleration
        opacity: isHighlighted ? 0.9 : 0.6,
        zIndex: isHighlighted ? 5 : 0,
        willChange: 'transform, opacity, height', // Hint to browser for optimization
        boxShadow: isHighlighted ? '0 0 8px rgba(74, 158, 255, 0.5)' : 'none'
      }}
    >
      {/* Arrow at end of connection */}
      <div
        className="connection-arrow"
        style={{
          position: 'absolute',
          right: 0,
          top: isHighlighted ? '-5px' : '-4px',
          width: 0,
          height: 0,
          borderTop: `${isHighlighted ? '5px' : '4px'} solid transparent`,
          borderBottom: `${isHighlighted ? '5px' : '4px'} solid transparent`,
          borderLeft: `${isHighlighted ? '10px' : '8px'} solid ${isHighlighted ? 'var(--accent-color)' : 'rgba(74, 158, 255, 0.6)'}`,
          transformOrigin: 'center center',
          transform: 'translateZ(0)' // Hardware acceleration for arrowhead
        }}
      />
    </div>
  );
};

// Use React.memo to avoid unnecessary re-renders
export default memo(CardConnection, (prevProps, nextProps) => {
  return (
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.sourcePosition.x === nextProps.sourcePosition.x &&
    prevProps.sourcePosition.y === nextProps.sourcePosition.y &&
    prevProps.targetPosition.x === nextProps.targetPosition.x &&
    prevProps.targetPosition.y === nextProps.targetPosition.y
  );
});