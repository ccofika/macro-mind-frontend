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
    lastX: 0,
    lastY: 0,
    rafId: null
  });
  
  // Update position with proper canvas transformation
  const updateCardPosition = useCallback((clientX, clientY) => {
    const state = dragStateRef.current;
    
    if (screenToCanvas) {
      // Use screenToCanvas to convert mouse position
      const currentCanvasPos = screenToCanvas({ x: clientX, y: clientY });
      const startCanvasPos = screenToCanvas({ x: state.startMouseX, y: state.startMouseY });
      
      // Calculate delta in canvas coordinates
      const deltaX = currentCanvasPos.x - startCanvasPos.x;
      const deltaY = currentCanvasPos.y - startCanvasPos.y;
      
      // Apply delta to starting position
      const newPosition = {
        x: state.startCardX + deltaX,
        y: state.startCardY + deltaY
      };
      
      // Update both local state and context
      setPosition(newPosition);
      moveCard(id, newPosition);
    } else {
      // Fallback if screenToCanvas is not available
      // Calculate delta in screen coordinates
      const deltaX = clientX - state.startMouseX;
      const deltaY = clientY - state.startMouseY;
      
      // Apply the delta with zoom compensation
      const newPosition = {
        x: state.startCardX + deltaX / zoom,
        y: state.startCardY + deltaY / zoom
      };
      
      // Update both local state and context
      setPosition(newPosition);
      moveCard(id, newPosition);
    }
    
    // Update last position for next frame
    state.lastX = clientX;
    state.lastY = clientY;
  }, [id, zoom, screenToCanvas, moveCard]);
  
  // Optimized mouse move handler using RAF
  const handleMouseMove = useCallback((e) => {
    const state = dragStateRef.current;
    
    if (!state.isDragging) return;
    
    // Cancel previous RAF if exists
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
    }
    
    // Use requestAnimationFrame for smooth updates
    state.rafId = requestAnimationFrame(() => {
      updateCardPosition(e.clientX, e.clientY);
      state.rafId = null;
    });
  }, [updateCardPosition]);
  
  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    const state = dragStateRef.current;
    
    if (state.isDragging) {
      state.isDragging = false;
      setIsDragging(false);
      
      // Cancel any pending RAF
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
      }
      
      // Finalize the move
      finalizeMoveCard();
      
      // Clean up cursor
      document.body.style.cursor = '';
    }
  }, [finalizeMoveCard]);
  
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
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    
    setIsDragging(true);
    
    // Set cursor for entire document
    document.body.style.cursor = 'grabbing';
    
    // Add global event listeners
    const mouseMoveHandler = (e) => handleMouseMove(e);
    const mouseUpHandler = () => handleMouseUp();
    
    // Use capture phase for better event handling
    document.addEventListener('mousemove', mouseMoveHandler, { capture: true });
    document.addEventListener('mouseup', mouseUpHandler, { capture: true });
    
    // Store cleanup function
    const cleanup = () => {
      document.removeEventListener('mousemove', mouseMoveHandler, { capture: true });
      document.removeEventListener('mouseup', mouseUpHandler, { capture: true });
      document.body.style.cursor = '';
    };
    
    // Attach cleanup to mouseup
    const enhancedMouseUp = () => {
      handleMouseUp();
      cleanup();
    };
    
    document.removeEventListener('mouseup', mouseUpHandler, { capture: true });
    document.addEventListener('mouseup', enhancedMouseUp, { capture: true, once: true });
    
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
  
  // Sync position when it changes externally
  const updatePosition = useCallback((newPosition) => {
    setPosition(newPosition);
    
    // Update drag state if currently dragging
    if (dragStateRef.current.isDragging) {
      dragStateRef.current.startCardX = newPosition.x;
      dragStateRef.current.startCardY = newPosition.y;
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const state = dragStateRef.current;
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
      }
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