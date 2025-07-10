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
import { isInputFieldActive } from '../../utils/keyboardUtils';
import CursorTrail from '../Collaboration/CursorTrail';
import CollaborationPanel from '../Collaboration/CollaborationPanel';
import CardLock from '../Collaboration/CardLock';

// Lazy load card components
const CategoryCard = lazy(() => import('../Card/CategoryCard'));
const AnswerCard = lazy(() => import('../Card/AnswerCard'));
const LabelCard = lazy(() => import('../Card/LabelCard'));

// Constants
const BUFFER_SIZE = 700; // Buffer for card visibility
const RENDER_THROTTLE = 16; // ~60fps

// Placeholder component for cards during zooming
const CardPlaceholder = ({ position, type }) => {
  let width = '280px';
  let height = '160px';
  let background = 'rgba(255, 158, 74, 0.2)';
  
  if (type === 'category') {
    height = '120px';
    background = 'rgba(74, 158, 255, 0.2)';
  } else if (type === 'label') {
    width = '120px';
    height = '40px';
    background = 'rgba(139, 69, 255, 0.2)';
  }
  
  const style = {
    position: 'absolute',
    width,
    height,
    transform: `translate(${position.x}px, ${position.y}px)`,
    background,
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
    currentSpaceId,
    connectMode,
    setConnectMode,
    selectCard,
    copySelectedCards,
    pasteCards,
    deleteAllConnectionsForCard
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
  
  // Connect mode state
  const [connectSource, setConnectSource] = useState(null);
  const [connectTarget, setConnectTarget] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [relatedCardIds, setRelatedCardIds] = useState(new Set());
  const [selectedCardForDeletion, setSelectedCardForDeletion] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [isHighPerformanceMode, setIsHighPerformanceMode] = useState(false);
  const [showCollaborationUI, setShowCollaborationUI] = useState(true);
  
  // Panning state
  const [isPanning, setIsPanning] = useState(false);
  const panStateRef = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0
  });
  
  // ===== NEW DRAG SELECTION STATE =====
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [dragSelectionRect, setDragSelectionRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const dragSelectionRef = useRef({
    isSelecting: false,
    startScreenX: 0,
    startScreenY: 0,
    startCanvasX: 0,
    startCanvasY: 0
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

  // ===== KEYBOARD SHORTCUTS =====
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip shortcuts if any input field is active
      const eventFromInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) ||
                           e.target.isContentEditable ||
                           e.target.contentEditable === 'true' ||
                           e.target.classList.contains('search-input') ||
                           e.target.classList.contains('ai-input') ||
                           e.target.classList.contains('text-input') ||
                           e.target.classList.contains('card-title-input') ||
                           e.target.classList.contains('content-textarea') ||
                           e.target.closest('.search-input-container') ||
                           e.target.closest('.ai-input-container') ||
                           e.target.closest('.ai-chat-input') ||
                           e.target.closest('.link-editor') ||
                           e.target.closest('.collaboration-panel input') ||
                           e.target.closest('.collaboration-panel textarea') ||
                           e.target.closest('.edit-space-form') ||
                           e.target.closest('.create-space-form') ||
                           e.target.closest('.form-group') ||
                           e.target.closest('.navbar-dropdown-content input');
      
      if (isInputFieldActive() || eventFromInput) {
        return;
      }
      
      if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
        setConnectMode(prev => {
          if (prev) {
            // Exiting connect mode, clear selection for deletion
            setSelectedCardForDeletion(null);
          }
          return !prev;
        });
      }
      
      // Escape key - context-sensitive
      if (e.key === 'Escape') {
        if (connectMode) {
          setConnectMode(false);
          setConnectSource(null);
          setConnectTarget(null);
          setSelectedCardForDeletion(null);
        } else if (selectedCardIds.length > 0) {
          // Clear selection if cards are selected
          clearSelection();
        }
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
      
      // Delete selected cards with Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCardIds.length > 0) {
        e.preventDefault();
        deleteSelectedCards();
      }
      
      // Copy selected cards with Ctrl+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedCardIds.length > 0) {
        e.preventDefault();
        copySelectedCards();
      }
      
      // Paste cards with Ctrl+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteCards();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [connectMode, selectedCardIds, clearSelection, deleteSelectedCards, setConnectMode]);

  // ===== MOUSE EVENT HANDLERS =====
  const handleCanvasMouseDown = useCallback((e) => {
    if (e.button !== 0) return; // Only left mouse button
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if click is on canvas background
    const isCanvasBackground = e.target === canvas || 
                              e.target.classList.contains('grid-background') ||
                              e.target.classList.contains('canvas') ||
                              e.target.classList.contains('canvas-container');
    
    // Don't handle if clicking on interactive elements
    const isInteractiveElement = e.target.closest('.card') || 
                                e.target.closest('.action-bar') ||
                                e.target.closest('.zoom-controls') ||
                                e.target.closest('.connect-mode-indicator') ||
                                e.target.closest('.spaces-sidebar') ||
                                e.target.closest('.active-users') ||
                                e.target.closest('button') ||
                                e.target.closest('input') ||
                                e.target.closest('svg');
    
    if (!isCanvasBackground || isInteractiveElement) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (e.shiftKey && screenToCanvas) {
      // ===== START DRAG SELECTION =====
      console.log('Canvas: Starting drag selection');
      
      const canvasPos = screenToCanvas({ x: e.clientX, y: e.clientY });
      
      setIsDragSelecting(true);
      dragSelectionRef.current = {
        isSelecting: true,
        startScreenX: e.clientX,
        startScreenY: e.clientY,
        startCanvasX: canvasPos.x,
        startCanvasY: canvasPos.y
      };
      
      setDragSelectionRect({
        x: canvasPos.x,
        y: canvasPos.y,
        width: 0,
        height: 0
      });
      
      canvas.style.cursor = 'crosshair';
    } else {
      // ===== START PANNING =====
      setIsPanning(true);
      panStateRef.current = {
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY
      };
      
      canvas.style.cursor = 'grabbing';
      setIsDragging(true);
    }
  }, [screenToCanvas, setIsDragging]);

  const handleCanvasMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Send cursor position to collaboration service
    if (isConnected && screenToCanvas) {
      const canvasPos = screenToCanvas({ x: e.clientX, y: e.clientY });
      updateCursorPosition(canvasPos.x, canvasPos.y);
    }
    
    // ===== HANDLE DRAG SELECTION =====
    if (dragSelectionRef.current.isSelecting && screenToCanvas) {
      e.preventDefault();
      
      const currentCanvasPos = screenToCanvas({ x: e.clientX, y: e.clientY });
      const { startCanvasX, startCanvasY } = dragSelectionRef.current;
      
      const newRect = {
        x: startCanvasX,
        y: startCanvasY,
        width: currentCanvasPos.x - startCanvasX,
        height: currentCanvasPos.y - startCanvasY
      };
      
      setDragSelectionRect(newRect);
      console.log('Canvas: Updating drag selection', newRect);
      return;
    }
    
    // ===== HANDLE PANNING =====
    if (panStateRef.current.isPanning) {
      e.preventDefault();
      
      const dx = e.clientX - panStateRef.current.lastX;
      const dy = e.clientY - panStateRef.current.lastY;
      
      handlePan(dx, dy);
      
      panStateRef.current.lastX = e.clientX;
      panStateRef.current.lastY = e.clientY;
    }
  }, [screenToCanvas, isConnected, updateCursorPosition, handlePan]);

  const handleCanvasMouseUp = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // ===== END DRAG SELECTION =====
    if (dragSelectionRef.current.isSelecting) {
      console.log('Canvas: Ending drag selection');
      
      setIsDragSelecting(false);
      dragSelectionRef.current.isSelecting = false;
      
      // Select cards within rectangle if it's large enough
      const rect = dragSelectionRect;
      if (Math.abs(rect.width) > 10 || Math.abs(rect.height) > 10) {
        const cardsInRect = cards.filter(card => {
          // Skip locked cards
          if (isCardLockedByOthers(card.id)) return false;
          
          // Card dimensions (approximate)
          const cardWidth = 320;
          const cardHeight = 160;
          
          const cardLeft = card.position.x;
          const cardTop = card.position.y;
          const cardRight = card.position.x + cardWidth;
          const cardBottom = card.position.y + cardHeight;
          
          const rectLeft = Math.min(rect.x, rect.x + rect.width);
          const rectTop = Math.min(rect.y, rect.y + rect.height);
          const rectRight = Math.max(rect.x, rect.x + rect.width);
          const rectBottom = Math.max(rect.y, rect.y + rect.height);
          
          // Check overlap
          return !(cardRight < rectLeft || cardLeft > rectRight || 
                   cardBottom < rectTop || cardTop > rectBottom);
        });
        
        const selectedIds = cardsInRect.map(card => card.id);
        console.log('Canvas: Selected cards:', selectedIds);
        setSelectedCardIds(selectedIds);
      }
      
      // Reset
      setDragSelectionRect({ x: 0, y: 0, width: 0, height: 0 });
      canvas.style.cursor = 'grab';
      return;
    }
    
    // ===== END PANNING =====
    if (panStateRef.current.isPanning) {
      setIsPanning(false);
      panStateRef.current.isPanning = false;
      setIsDragging(false);
      canvas.style.cursor = 'grab';
    }
  }, [dragSelectionRect, cards, isCardLockedByOthers, setSelectedCardIds, setIsDragging]);

  // ===== EVENT LISTENERS =====
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    document.addEventListener('mousemove', handleCanvasMouseMove);
    document.addEventListener('mouseup', handleCanvasMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleCanvasMouseDown);
      document.removeEventListener('mousemove', handleCanvasMouseMove);
      document.removeEventListener('mouseup', handleCanvasMouseUp);
    };
  }, [handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp]);

  // ===== COLLABORATION SYNC =====
  // Register sync callback with CollaborationContext
  useEffect(() => {
    console.log('Canvas: Registering sync callback', { 
      registerCardContextSync: !!registerCardContextSync, 
      setCurrentSpace: !!setCurrentSpace 
    });
    
    if (registerCardContextSync && setCurrentSpace) {
      console.log('Canvas: About to register callback function:', setCurrentSpace);
      registerCardContextSync(setCurrentSpace);
      console.log('Canvas: Sync callback registered successfully');
    }
  }, [registerCardContextSync, setCurrentSpace]);

  // Debug current space states
  useEffect(() => {
    console.log('Canvas: Space states updated', { 
      currentSpaceId, 
      currentSpace: currentSpace?.name || 'none',
      showMessage: !currentSpaceId && showCollaborationUI 
    });
  }, [currentSpaceId, currentSpace, showCollaborationUI]);

  // ===== RENDERING OPTIMIZATIONS =====
  
  // Throttle render updates
  const throttleRender = useCallback(() => {
    if (renderTimerRef.current) return;
    renderTimerRef.current = setTimeout(() => {
      setForceUpdate(prev => prev + 1);
      renderTimerRef.current = null;
    }, RENDER_THROTTLE);
  }, []);

  // Handle zoom changes
  useEffect(() => {
    setIsZooming(true);
    if (zoomTimerRef.current) {
      clearTimeout(zoomTimerRef.current);
    }
    zoomTimerRef.current = setTimeout(() => {
      setIsZooming(false);
    }, 150);
  }, [zoom]);

  // Calculate transform style
  const transformStyle = useMemo(() => {
    return `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
  }, [pan.x, pan.y, zoom]);

  // Get visible cards for performance
  const visibleCards = useMemo(() => {
    if (isHighPerformanceMode && (isZooming || isPanning)) {
      return cards.slice(0, Math.min(20, cards.length));
    }
    
    if (!canvasToScreen) return cards;
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return cards;
    
    return cards.filter(card => {
      const screenPos = canvasToScreen(card.position);
      return screenPos.x > -BUFFER_SIZE && 
             screenPos.x < canvasRect.width + BUFFER_SIZE &&
             screenPos.y > -BUFFER_SIZE && 
             screenPos.y < canvasRect.height + BUFFER_SIZE;
    });
  }, [cards, canvasToScreen, isHighPerformanceMode, isZooming, isPanning, forceUpdate]);

  // ===== CARD RENDERING =====
  const renderedCards = useMemo(() => {
    const cardsToRender = isHighPerformanceMode && (isZooming || isPanning) ? 
      visibleCards.map(card => (
        <CardPlaceholder key={card.id} position={card.position} type={card.type} />
      )) :
      visibleCards.map(card => {
        let CardComponent;
        if (card.type === 'category') {
          CardComponent = CategoryCard;
        } else if (card.type === 'label') {
          CardComponent = LabelCard;
        } else {
          CardComponent = AnswerCard;
        }
        
        const isSelected = selectedCardIds.includes(card.id);
        const isLockedByMe = isCardLockedByMe(card.id);
        const isLockedByOthers = isCardLockedByOthers(card.id);
        const isSelectedByOthers = isCardSelectedByOthers(card.id);
        
        return (
          <Suspense key={card.id} fallback={<CardPlaceholder position={card.position} type={card.type} />}>
            <CardComponent
              key={card.id}
              card={card}
              isSelected={isSelected}
              isLocked={isLockedByMe || isLockedByOthers}
              isLockedByMe={isLockedByMe}
              isLockedByOthers={isLockedByOthers}
              isSelectedByOthers={isSelectedByOthers}
              isHovered={hoveredCardId === card.id}
              isRelated={relatedCardIds.has(card.id)}
              connectMode={connectMode}
              connectSource={connectSource}
              onConnect={(sourceId, targetId) => {
                connectCards(sourceId, targetId);
                setConnectSource(null);
                setConnectTarget(null);
              }}
              onConnectStart={(cardId) => {
                setConnectSource(cardId);
              }}
              onHover={(cardId) => {
                setHoveredCardId(cardId);
                if (cardId) {
                  const related = new Set();
                  connections.forEach(conn => {
                    if (conn.sourceId === cardId) related.add(conn.targetId);
                    if (conn.targetId === cardId) related.add(conn.sourceId);
                  });
                  setRelatedCardIds(related);
                } else {
                  setRelatedCardIds(new Set());
                }
              }}
              selectedForDeletion={selectedCardForDeletion === card.id}
              onSelectForDeletion={(cardId) => {
                if (connectMode) {
                  setSelectedCardForDeletion(cardId);
                }
              }}
              onDeleteConnections={(cardId) => {
                if (connectMode) {
                  deleteAllConnectionsForCard(cardId);
                  setSelectedCardForDeletion(null);
                }
              }}
            />
          </Suspense>
        );
      });
    
    return cardsToRender;
  }, [
    visibleCards, selectedCardIds, isCardLockedByMe, isCardLockedByOthers, 
    isCardSelectedByOthers, hoveredCardId, relatedCardIds, connectMode, 
    connectSource, connections, isHighPerformanceMode, isZooming, isPanning,
    connectCards, selectedCardForDeletion
  ]);

  // ===== CONNECTION RENDERING =====
  const renderedConnections = useMemo(() => {
    if (isHighPerformanceMode && (isZooming || isPanning)) {
      return [];
    }
    
    return connections.map(connection => {
      const sourceCard = getCardById(connection.sourceId);
      const targetCard = getCardById(connection.targetId);
      
      // Skip rendering if either card is missing
      if (!sourceCard || !targetCard) {
        return null;
      }
      
      return (
        <CardConnection
          key={connection.id}
          sourcePosition={sourceCard.position}
          targetPosition={targetCard.position}
          isHighlighted={relatedCardIds.has(connection.sourceId) || relatedCardIds.has(connection.targetId)}
        />
      );
    }).filter(Boolean); // Remove null entries
  }, [connections, getCardById, relatedCardIds, isHighPerformanceMode, isZooming, isPanning]);

  // ===== GRID RENDERING =====
  const renderGrid = useMemo(() => {
    if (zoom < 0.3) return null;
    
    return (
      <div 
        className="grid-background"
        style={{
          transform: transformStyle,
          opacity: Math.min(1, zoom)
        }}
      />
    );
  }, [zoom, transformStyle]);

  // ===== ZOOM CONTROLS =====
  const handleZoomIn = useCallback(() => {
    handleZoom(1.2, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
  }, [handleZoom]);

  const handleZoomOut = useCallback(() => {
    handleZoom(0.8, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
  }, [handleZoom]);

  const handleResetZoom = useCallback(() => {
    resetView();
  }, [resetView]);

  // ===== RENDER =====
  return (
    <div 
      className={`canvas-container ${connectMode ? 'connect-mode' : ''} ${isZooming ? 'zooming' : ''}`}
      ref={canvasRef}
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
      
      {/* Selection Rectangle - FIXED POSITIONING */}
      {isDragSelecting && (
        <div 
          className="selection-rectangle"
          style={{ 
            position: 'absolute',
            left: `${Math.min(dragSelectionRect.x, dragSelectionRect.x + dragSelectionRect.width) * zoom + pan.x}px`,
            top: `${Math.min(dragSelectionRect.y, dragSelectionRect.y + dragSelectionRect.height) * zoom + pan.y}px`,
            width: `${Math.abs(dragSelectionRect.width) * zoom}px`,
            height: `${Math.abs(dragSelectionRect.height) * zoom}px`,
            pointerEvents: 'none',
            zIndex: 1000
          }}
        />
      )}
      
      <div className={`canvas ${isPanning ? 'moving' : ''}`}>
        {/* No Space Selected Message */}
        {!currentSpaceId && showCollaborationUI && (
          <div className="no-space-message">
            <div className="no-space-content">
              <h3>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
                No Space Selected
              </h3>
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
        
        {/* Connect Mode Indicator */}
        {connectMode && (
          <div className="connect-mode-indicator">
            <span className="connect-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </span>
            <span>Connect Mode</span>
            <button className="connect-exit-button" onClick={() => {
              setConnectMode(false);
              setSelectedCardForDeletion(null);
            }}>Exit</button>
          </div>
        )}
        
        {/* Zoom controls */}
        <div className="zoom-controls">
          <button className="zoom-button" onClick={handleZoomIn} title="Zoom In">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <div className="zoom-level">{Math.round(zoom * 100)}%</div>
          <button className="zoom-button" onClick={handleZoomOut} title="Zoom Out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <button className="zoom-button" onClick={handleResetZoom} title="Reset Zoom">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
          <button 
            className={`zoom-button ${isHighPerformanceMode ? 'active' : ''}`} 
            onClick={() => setIsHighPerformanceMode(prev => !prev)} 
            title="Toggle High Performance Mode"
          >
            {isHighPerformanceMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.5-6.5l-4.24 4.24M7.76 16.24l-4.24 4.24m12.73-12.73l-4.24 4.24M7.76 7.76L3.52 3.52"/>
              </svg>
            )}
          </button>
          <button 
            className={`zoom-button ${showMiniMap ? 'active' : ''}`} 
            onClick={() => setShowMiniMap(prev => !prev)} 
            title="Toggle Mini-Map"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/>
              <line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
          </button>
          <button 
            className={`zoom-button ${showOffscreenPointers ? 'active' : ''}`} 
            onClick={() => setShowOffscreenPointers(prev => !prev)} 
            title="Toggle Offscreen Pointers"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </button>
          <button 
            className={`zoom-button ${showCollaborationUI ? 'active' : ''}`} 
            onClick={() => setShowCollaborationUI(prev => !prev)} 
            title="Toggle Collaboration UI"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
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