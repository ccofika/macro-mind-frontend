import React, { useRef, useEffect, useState, useCallback, useMemo, Suspense, lazy, useContext } from 'react';
import './Canvas.css';
import CardConnection from '../Card/CardConnection';
import ActionBar from '../ActionBar/ActionBar';
import MiniMap from './MiniMap';
import OffscreenPointers from './OffscreenPointers';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import { useCanvas } from '../../context/CanvasContext';
import { useCards } from '../../context/CardContext';
import { useCollaboration } from '../../context/CollaborationContext';
import AuthContext from '../../context/AuthContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useZoomAndPan } from '../../hooks/useZoomAndPan';
import CursorTrail from '../Collaboration/CursorTrail';
import CollaborationPanel from '../Collaboration/CollaborationPanel';
import CardLock from '../Collaboration/CardLock';

// Lazy load card components
const CategoryCard = lazy(() => import('../Card/CategoryCard'));
const AnswerCard = lazy(() => import('../Card/AnswerCard'));

// Constants
const BUFFER_SIZE = 700; // Buffer for card visibility
const RENDER_THROTTLE = 16; // ~60fps
const ZOOM_RENDER_DELAY = 150; // ms to delay full render during zooming

// Placeholder component for cards during zooming
const CardPlaceholder = ({ position, type }) => {
  const style = {
    position: 'absolute',
    width: '280px',
    height: type === 'category' ? '120px' : '160px',
    transform: `translate(${position.x}px, ${position.y}px)`,
    background: type === 'category' ? 'rgba(74, 158, 255, 0.2)' : 'rgba(255, 158, 74, 0.2)',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };
  
  return <div className="card-placeholder" style={style} />;
};

