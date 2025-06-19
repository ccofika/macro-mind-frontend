import React, { useCallback, useEffect, useRef, useState } from 'react';
import './MiniMap.css';
import { useCards } from '../../context/CardContext';
import { useCanvas } from '../../context/CanvasContext';

const MiniMap = () => {
  const { cards } = useCards();
  const { pan, zoom, navigateTo, getCanvasBounds } = useCanvas();
  const [bounds, setBounds] = useState({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const miniMapRef = useRef(null);
  const viewportRef = useRef(null);
  
  // Calculate bounds of all cards to determine the canvas size
  useEffect(() => {
    if (cards.length === 0) return;
    
    // Use the getCanvasBounds function from CanvasContext
    const calculatedBounds = getCanvasBounds(cards);
    setBounds(calculatedBounds);
  }, [cards, getCanvasBounds]);
  
  // Calculate the scale factor for the minimap
  const getScaleFactor = useCallback(() => {
    if (!miniMapRef.current) return 1;
    
    const miniMapWidth = miniMapRef.current.clientWidth;
    const miniMapHeight = miniMapRef.current.clientHeight;
    
    const canvasWidth = bounds.maxX - bounds.minX;
    const canvasHeight = bounds.maxY - bounds.minY;
    
    // Return the smaller scale to fit the entire canvas in the minimap
    return Math.min(
      miniMapWidth / Math.max(canvasWidth, 1),
      miniMapHeight / Math.max(canvasHeight, 1)
    );
  }, [bounds]);
  
  // Convert canvas coordinates to minimap coordinates
  const canvasToMiniMap = useCallback((x, y) => {
    const scaleFactor = getScaleFactor();
    
    return {
      x: (x - bounds.minX) * scaleFactor,
      y: (y - bounds.minY) * scaleFactor
    };
  }, [bounds, getScaleFactor]);
  
  // Convert minimap coordinates to canvas coordinates
  const miniMapToCanvas = useCallback((x, y) => {
    const scaleFactor = getScaleFactor();
    
    return {
      x: x / scaleFactor + bounds.minX,
      y: y / scaleFactor + bounds.minY
    };
  }, [bounds, getScaleFactor]);
  
  // Calculate the viewport rectangle in the minimap
  const getViewportRect = useCallback(() => {
    if (!miniMapRef.current) return { x: 0, y: 0, width: 0, height: 0 };
    
    const scaleFactor = getScaleFactor();
    
    // Calculate the viewport size in canvas coordinates
    const viewportWidth = window.innerWidth / zoom;
    const viewportHeight = window.innerHeight / zoom;
    
    // Convert to minimap coordinates
    const viewportX = (-pan.x / zoom - bounds.minX) * scaleFactor;
    const viewportY = (-pan.y / zoom - bounds.minY) * scaleFactor;
    const viewportW = viewportWidth * scaleFactor;
    const viewportH = viewportHeight * scaleFactor;
    
    return {
      x: viewportX,
      y: viewportY,
      width: viewportW,
      height: viewportH
    };
  }, [pan, zoom, bounds, getScaleFactor]);
  
  // Handle click on the minimap to navigate
  const handleMiniMapClick = useCallback((e) => {
    if (isDragging) return;
    
    const rect = miniMapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert minimap coordinates to canvas coordinates
    const canvasPos = miniMapToCanvas(x, y);
    
    // Use the navigateTo function from CanvasContext
    navigateTo(canvasPos);
  }, [miniMapToCanvas, navigateTo, isDragging]);
  
  // Handle drag on the viewport rectangle
  const handleViewportMouseDown = useCallback((e) => {
    e.stopPropagation();
    setIsDragging(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startPanX = pan.x;
    const startPanY = pan.y;
    
    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      // Convert the delta to canvas coordinates
      const scaleFactor = getScaleFactor();
      const canvasDx = dx / scaleFactor * zoom;
      const canvasDy = dy / scaleFactor * zoom;
      
      // Update pan position
      const newPanX = startPanX - canvasDx;
      const newPanY = startPanY - canvasDy;
      
      // Use resetView with custom position
      navigateTo({ x: -newPanX / zoom, y: -newPanY / zoom });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [pan, zoom, getScaleFactor, navigateTo]);
  
  // Get marker color based on card type
  const getMarkerColor = (card) => {
    if (card.type === 'category') {
      return 'rgba(74, 158, 255, 0.8)'; // Blue for categories
    } else {
      return 'rgba(255, 158, 74, 0.8)'; // Orange for answers
    }
  };
  
  // Get marker size based on card type
  const getMarkerSize = (card) => {
    if (card.type === 'category') {
      return { width: '8px', height: '8px' };
    } else {
      return { width: '6px', height: '6px' };
    }
  };
  
  // Calculate the viewport rectangle
  const viewportRect = getViewportRect();
  
  return (
    <div className={`minimap-container ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="minimap-header">
        <span>Mini-Map</span>
        <button 
          className="minimap-toggle" 
          onClick={() => setIsVisible(!isVisible)}
          title={isVisible ? 'Hide Mini-Map' : 'Show Mini-Map'}
        >
          {isVisible ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          )}
        </button>
      </div>
      
      <div 
        className="minimap" 
        ref={miniMapRef}
        onClick={handleMiniMapClick}
      >
        {/* Grid lines for reference */}
        <div className="minimap-grid"></div>
        
        {/* Card markers */}
        {cards.map(card => {
          const { x, y } = canvasToMiniMap(card.position.x, card.position.y);
          const markerSize = getMarkerSize(card);
          return (
            <div 
              key={card.id}
              className={`minimap-marker ${card.type}`}
              style={{ 
                left: `${x}px`, 
                top: `${y}px`,
                backgroundColor: getMarkerColor(card),
                width: markerSize.width,
                height: markerSize.height
              }}
              title={card.title}
            />
          );
        })}
        
        {/* Viewport rectangle */}
        <div 
          className="minimap-viewport"
          ref={viewportRef}
          style={{
            left: `${viewportRect.x}px`,
            top: `${viewportRect.y}px`,
            width: `${viewportRect.width}px`,
            height: `${viewportRect.height}px`
          }}
          onMouseDown={handleViewportMouseDown}
        />
      </div>
    </div>
  );
};

export default MiniMap; 