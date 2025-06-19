import { useState, useCallback, useRef, useEffect } from 'react';
import { useCanvas } from '../context/CanvasContext';
import { useCards } from '../context/CardContext';

export const useDragAndDrop = (id, initialPosition) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  
  const { screenToCanvas, zoom = 1 } = useCanvas();
  const { moveCard, finalizeMoveCard, selectCard, selectedCardIds } = useCards();
  
  // Refs for tracking drag state without re-renders
  const dragStateRef = useRef({
    isDragging: false,
    startMouseX: 0,
    startMouseY: 0,
    startCardX: 0,
    startCardY: 0,
    lastNetworkUpdate: 0,
    networkThrottle: 50 // 20 FPS for network updates (was 100ms, now 50ms)
  });
  
  // Immediate position update without RAF for instant response
  const updateCardPosition = useCallback((clientX, clientY) => {
    const state = dragStateRef.current;
    
    if (!state.isDragging) return;
    
    let newPosition;
    
    if (screenToCanvas) {
      // Use screenToCanvas to convert mouse position
      const currentCanvasPos = screenToCanvas({ x: clientX, y: clientY });
      const startCanvasPos = screenToCanvas({ x: state.startMouseX, y: state.startMouseY });
      
      // Calculate delta in canvas coordinates
      const deltaX = currentCanvasPos.x - startCanvasPos.x;
      const deltaY = currentCanvasPos.y - startCanvasPos.y;
      
      // Apply delta to starting position
      newPosition = {
        x: state.startCardX + deltaX,
        y: state.startCardY + deltaY
      };
    } else {
      // Fallback if screenToCanvas is not available
      // Calculate delta in screen coordinates
      const deltaX = clientX - state.startMouseX;
      const deltaY = clientY - state.startMouseY;
      
      // Apply the delta with zoom compensation
      newPosition = {
        x: state.startCardX + deltaX / zoom,
        y: state.startCardY + deltaY / zoom
      };
    }
    
    // INSTANT local state update - no RAF delay
    setPosition(newPosition);
    
    // Network updates with smarter throttling
    const now = Date.now();
    if (now - state.lastNetworkUpdate >= state.networkThrottle) {
      state.lastNetworkUpdate = now;
      // Only send network updates, don't update local position again
      moveCard(id, newPosition, true);
    }
  }, [id, zoom, screenToCanvas, moveCard]);
  
  // Direct mouse move handler without RAF for instant response
  const handleMouseMove = useCallback((e) => {
    // INSTANT update - no RAF delay
    updateCardPosition(e.clientX, e.clientY);
  }, [updateCardPosition]);
  
  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    const state = dragStateRef.current;
    
    if (state.isDragging) {
      state.isDragging = false;
      setIsDragging(false);
      
      // Finalize the move
      finalizeMoveCard();
      
      // Clean up cursor
      document.body.style.cursor = '';
    }
  }, [id, finalizeMoveCard]);
  
  // Start dragging
  const handleMouseDown = useCallback((e) => {
    // Only handle left click
    if (e.button !== 0) return;
    
    // Prevent dragging when clicking on interactive elements
    const interactiveElements = 'button, input, textarea, .ai-input, .content-copy-button';
    if (e.target.closest(interactiveElements)) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Select the card (support for multi-select with Ctrl/Cmd key)
    selectCard(id, e.ctrlKey || e.metaKey);
    
    // Initialize drag state
    const state = dragStateRef.current;
    state.isDragging = true;
    state.startMouseX = e.clientX;
    state.startMouseY = e.clientY;
    state.startCardX = position.x;
    state.startCardY = position.y;
    state.lastNetworkUpdate = 0; // Reset network throttle
    
    setIsDragging(true);
    
    // Set cursor for entire document
    document.body.style.cursor = 'grabbing';
    
    // Add global event listeners with passive: false for better performance
    const mouseMoveHandler = (e) => {
      e.preventDefault(); // Prevent any default behavior
      handleMouseMove(e);
    };
    const mouseUpHandler = (e) => {
      e.preventDefault();
      handleMouseUp();
      cleanup();
    };
    
    // Use capture phase for better event handling
    document.addEventListener('mousemove', mouseMoveHandler, { capture: true, passive: false });
    document.addEventListener('mouseup', mouseUpHandler, { capture: true, passive: false, once: true });
    
    // Store cleanup function
    const cleanup = () => {
      document.removeEventListener('mousemove', mouseMoveHandler, { capture: true });
      document.removeEventListener('mouseup', mouseUpHandler, { capture: true });
      document.body.style.cursor = '';
    };
    
  }, [id, position, selectCard, handleMouseMove, handleMouseUp]);
  
  // Handle touch events for mobile
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0
    });
    
    handleMouseDown(mouseEvent);
  }, [handleMouseDown]);
  
  // Sync position when it changes externally (from network updates)
  const updatePosition = useCallback((newPosition) => {
    // Only update if not currently dragging locally
    if (!dragStateRef.current.isDragging) {
      setPosition(newPosition);
    }
    // If dragging, ignore external updates to prevent conflicts
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
    };
  }, []);
  
  // Handle multi-select dragging
  useEffect(() => {
    if (isDragging && selectedCardIds && selectedCardIds.length > 1) {
      // If this card is part of a multi-selection, other selected cards should move too
      const isSelected = selectedCardIds.includes(id);
      if (isSelected) {
        // The movement logic is handled in CardContext for all selected cards
        // This ensures synchronized movement
      }
    }
  }, [isDragging, selectedCardIds, id]);
  
  return {
    position,
    isDragging,
    handleMouseDown,
    handleTouchStart,
    updatePosition
  };
};