const Canvas = () => {
  const canvasRef = useRef(null);
  const connectLineRef = useRef(null);
  const renderTimerRef = useRef(null);
  const zoomTimerRef = useRef(null);
  const { zoom, pan, canvasToScreen, screenToCanvas, handleZoom, handlePan, setIsDragging, resetView } = useCanvas();
  const { 
    cards, 
    connections, 
    selectedCardIds, 
    clearSelection, 
    createCategoryCard, 
    connectCards,
    setSelectedCardIds,
    addCard,
    moveCard,
    finalizeMoveCard,
    deleteSelectedCards,
    getCardById,
    setCurrentSpace,
    currentSpaceId
  } = useCards();
  
  const { 
    isConnected, 
    updateCursorPosition, 
    isCardLockedByMe, 
    isCardLockedByOthers,
    selectCard: collaborationSelectCard,
    deselectCard: collaborationDeselectCard,
    clearAllSelections: collaborationClearAllSelections,
    isCardSelectedByMe,
    isCardSelectedByOthers,
    selectedCards,
    currentSpace,
    registerCardContextSync
  } = useCollaboration();
  
  const { currentUser } = useContext(AuthContext);
  
  const [connectMode, setConnectMode] = useState(false);
  const [connectSource, setConnectSource] = useState(null);
  const [connectTarget, setConnectTarget] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [relatedCardIds, setRelatedCardIds] = useState(new Set());
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [isHighPerformanceMode, setIsHighPerformanceMode] = useState(false);
  const [showCollaborationUI, setShowCollaborationUI] = useState(true);
  
  // Panning state - improved implementation
  const [isPanning, setIsPanning] = useState(false);
  const panningRef = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    animationFrame: null
  });
  
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showOffscreenPointers, setShowOffscreenPointers] = useState(true);
  
  // Setup keyboard shortcuts
  useKeyboardShortcuts(canvasRef);
  
  // Setup auto-save functionality
  useAutoSave();

  // Initialize drag and drop functionality
  const dragAndDropHandlers = useDragAndDrop({
    canvasRef,
    scale: zoom,
    position: pan,
    cards,
    selectedCardIds,
    setSelectedCardIds,
    moveCard,
    finalizeMoveCard,
    setIsMoving: setIsDragging,
    isCardLocked: isCardLockedByOthers // Prevent moving cards locked by others
  });
  
  // Initialize zoom and pan functionality
  const zoomHandlers = useZoomAndPan(canvasRef);

  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'c') {
        setConnectMode(prev => !prev);
      }
      
      // Toggle high-performance mode with 'h' key
      if (e.key === 'h') {
        setIsHighPerformanceMode(prev => !prev);
      }
      
      // Toggle minimap with 'm' key
      if (e.key === 'm') {
        setShowMiniMap(prev => !prev);
      }
      
      // Toggle offscreen pointers with 'p' key
      if (e.key === 'p') {
        setShowOffscreenPointers(prev => !prev);
      }
      
      // Toggle collaboration UI with 'u' key
      if (e.key === 'u') {
        setShowCollaborationUI(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset connection state when toggling connect mode
  useEffect(() => {
    if (!connectMode && connectSource) {
      setConnectSource(null);
      setConnectTarget(null);
    }
  }, [connectMode, connectSource]);
  
  // Enhanced zoom handling with performance optimizations
  const handleZoomWithPerformance = useCallback((delta, point) => {
    // Enter zooming state
    setIsZooming(true);
    
    // Apply zoom
    handleZoom(delta, point);
    
    // Clear any existing zoom timer
    if (zoomTimerRef.current) {
      clearTimeout(zoomTimerRef.current);
    }
    
    // Set a timer to exit zooming state after a delay
    zoomTimerRef.current = setTimeout(() => {
      setIsZooming(false);
      zoomTimerRef.current = null;
      // Force update to ensure full render after zooming
      setForceUpdate(prev => prev + 1);
    }, ZOOM_RENDER_DELAY);
    
    // Throttle rendering updates
    throttleRender();
  }, [handleZoom]);

  // Enhanced panning implementation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Enhanced wheel handling for smoother zooming centered on cursor
    const handleWheel = (e) => {
      e.preventDefault();
      
      // Normalize wheel delta across browsers
      let delta;
      
      // Handle different delta modes
      if (e.deltaMode === 1) { // DOM_DELTA_LINE
        delta = e.deltaY * 0.05;
      } else if (e.deltaMode === 2) { // DOM_DELTA_PAGE
        delta = e.deltaY * 0.002;
      } else { // DOM_DELTA_PIXEL (most common)
        delta = e.deltaY * 0.001;
      }
      
      // Limit maximum delta to prevent jumpy zooming
      delta = Math.max(-0.5, Math.min(0.5, delta));
      
      // Get exact cursor position in client coordinates
      const mousePos = {
        x: e.clientX,
        y: e.clientY
      };
      
      // Apply zoom centered on cursor position with performance optimizations
      handleZoomWithPerformance(delta, mousePos);
    };

    // Handle mouse down for panning
    const handleMouseDown = (e) => {
      // Only handle left mouse button
      if (e.button !== 0) return;
      
      // Check if the click is on the canvas background or grid
      const isCanvasBackground = e.target === canvas || 
                                e.target.classList.contains('grid-background') ||
                                e.target.classList.contains('canvas');
      
      // Don't pan if clicking on cards or interactive elements
      const isInteractiveElement = e.target.closest('.card') || 
                                  e.target.closest('.action-bar') ||
                                  e.target.closest('.zoom-controls') ||
                                  e.target.closest('.connect-mode-indicator') ||
                                  e.target.closest('.spaces-sidebar') ||
                                  e.target.closest('.active-users') ||
                                  e.target.closest('button') ||
                                  e.target.closest('input') ||
                                  e.target.closest('svg');
      
      if (isCanvasBackground && !isInteractiveElement) {
        e.preventDefault();
        e.stopPropagation();
        
        // Start panning
        setIsPanning(true);
        panningRef.current.isPanning = true;
        panningRef.current.startX = e.clientX;
        panningRef.current.startY = e.clientY;
        panningRef.current.lastX = e.clientX;
        panningRef.current.lastY = e.clientY;
        
        // Update cursor
        canvas.style.cursor = 'grabbing';
        setIsDragging(true);
      }
    };

    // Handle mouse move for panning
    const handleMouseMove = (e) => {
      // Send cursor position to collaboration service
      if (isConnected && screenToCanvas) {
        const canvasPos = screenToCanvas({ x: e.clientX, y: e.clientY });
        updateCursorPosition(canvasPos.x, canvasPos.y);
      }
      
      if (!panningRef.current.isPanning) return;
      
      e.preventDefault();
      
      // Cancel previous animation frame if exists
      if (panningRef.current.animationFrame) {
        cancelAnimationFrame(panningRef.current.animationFrame);
      }
      
      // Use requestAnimationFrame for smooth updates
      panningRef.current.animationFrame = requestAnimationFrame(() => {
        const dx = e.clientX - panningRef.current.lastX;
        const dy = e.clientY - panningRef.current.lastY;
        
        // Apply panning
        handlePan(dx, dy);
        
        // Update last position
        panningRef.current.lastX = e.clientX;
        panningRef.current.lastY = e.clientY;
        
        // Throttle rendering updates
        throttleRender();
      });
    };

    // Handle mouse up to end panning
    const handleMouseUp = (e) => {
      if (panningRef.current.isPanning) {
        setIsPanning(false);
        panningRef.current.isPanning = false;
        setIsDragging(false);
        
        // Reset cursor
        canvas.style.cursor = 'grab';
        
        // Cancel animation frame if exists
        if (panningRef.current.animationFrame) {
          cancelAnimationFrame(panningRef.current.animationFrame);
          panningRef.current.animationFrame = null;
        }
        
        // Force one final render
        setForceUpdate(prev => prev + 1);
      }
    };

    // Handle mouse leave to end panning
    const handleMouseLeave = () => {
      if (panningRef.current.isPanning) {
        handleMouseUp();
      }
    };

    // Add event listeners
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      
      // Clean up animation frame if exists
      if (panningRef.current.animationFrame) {
        cancelAnimationFrame(panningRef.current.animationFrame);
      }
      
      // Clear any pending render timer
      if (renderTimerRef.current) {
        clearTimeout(renderTimerRef.current);
      }
      
      // Clear zoom timer
      if (zoomTimerRef.current) {
        clearTimeout(zoomTimerRef.current);
      }
    };
  }, [handleZoom, handlePan, setIsDragging, handleZoomWithPerformance, isConnected, updateCursorPosition, screenToCanvas]);

  // Throttle render updates for better performance
  const throttleRender = useCallback(() => {
    if (renderTimerRef.current) {
      return; // Already pending update
    }
    
    renderTimerRef.current = setTimeout(() => {
      setForceUpdate(prev => prev + 1);
      renderTimerRef.current = null;
    }, RENDER_THROTTLE);
  }, []);

  // Click on empty canvas to clear selection
  const handleCanvasClick = useCallback((e) => {
    // Only handle clicks on canvas background
    const isCanvasBackground = e.target === canvasRef.current || 
                              e.target.classList.contains('grid-background') ||
                              e.target.classList.contains('canvas');
    
    // Don't handle clicks on interactive elements
    const isInteractiveElement = e.target.closest('.card') || 
                                e.target.closest('.action-bar') ||
                                e.target.closest('.zoom-controls') ||
                                e.target.closest('.connect-mode-indicator') ||
                                e.target.closest('.spaces-sidebar') ||
                                e.target.closest('.active-users') ||
                                e.target.closest('button') ||
                                e.target.closest('input') ||
                                e.target.closest('svg');
    
    if (isCanvasBackground && !isInteractiveElement) {
      clearSelection();
      
      // Double click on empty canvas creates a new category card
      if (e.detail === 2) {
        createCategoryCard("New Category", { x: e.clientX, y: e.clientY });
      }
      
      // Exit connect mode if clicked on empty space
      if (connectMode) {
        setConnectSource(null);
        setConnectTarget(null);
      }
    }
  }, [clearSelection, createCategoryCard, connectMode]);

  // Handle card hover
  const handleCardHover = useCallback((cardId) => {
    // Skip hover effects during zooming for performance
    if (isZooming) return;
    
    setHoveredCardId(cardId);
    
    // Find related cards through connections
    const related = new Set();
    connections.forEach(conn => {
      if (conn.sourceId === cardId) {
        related.add(conn.targetId);
      } else if (conn.targetId === cardId) {
        related.add(conn.sourceId);
      }
    });
    
    setRelatedCardIds(related);
  }, [connections, isZooming]);

  // Clear hover state
  const handleCardLeave = useCallback(() => {
    setHoveredCardId(null);
    setRelatedCardIds(new Set());
  }, []);

  // Handle card selection with collaboration
  const handleCardSelect = useCallback((cardId, isMultiSelect) => {
    console.log('Canvas: handleCardSelect called for:', cardId, 'isMultiSelect:', isMultiSelect);
    
    // Check if card is locked by another user
    if (isCardLockedByOthers(cardId)) {
      console.log('Canvas: Card locked by others, cannot select');
      return; // Cannot select card locked by others
    }
    
    // Use collaboration system for selection (single select only for now)
    if (!isMultiSelect && collaborationSelectCard) {
      console.log('Canvas: Selecting card via collaboration');
      collaborationSelectCard(cardId);
    }
    
    // Update local selection state
    setSelectedCardIds(prev => {
      if (isMultiSelect) {
        return prev.includes(cardId) 
          ? prev.filter(id => id !== cardId) 
          : [...prev, cardId];
      } else {
        return [cardId];
      }
    });
  }, [isCardLockedByOthers, collaborationSelectCard, setSelectedCardIds]);

  // Handle card deselection with collaboration
  const handleCardDeselect = useCallback((cardId) => {
    console.log('Canvas: handleCardDeselect called for:', cardId);
    
    // Use collaboration system for deselection
    if (isCardSelectedByMe(cardId) && collaborationDeselectCard) {
      console.log('Canvas: Deselecting card via collaboration');
      collaborationDeselectCard(cardId);
    }
    
    // Update local selection state
    setSelectedCardIds(prev => prev.filter(id => id !== cardId));
  }, [setSelectedCardIds, isCardSelectedByMe, collaborationDeselectCard]);

  // Calculate visible area for card virtualization - optimized
  const isCardVisible = useCallback((cardPosition) => {
    if (!canvasToScreen) return true;
    
    const screenPosition = canvasToScreen(cardPosition);
    
    return (
      screenPosition.x + BUFFER_SIZE >= 0 &&
      screenPosition.x - BUFFER_SIZE <= window.innerWidth &&
      screenPosition.y + BUFFER_SIZE >= 0 &&
      screenPosition.y - BUFFER_SIZE <= window.innerHeight
    );
  }, [canvasToScreen]);

  // Memoized visible cards calculation with chunking for large datasets
  const visibleCards = useMemo(() => {
    // If we have a lot of cards, use a more efficient filtering approach
    if (cards.length > 100) {
      // Create a spatial index for faster lookups (simple quadrant-based approach)
      const quadrants = {
        topLeft: [],
        topRight: [],
        bottomLeft: [],
        bottomRight: []
      };
      
      // Determine center of screen in canvas coordinates
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      // Assign cards to quadrants
      cards.forEach(card => {
        const screenPos = canvasToScreen ? canvasToScreen(card.position) : card.position;
        if (screenPos.x < centerX) {
          if (screenPos.y < centerY) {
            quadrants.topLeft.push(card);
          } else {
            quadrants.bottomLeft.push(card);
          }
        } else {
          if (screenPos.y < centerY) {
            quadrants.topRight.push(card);
          } else {
            quadrants.bottomRight.push(card);
          }
        }
      });
      
      // Only check visibility for cards in potentially visible quadrants
      const visibleQuadrants = [];
      
      if (centerX - BUFFER_SIZE <= centerX) visibleQuadrants.push(quadrants.topLeft, quadrants.bottomLeft);
      if (centerX + BUFFER_SIZE >= centerX) visibleQuadrants.push(quadrants.topRight, quadrants.bottomRight);
      
      // Flatten and filter
      return visibleQuadrants.flat().filter(card => isCardVisible(card.position));
    }
    
    // For smaller datasets, just filter directly
    return cards.filter(card => isCardVisible(card.position));
  }, [cards, isCardVisible, canvasToScreen, forceUpdate]);

  // Memoized visible connections calculation with set-based optimization
  const visibleConnections = useMemo(() => {
    // During zooming, limit connections for performance
    if (isZooming && connections.length > 50) {
      return [];
    }
    
    // Create a set of visible card IDs for faster lookup
    const visibleCardIds = new Set(visibleCards.map(card => card.id));
    
    return connections.filter(connection => {
      return visibleCardIds.has(connection.sourceId) || visibleCardIds.has(connection.targetId);
    });
  }, [connections, visibleCards, isZooming]);

  // Calculate transform style for canvas elements - memoized
  const transformStyle = useMemo(() => {
    return `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
  }, [zoom, pan.x, pan.y]);

  // Unified connection handler for cards - moved here to fix hoisting issue
  const handleCardConnection = useCallback((cardId) => {
    console.log('Canvas: handleCardConnection called', { cardId, connectMode, connectSource });
    
    if (!connectMode) {
      console.log('Canvas: Not in connect mode, ignoring connection attempt');
      return;
    }
    
    if (!connectSource) {
      // No source selected yet, this card becomes the source
      console.log('Canvas: No source selected, setting as source:', cardId);
      setConnectSource(cardId);
    } else if (connectSource !== cardId) {
      // Source already selected and this is a different card, create connection
      console.log('Canvas: Source already selected, creating connection to:', cardId);
      setConnectTarget(cardId);
      connectCards(connectSource, cardId);
      setConnectSource(null);
      setConnectTarget(null);
    } else {
      // Clicking the same card that is already source - deselect it
      console.log('Canvas: Clicking same source card, deselecting');
      setConnectSource(null);
    }
  }, [connectMode, connectSource, connectCards]);

  // Memoized grid rendering
  const renderGrid = useMemo(() => {
    // Skip detailed grid during zooming for performance
    if (isZooming && isHighPerformanceMode) {
      return null;
    }
    
    const gridSize = 50;
    const offsetX = (pan.x % gridSize);
    const offsetY = (pan.y % gridSize);
    
    return (
      <div 
        className="grid-background" 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundPosition: `${offsetX}px ${offsetY}px`,
          opacity: 0.3
        }}
      />
    );
  }, [pan.x, pan.y, isZooming, isHighPerformanceMode]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const center = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
    handleZoomWithPerformance(-0.3, center);
  }, [handleZoomWithPerformance]);

  const handleZoomOut = useCallback(() => {
    const center = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
    handleZoomWithPerformance(0.3, center);
  }, [handleZoomWithPerformance]);

  const handleResetZoom = useCallback(() => {
    resetView();
    throttleRender();
  }, [resetView, throttleRender]);

  // Render connection lines between cards - memoized
  const renderedConnections = useMemo(() => {
    // Skip connections during zooming in high performance mode
    if (isZooming && isHighPerformanceMode) {
      return null;
    }
    
    return visibleConnections.map((connection) => {
      const sourceCard = getCardById(connection.sourceId);
      const targetCard = getCardById(connection.targetId);
      
      if (!sourceCard || !targetCard) {
        return null;
      }
      
      // Check if this connection involves hovered card
      const isHighlighted = 
        hoveredCardId && 
        (connection.sourceId === hoveredCardId || connection.targetId === hoveredCardId);
      
      return (
        <CardConnection
          key={connection.id}
          sourcePosition={sourceCard.position}
          targetPosition={targetCard.position}
          isHighlighted={isHighlighted}
        />
      );
    });
  }, [visibleConnections, getCardById, hoveredCardId, isZooming, isHighPerformanceMode]);
  
  // Render cards - memoized
  const renderedCards = useMemo(() => {
    if (visibleCards.length === 0) {
      return null;
    }
    
    // Use simplified placeholders during zooming for performance
    if (isZooming && isHighPerformanceMode) {
      return visibleCards.map((card) => (
        <CardPlaceholder 
          key={card.id} 
          position={card.position} 
          type={card.type} 
        />
      ));
    }
    
    return visibleCards.map((card) => {
      const isSelected = selectedCardIds.includes(card.id);
      const isHovered = card.id === hoveredCardId;
      const isRelated = relatedCardIds.has(card.id);
      
      const cardProps = {
        card,
        isSelected,
        isHovered,
        isRelated,
        connectMode,
        onConnect: handleCardConnection,
        onHover: handleCardHover,
        onLeave: handleCardLeave,
        onSelect: handleCardSelect,
        onDeselect: handleCardDeselect,
        isLocked: isCardLockedByOthers(card.id) || isCardLockedByMe(card.id)
      };
      
      const CardComponent = card.type === 'category' ? CategoryCard : AnswerCard;
      
      return (
        <Suspense key={card.id} fallback={<CardPlaceholder position={card.position} type={card.type} />}>
          <CardComponent {...cardProps} />
          <CardLock 
            cardId={card.id} 
            cardPosition={card.position}
            cardSize={{ 
              width: 280, 
              height: card.type === 'category' ? 120 : 160 
            }}
          />
        </Suspense>
      );
    });
  }, [
    visibleCards, 
    selectedCardIds, 
    hoveredCardId, 
    relatedCardIds, 
    connectMode, 
    handleCardConnection,
    handleCardHover, 
    handleCardLeave,
    handleCardSelect,
    handleCardDeselect,
    isZooming,
    isHighPerformanceMode,
    isCardLockedByOthers,
    isCardLockedByMe
  ]);

  // Performance stats
  const stats = useMemo(() => {
    return {
      totalCards: cards.length,
      visibleCards: visibleCards.length,
      totalConnections: connections.length,
      visibleConnections: visibleConnections.length,
      highPerformanceMode: isHighPerformanceMode ? 'ON' : 'OFF',
      zoomMode: isZooming ? 'ZOOMING' : 'NORMAL'
    };
  }, [
    cards.length, 
    visibleCards.length, 
    connections.length, 
    visibleConnections.length,
    isHighPerformanceMode,
    isZooming
  ]);

  // Register sync callback with CollaborationContext
  useEffect(() => {
    console.log('Canvas: Registering sync callback', { registerCardContextSync: !!registerCardContextSync, setCurrentSpace: !!setCurrentSpace });
    if (registerCardContextSync && setCurrentSpace) {
      console.log('Canvas: About to register callback function:', setCurrentSpace);
      registerCardContextSync(setCurrentSpace);
      console.log('Canvas: Sync callback registered successfully');
    }
  }, [registerCardContextSync]);

  // Debug current space states
  useEffect(() => {
    console.log('Canvas: Space states updated', { 
      currentSpaceId, 
      currentSpace: currentSpace?.name || 'none',
      showMessage: !currentSpaceId && showCollaborationUI 
    });
  }, [currentSpaceId, currentSpace, showCollaborationUI]);

  return (
    <div 
      className={`canvas-container ${connectMode ? 'connect-mode' : ''} ${isZooming ? 'zooming' : ''}`}
      ref={canvasRef}
      onClick={handleCanvasClick}
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at center, #0F0F11 0%, #0A0A0C 100%)',
        cursor: connectMode ? 'crosshair' : isPanning ? 'grabbing' : 'grab'
      }}
    >
      {/* Grid background */}
      {renderGrid}
      
      <div className={`canvas ${isPanning ? 'moving' : ''}`}>
        {/* No Space Selected Message */}
        {!currentSpaceId && showCollaborationUI && (
          <div className="no-space-message">
            <div className="no-space-content">
              <h3>🌐 No Space Selected</h3>
              <p>Select a space from the sidebar or create a new one to start collaborating.</p>
              <p>Cards are organized by spaces to keep your work separated.</p>
            </div>
          </div>
        )}
        
        {/* Card connections */}
        <div className="connections-container" style={{ transform: transformStyle }}>
          {renderedConnections}
        </div>
        
        {/* Cards */}
        <div className="cards-container" style={{ transform: transformStyle }}>
          {renderedCards}
        </div>
        
        {/* Action Bar */}
        <ActionBar addCard={addCard} setConnectMode={setConnectMode} />
        
        {/* Connect Mode Indicator */}
        {connectMode && (
          <div className="connect-mode-indicator">
            <span className="connect-icon">🔗</span>
            <span>Connect Mode</span>
            <button className="connect-exit-button" onClick={() => setConnectMode(false)}>Exit</button>
          </div>
        )}
        
        {/* Zoom controls */}
        <div className="zoom-controls">
          <button className="zoom-button" onClick={handleZoomIn} title="Zoom In">+</button>
          <div className="zoom-level">{Math.round(zoom * 100)}%</div>
          <button className="zoom-button" onClick={handleZoomOut} title="Zoom Out">−</button>
          <button className="zoom-button" onClick={handleResetZoom} title="Reset Zoom">⟲</button>
          <button 
            className={`zoom-button ${isHighPerformanceMode ? 'active' : ''}`} 
            onClick={() => setIsHighPerformanceMode(prev => !prev)} 
            title="Toggle High Performance Mode"
          >
            {isHighPerformanceMode ? '⚡' : '⚙️'}
          </button>
          <button 
            className={`zoom-button ${showMiniMap ? 'active' : ''}`} 
            onClick={() => setShowMiniMap(prev => !prev)} 
            title="Toggle Mini-Map"
          >
            🗺️
          </button>
          <button 
            className={`zoom-button ${showOffscreenPointers ? 'active' : ''}`} 
            onClick={() => setShowOffscreenPointers(prev => !prev)} 
            title="Toggle Offscreen Pointers"
          >
            📍
          </button>
          <button 
            className={`zoom-button ${showCollaborationUI ? 'active' : ''}`} 
            onClick={() => setShowCollaborationUI(prev => !prev)} 
            title="Toggle Collaboration UI"
          >
            👥
          </button>
        </div>
        
        {/* Connection line while connecting */}
        {connectMode && connectSource && (
          <svg 
            className="connect-line" 
            ref={connectLineRef}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            <line 
              x1="0" 
              y1="0" 
              x2="0" 
              y2="0" 
              style={{ 
                stroke: 'var(--accent-color)',
                strokeWidth: 2,
                strokeDasharray: '5,5' 
              }} 
            />
          </svg>
        )}
        
        {/* Mini-map */}
        {showMiniMap && <MiniMap />}
        
        {/* Offscreen Pointers */}
        {showOffscreenPointers && <OffscreenPointers />}
        
        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcutsHelp />
        
        {/* Collaboration Panel - New Auto-Hide System */}
        {showCollaborationUI && <CollaborationPanel />}
        
        {/* Cursor Trails */}
        {showCollaborationUI && <CursorTrail />}
      </div>
    </div>
  );
};

export default Canvas;