import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { canvasApi } from '../services/api';

const CanvasContext = createContext();

export const useCanvas = () => useContext(CanvasContext);

export const CanvasProvider = ({ children }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Load saved canvas state
  useEffect(() => {
    const loadCanvasState = () => {
      try {
        const savedState = localStorage.getItem('canvasState');
        if (savedState) {
          const { zoom: savedZoom, pan: savedPan } = JSON.parse(savedState);
          // Proveri da li su vrednosti validne
          if (typeof savedZoom === 'number' && !isNaN(savedZoom) &&
              savedPan && !isNaN(savedPan.x) && !isNaN(savedPan.y)) {
            setZoom(savedZoom);
            setPan(savedPan);
          }
        }
      } catch (error) {
        console.error('Failed to load canvas state:', error);
      }
    };
    
    loadCanvasState();
  }, []);

  // Save canvas state to localStorage and server
  const saveCanvasState = useCallback(async () => {
    try {
      localStorage.setItem('canvasState', JSON.stringify({ zoom, pan }));
      
      // Save to server - u pravoj implementaciji
      // await canvasApi.saveCanvasState(zoom, pan);
    } catch (error) {
      console.error('Failed to save canvas state:', error);
    }
  }, [zoom, pan]);

  // Auto-save canvas state
  useEffect(() => {
    const timer = setTimeout(() => {
      saveCanvasState();
    }, 5000); // Auto save every 5 seconds if zoom/pan changed
    
    return () => clearTimeout(timer);
  }, [zoom, pan, saveCanvasState]);

  // Improved zoom function with precise cursor-centered zooming
  const handleZoom = useCallback((delta, point) => {
    setZoom(prevZoom => {
      // Calculate new zoom level with exponential scaling for smoother zoom
      const zoomFactor = delta > 0 ? 0.9 : 1.1; // Reversed for more intuitive zooming
      const newZoom = Math.max(0.1, Math.min(5, prevZoom * zoomFactor));
      
      // Use center of screen if no point provided
      const zoomPoint = point || { 
        x: window.innerWidth / 2, 
        y: window.innerHeight / 2 
      };
      
      // Calculate the point in world coordinates before zoom
      const worldX = (zoomPoint.x - pan.x) / prevZoom;
      const worldY = (zoomPoint.y - pan.y) / prevZoom;
      
      // Calculate new pan position to keep the point under cursor
      const newPanX = zoomPoint.x - worldX * newZoom;
      const newPanY = zoomPoint.y - worldY * newZoom;
      
      // Update pan position
      setPan({
        x: newPanX,
        y: newPanY
      });
      
      return newZoom;
    });
  }, [pan]);

  // Explicitly defined function for panning
  const handlePan = useCallback((dx, dy) => {
    setPan(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));
  }, []);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(({ x, y }) => {
    return {
      x: (x - pan.x) / zoom,
      y: (y - pan.y) / zoom
    };
  }, [zoom, pan]);

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = useCallback(({ x, y }) => {
    return {
      x: x * zoom + pan.x,
      y: y * zoom + pan.y
    };
  }, [zoom, pan]);

  // Reset to center
  const resetView = useCallback((customView) => {
    if (customView) {
      setZoom(customView.zoom || 1);
      setPan({ x: customView.x || 0, y: customView.y || 0 });
    } else {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
    saveCanvasState();
  }, [saveCanvasState]);

  // Navigate to specific position with animation
  const navigateTo = useCallback((position, targetZoom = null) => {
    setIsAnimating(true);
    
    const startX = pan.x;
    const startY = pan.y;
    const startZoom = zoom;
    const targetX = -position.x * (targetZoom || zoom) + window.innerWidth / 2;
    const targetY = -position.y * (targetZoom || zoom) + window.innerHeight / 2;
    const startTime = Date.now();
    const duration = 500; // ms
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease in-out function
      const easeInOut = t => t<.5 ? 2*t*t : -1+(4-2*t)*t;
      const easedProgress = easeInOut(progress);
      
      const newX = startX + (targetX - startX) * easedProgress;
      const newY = startY + (targetY - startY) * easedProgress;
      let newZoom = startZoom;
      
      if (targetZoom !== null) {
        newZoom = startZoom + (targetZoom - startZoom) * easedProgress;
      }
      
      // Update pan position and zoom
      setPan({
        x: newX,
        y: newY
      });
      
      if (targetZoom !== null) {
        setZoom(newZoom);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        saveCanvasState();
      }
    };
    
    animate();
  }, [pan, zoom, saveCanvasState]);

  // Get canvas bounds - useful for minimap
  const getCanvasBounds = useCallback((cards) => {
    if (!cards || cards.length === 0) {
      return { minX: -1000, maxX: 1000, minY: -1000, maxY: 1000 };
    }
    
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    
    cards.forEach(card => {
      // Add card dimensions (approximated)
      const cardWidth = 280;
      const cardHeight = card.type === 'category' ? 120 : 160;
      
      minX = Math.min(minX, card.position.x);
      maxX = Math.max(maxX, card.position.x + cardWidth);
      minY = Math.min(minY, card.position.y);
      maxY = Math.max(maxY, card.position.y + cardHeight);
    });
    
    // Add padding
    const padding = 300;
    return {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding
    };
  }, []);

  const value = {
    zoom,
    pan,
    isDragging,
    isAnimating,
    setIsDragging,
    handleZoom,
    handlePan,
    screenToCanvas,
    canvasToScreen,
    resetView,
    navigateTo,
    getCanvasBounds,
    saveCanvasState
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
};