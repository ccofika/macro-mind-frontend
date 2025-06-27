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
    networkThrottle: 50 // 20 FPS for network updates
  });
  
  // Update card position during drag
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
      const deltaX = clientX - state.startMouseX;
      const deltaY = clientY - state.startMouseY;
      
      // Apply the delta with zoom compensation
      newPosition = {
        x: state.startCardX + deltaX / zoom,
        y: state.startCardY + deltaY / zoom
      };
    }
    
    // Update local position immediately
    setPosition(newPosition);
    
    // Network updates with throttling
    const now = Date.now();
    if (now - state.lastNetworkUpdate >= state.networkThrottle) {
      state.lastNetworkUpdate = now;
      console.log('useDragAndDrop: Moving card', id, 'to position', newPosition);
      moveCard(id, newPosition, true);
    }
  }, [id, zoom, screenToCanvas, moveCard]);
  
  // Mouse move handler
  const handleMouseMove = useCallback((e) => {
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
    
    // ===== SIMPLIFIED SELECTION LOGIC =====
    const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
    console.log('useDragAndDrop: Mouse down on card', id, 'isMultiSelect:', isMultiSelect);
    
    // If multi-selecting, just toggle selection
    if (isMultiSelect) {
      selectCard(id, true);
      return; // Don't start drag on multi-select
    }
    
    // If card is already part of multi-selection, don't change selection
    if (selectedCardIds.length > 1 && selectedCardIds.includes(id)) {
      console.log('useDragAndDrop: Card is part of multi-selection, keeping selection');
      // Don't change selection, just start drag
    } else {
      // Single select this card
      selectCard(id, false);
    }
    
    // ===== START DRAG =====
    const state = dragStateRef.current;
    state.isDragging = true;
    state.startMouseX = e.clientX;
    state.startMouseY = e.clientY;
    state.startCardX = position.x;
    state.startCardY = position.y;
    state.lastNetworkUpdate = 0;
    
    setIsDragging(true);
    
    // Set cursor for entire document
    document.body.style.cursor = 'grabbing';
    
    // Add global event listeners
    const mouseMoveHandler = (e) => {
      e.preventDefault();
      handleMouseMove(e);
    };
    const mouseUpHandler = (e) => {
      e.preventDefault();
      handleMouseUp();
      cleanup();
    };
    
    document.addEventListener('mousemove', mouseMoveHandler, { capture: true, passive: false });
    document.addEventListener('mouseup', mouseUpHandler, { capture: true, passive: false, once: true });
    
    const cleanup = () => {
      document.removeEventListener('mousemove', mouseMoveHandler, { capture: true });
      document.removeEventListener('mouseup', mouseUpHandler, { capture: true });
      document.body.style.cursor = '';
    };
    
  }, [id, position, selectCard, selectedCardIds, handleMouseMove, handleMouseUp]);
  
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
  
  // Update position when it changes externally
  const updatePosition = useCallback((newPosition) => {
    // Only update if not currently dragging locally
    if (!dragStateRef.current.isDragging) {
      setPosition(newPosition);
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
    };
  }, []);
  
  return {
    position,
    isDragging,
    handleMouseDown,
    handleTouchStart,
    updatePosition
  };
};