import React, { useCallback, useEffect, useState } from 'react';
import './OffscreenPointers.css';
import { useCards } from '../../context/CardContext';
import { useCanvas } from '../../context/CanvasContext';

const OffscreenPointers = () => {
  const { cards } = useCards();
  const { pan, zoom, navigateTo } = useCanvas();
  const [offscreenCards, setOffscreenCards] = useState([]);
  
  // Calculate which cards are offscreen but nearby
  useEffect(() => {
    // Only consider category cards
    const categoryCards = cards.filter(card => card.type === 'category');
    
    // Calculate viewport boundaries in canvas coordinates
    const viewportLeft = -pan.x / zoom;
    const viewportTop = -pan.y / zoom;
    const viewportRight = viewportLeft + window.innerWidth / zoom;
    const viewportBottom = viewportTop + window.innerHeight / zoom;
    
    // Define the "nearby" threshold (how far outside the viewport to show pointers)
    const nearbyThreshold = 1500; // canvas units
    
    // Extended viewport for "nearby" detection
    const extendedLeft = viewportLeft - nearbyThreshold;
    const extendedTop = viewportTop - nearbyThreshold;
    const extendedRight = viewportRight + nearbyThreshold;
    const extendedBottom = viewportBottom + nearbyThreshold;
    
    // Find cards that are outside the viewport but within the extended viewport
    const nearby = categoryCards.filter(card => {
      const cardX = card.position.x;
      const cardY = card.position.y;
      
      // Check if card is outside viewport
      const isOutside = cardX < viewportLeft || cardX > viewportRight || 
                       cardY < viewportTop || cardY > viewportBottom;
      
      // Check if card is within extended viewport
      const isNearby = cardX >= extendedLeft && cardX <= extendedRight &&
                      cardY >= extendedTop && cardY <= extendedBottom;
      
      return isOutside && isNearby;
    });
    
    // Calculate position and direction for each nearby offscreen card
    const processed = nearby.map(card => {
      // Card center position
      const cardX = card.position.x;
      const cardY = card.position.y;
      
      // Calculate direction from viewport center to card
      const viewportCenterX = (viewportLeft + viewportRight) / 2;
      const viewportCenterY = (viewportTop + viewportBottom) / 2;
      
      const directionX = cardX - viewportCenterX;
      const directionY = cardY - viewportCenterY;
      
      // Normalize direction vector
      const length = Math.sqrt(directionX * directionX + directionY * directionY);
      const normalizedX = directionX / length;
      const normalizedY = directionY / length;
      
      // Calculate angle in degrees
      const angle = Math.atan2(directionY, directionX) * 180 / Math.PI;
      
      // Calculate intersection with viewport edge
      // Viewport dimensions in screen coordinates
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Padding from edge (in screen coordinates)
      const edgePadding = 60;
      
      // Calculate position along the edge of the viewport
      let posX, posY;
      
      // Determine which edge to place the pointer on
      if (Math.abs(normalizedX) > Math.abs(normalizedY)) {
        // Place on left or right edge
        posX = normalizedX > 0 ? viewportWidth - edgePadding : edgePadding;
        posY = viewportCenterY + (posX - viewportCenterX) * normalizedY / normalizedX;
        
        // Clamp Y position
        posY = Math.max(edgePadding, Math.min(viewportHeight - edgePadding, posY));
      } else {
        // Place on top or bottom edge
        posY = normalizedY > 0 ? viewportHeight - edgePadding : edgePadding;
        posX = viewportCenterX + (posY - viewportCenterY) * normalizedX / normalizedY;
        
        // Clamp X position
        posX = Math.max(edgePadding, Math.min(viewportWidth - edgePadding, posX));
      }
      
      // Calculate opacity based on distance (closer = more visible)
      const maxDistance = Math.sqrt(nearbyThreshold * nearbyThreshold * 2); // diagonal distance
      const distanceOpacity = 1 - Math.min(1, Math.max(0, (length - 500) / maxDistance));
      
      return {
        ...card,
        screenPosition: { x: posX, y: posY },
        angle: angle,
        distance: length,
        opacity: 0.4 + distanceOpacity * 0.6 // Scale opacity between 0.4 and 1.0
      };
    });
    
    // Sort by distance so closer cards appear on top
    processed.sort((a, b) => a.distance - b.distance);
    
    setOffscreenCards(processed);
  }, [cards, pan, zoom]);
  
  // Handle click on a pointer to navigate to the card
  const handlePointerClick = useCallback((card) => {
    // Use the navigateTo function from CanvasContext with a slight zoom in
    navigateTo(card.position, Math.min(zoom * 1.2, 1.5));
  }, [navigateTo, zoom]);
  
  const getArrowIcon = (direction) => {
    const svgProps = {
      width: "12",
      height: "12",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    };

    switch (direction) {
      case 0: // →
        return <svg {...svgProps}><polyline points="9 18 15 12 9 6"/></svg>;
      case 1: // ↗
        return <svg {...svgProps}><line x1="7" y1="17" x2="17" y2="7"/><polyline points="17 7 17 13"/><polyline points="11 7 17 7"/></svg>;
      case 2: // ↑
        return <svg {...svgProps}><polyline points="18 15 12 9 6 15"/></svg>;
      case 3: // ↖
        return <svg {...svgProps}><line x1="17" y1="17" x2="7" y2="7"/><polyline points="7 7 7 13"/><polyline points="7 7 13 7"/></svg>;
      case 4: // ←
        return <svg {...svgProps}><polyline points="15 18 9 12 15 6"/></svg>;
      case 5: // ↙
        return <svg {...svgProps}><line x1="17" y1="7" x2="7" y2="17"/><polyline points="7 17 7 11"/><polyline points="13 17 7 17"/></svg>;
      case 6: // ↓
        return <svg {...svgProps}><polyline points="6 9 12 15 18 9"/></svg>;
      case 7: // ↘
        return <svg {...svgProps}><line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 17 17 11"/><polyline points="11 17 17 17"/></svg>;
      default:
        return <svg {...svgProps}><polyline points="9 18 15 12 9 6"/></svg>;
    }
  };

  // Calculate direction index (0-7) based on angle
  const getDirectionIndex = (angle) => {
    // Convert angle to 0-360 range
    let normalizedAngle = ((angle + 180) % 360 + 360) % 360;
    // Map to 8 directions (each covering 45 degrees)
    return Math.round(normalizedAngle / 45) % 8;
  };

  return (
    <div className="offscreen-pointers-container">
      {offscreenCards.map(card => (
        <div
          key={card.id}
          className="offscreen-pointer"
          style={{
            left: `${card.screenPosition.x}px`,
            top: `${card.screenPosition.y}px`,
            transform: `translate(-50%, -50%)`,
            opacity: card.opacity,
          }}
          onClick={() => handlePointerClick(card)}
          title={`Go to: ${card.title || 'Untitled Card'}`}
        >
          {getArrowIcon(getDirectionIndex(card.angle))}
        </div>
      ))}
    </div>
  );
};

export default OffscreenPointers; 