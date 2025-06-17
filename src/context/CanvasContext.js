import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { canvasApi } from '../services/api';

const CanvasContext = createContext();

export const useCanvas = () => useContext(CanvasContext);

export const CanvasProvider = ({ children }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

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

  // Poboljšana funkcija za zoom - sporiji i precizniji
  const handleZoom = useCallback((delta, point = { x: window.innerWidth / 2, y: window.innerHeight / 2 }) => {
    setZoom(prevZoom => {
      // Smanjujemo koeficijent zumiranja sa 0.1 na 0.05 za sporiji zoom
      const zoomFactor = 0.05; 
      const newZoom = Math.max(0.1, Math.min(5, prevZoom * (1 - delta * zoomFactor)));
      
      // Prilagodimo pan da zumiramo prema poziciji miša
      setPan(prevPan => {
        // Izračunaj relativnu poziciju miša u odnosu na platno
        const mouseXRelative = (point.x - prevPan.x) / prevZoom;
        const mouseYRelative = (point.y - prevPan.y) / prevZoom;
        
        // Izračunaj novu poziciju pana nakon zuma
        return {
          x: point.x - mouseXRelative * newZoom,
          y: point.y - mouseYRelative * newZoom
        };
      });
      
      return newZoom;
    });
  }, []);

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
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    saveCanvasState();
  }, [saveCanvasState]);

  const value = {
    zoom,
    pan,
    isDragging,
    setIsDragging,
    handleZoom,
    handlePan,
    screenToCanvas,
    canvasToScreen,
    resetView,
    saveCanvasState
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
};