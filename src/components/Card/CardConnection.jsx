import React, { memo } from 'react';

const CardConnection = ({ sourcePosition, targetPosition, isHighlighted }) => {
  // Calculate the distance and angle between the two points
  const dx = targetPosition.x - sourcePosition.x;
  const dy = targetPosition.y - sourcePosition.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  // Optimizacija - koristimo CSS transformacije umesto SVG za bolje performanse
  return (
    <div
      className={`card-connection ${isHighlighted ? 'highlighted' : ''}`}
      style={{
        position: 'absolute',
        left: `${sourcePosition.x}px`,
        top: `${sourcePosition.y}px`,
        width: `${distance}px`,
        height: isHighlighted ? '3px' : '2px',
        backgroundColor: isHighlighted ? 'var(--accent-color)' : 'rgba(74, 158, 255, 0.6)',
        transformOrigin: 'left center',
        transform: `rotate(${angle}deg) translateZ(0)`, // Dodajemo translateZ(0) za hardversko ubrzanje
        opacity: isHighlighted ? 0.9 : 0.6,
        zIndex: isHighlighted ? 5 : 0,
        willChange: 'transform, opacity, height' // Nagoveštaj browseru za optimizaciju
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
          transform: 'translateZ(0)' // Hardversko ubrzanje za arrowhead
        }}
      />
    </div>
  );
};

// Koristimo React.memo da izbegnemo nepotrebna ponovna renderovanja
export default memo(CardConnection, (prevProps, nextProps) => {
  return (
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.sourcePosition.x === nextProps.sourcePosition.x &&
    prevProps.sourcePosition.y === nextProps.sourcePosition.y &&
    prevProps.targetPosition.x === nextProps.targetPosition.x &&
    prevProps.targetPosition.y === nextProps.targetPosition.y
  );
});