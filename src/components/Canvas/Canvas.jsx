import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import './Canvas.css';
import CategoryCard from '../Card/CategoryCard';
import AnswerCard from '../Card/AnswerCard';
import CardConnection from '../Card/CardConnection';
import ActionBar from '../ActionBar/ActionBar';
import { useCanvas } from '../../context/CanvasContext';
import { useCards } from '../../context/CardContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useAutoSave } from '../../hooks/useAutoSave';

// Konstante - smanjuju GC i rekalkulaciju
const BUFFER_SIZE = 700; // Povećan buffer za glatke prelaze

const Canvas = () => {
  const canvasRef = useRef(null);
  const { zoom, pan, canvasToScreen, handleZoom, handlePan, setIsDragging } = useCanvas();
  const { 
    cards, 
    connections, 
    selectedCardIds, 
    clearSelection, 
    createCategoryCard, 
    connectCards 
  } = useCards();
  
  const [connectMode, setConnectMode] = useState(false);
  const [sourceCardId, setSourceCardId] = useState(null);
  const [connectionLine, setConnectionLine] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  
  // Panning state - optimizovano za ReactJS ažuriranja
  const [isPanning, setIsPanning] = useState(false);
  const panningRef = useRef({
    isPanning: false,
    lastPosition: { x: 0, y: 0 },
    animationFrame: null
  });
  
  // Setup keyboard shortcuts
  useKeyboardShortcuts(canvasRef);
  
  // Setup auto-save functionality
  useAutoSave();

  // Listen for connect mode toggle events
  useEffect(() => {
    const handleToggleConnectMode = () => {
      setConnectMode(prevMode => !prevMode);
      if (connectMode) {
        // Reset connection state when exiting connect mode
        setSourceCardId(null);
        setConnectionLine(null);
      }
    };
    
    document.addEventListener('toggleConnectMode', handleToggleConnectMode);
    
    return () => {
      document.removeEventListener('toggleConnectMode', handleToggleConnectMode);
    };
  }, [connectMode]);

  // Implementacija pomeranja po canvasu - optimizovana za smootness
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Zoom handling
    const handleWheel = (e) => {
  e.preventDefault();
  
  // Calculate zoom direction (in or out)
  // Koristimo manji koeficijent za sporiji zoom
  const delta = e.deltaY > 0 ? 0.5 : -0.5;
  
  // Zoom centered on mouse position
  handleZoom(delta, { x: e.clientX, y: e.clientY });
};

    // Handle mouse down for panning - samo levi klik
    const handleMouseDown = (e) => {
      // Proveravamo target direktno - mora biti sam canvas element
      if (e.target === canvas) {
        setIsPanning(true);
        panningRef.current.isPanning = true;
        panningRef.current.lastPosition = { x: e.clientX, y: e.clientY };
        setIsDragging(true);
        canvas.style.cursor = 'grabbing';
      }
    };

    // Handle mouse move for panning - optimizovano sa requestAnimationFrame
    const handleMouseMove = (e) => {
      if (!panningRef.current.isPanning) return;
      
      // Otkazujemo prethodni animacioni frejm ako postoji
      if (panningRef.current.animationFrame) {
        cancelAnimationFrame(panningRef.current.animationFrame);
      }
      
      // Koristimo requestAnimationFrame za glatkije ažuriranje
      panningRef.current.animationFrame = requestAnimationFrame(() => {
        const dx = e.clientX - panningRef.current.lastPosition.x;
        const dy = e.clientY - panningRef.current.lastPosition.y;
        
        handlePan(dx, dy);
        panningRef.current.lastPosition = { x: e.clientX, y: e.clientY };
      });
    };

    // Handle mouse up to end panning
    const handleMouseUp = () => {
      if (panningRef.current.isPanning) {
        setIsPanning(false);
        panningRef.current.isPanning = false;
        setIsDragging(false);
        canvas.style.cursor = 'grab';
        
        // Otkazujemo animacioni frejm ako postoji
        if (panningRef.current.animationFrame) {
          cancelAnimationFrame(panningRef.current.animationFrame);
          panningRef.current.animationFrame = null;
        }
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
      
      // Čišćenje animacionog frejma ako postoji
      if (panningRef.current.animationFrame) {
        cancelAnimationFrame(panningRef.current.animationFrame);
      }
    };
  }, [handleZoom, handlePan, setIsDragging]);

  // Click on empty canvas to clear selection
  const handleCanvasClick = useCallback((e) => {
    // Samo ako je kliknuto direktno na canvas element
    if (e.target === canvasRef.current) {
      clearSelection();
      
      // Double click on empty canvas creates a new category card
      if (e.detail === 2) {
        createCategoryCard("New Category", { x: e.clientX, y: e.clientY });
      }
      
      // Exit connect mode if clicked on empty space
      if (connectMode) {
        setSourceCardId(null);
        setConnectionLine(null);
      }
    }
  }, [clearSelection, createCategoryCard, connectMode]);

  // Start connection from a card in connect mode
  const handleCardConnectStart = useCallback((cardId, position) => {
    if (connectMode) {
      setSourceCardId(cardId);
      setConnectionLine({
        start: position,
        end: position
      });
    }
  }, [connectMode]);

  // Update connection line when moving mouse
  const handleMouseMove = useCallback((e) => {
    if (connectMode && sourceCardId && connectionLine) {
      // Koristimo requestAnimationFrame za glatko ažuriranje linije
      requestAnimationFrame(() => {
        setConnectionLine({
          ...connectionLine,
          end: { x: e.clientX, y: e.clientY }
        });
      });
    }
  }, [connectMode, sourceCardId, connectionLine]);

  // Finish connection on target card
  const handleCardConnectEnd = useCallback((targetCardId) => {
    if (connectMode && sourceCardId && sourceCardId !== targetCardId) {
      connectCards(sourceCardId, targetCardId);
      setSourceCardId(null);
      setConnectionLine(null);
    }
  }, [connectMode, sourceCardId, connectCards]);

  // Handle card hover
  const handleCardHover = useCallback((cardId) => {
    setHoveredCardId(cardId);
  }, []);

  // Clear hover state
  const handleCardLeave = useCallback(() => {
    setHoveredCardId(null);
  }, []);

  // Generate grid pattern for canvas background - memorizovano za bolje performanse
  const renderGrid = useMemo(() => {
    const gridSize = 50 * zoom;
    const offsetX = pan.x % gridSize;
    const offsetY = pan.y % gridSize;
    
    return (
      <svg className="grid-pattern" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
            <path 
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} 
              fill="none" 
              stroke="var(--grid-color)" 
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" transform={`translate(${offsetX}, ${offsetY})`} />
      </svg>
    );
  }, [zoom, pan.x, pan.y]);

  // Find cards related to currently hovered card - memorizovano za bolje performanse
  const relatedCardIds = useMemo(() => {
    if (!hoveredCardId) return new Set();
    
    const relatedIds = new Set();
    
    // Find direct connections
    connections.forEach(conn => {
      if (conn.sourceId === hoveredCardId) {
        relatedIds.add(conn.targetId);
      } else if (conn.targetId === hoveredCardId) {
        relatedIds.add(conn.sourceId);
      }
    });
    
    return relatedIds;
  }, [hoveredCardId, connections]);

  // Calculate visible area for card virtualization - optimizovano
  const isCardVisible = useCallback((cardPosition) => {
    const screenPosition = canvasToScreen(cardPosition);
    
    return (
      screenPosition.x + BUFFER_SIZE >= 0 &&
      screenPosition.x - BUFFER_SIZE <= window.innerWidth &&
      screenPosition.y + BUFFER_SIZE >= 0 &&
      screenPosition.y - BUFFER_SIZE <= window.innerHeight
    );
  }, [canvasToScreen]);

  // Optimizovano renderovanje vidljivih kartica
  const visibleCards = useMemo(() => {
    return cards.filter(card => isCardVisible(card.position));
  }, [cards, isCardVisible]);

  // Optimizovano renderovanje vidljivih konekcija
  const visibleConnections = useMemo(() => {
    return connections.filter(connection => {
      const sourceCard = cards.find(card => card.id === connection.sourceId);
      const targetCard = cards.find(card => card.id === connection.targetId);
      
      if (!sourceCard || !targetCard) return false;
      
      // Renderuj konekciju samo ako je bar jedna kartica vidljiva
      return isCardVisible(sourceCard.position) || isCardVisible(targetCard.position);
    });
  }, [connections, cards, isCardVisible]);

  // Transformacioni string za kontejnere - memorizovan da izbegne ponovno računanje
  const transformStyle = useMemo(() => {
    return `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
  }, [pan.x, pan.y, zoom]);

  // Stil za canvas
  const canvasStyle = useMemo(() => {
    return { 
      cursor: isPanning ? 'grabbing' : 'grab' 
    };
  }, [isPanning]);

  return (
    <div 
      className={`canvas ${connectMode ? 'connect-mode' : ''}`}
      ref={canvasRef}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      style={canvasStyle}
    >
      {/* Grid background */}
      {renderGrid}
      
      {/* Active connection being drawn */}
      {connectMode && connectionLine && (
        <svg className="connection-line-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <line
            x1={connectionLine.start.x}
            y1={connectionLine.start.y}
            x2={connectionLine.end.x}
            y2={connectionLine.end.y}
            stroke="var(--accent-color)"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        </svg>
      )}
      
      {/* Card connections */}
      <div className="connections-container" style={{ transform: transformStyle }}>
        {visibleConnections.map((connection) => {
          const sourceCard = cards.find(card => card.id === connection.sourceId);
          const targetCard = cards.find(card => card.id === connection.targetId);
          
          if (!sourceCard || !targetCard) return null;
          
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
        })}
      </div>
      
      {/* Cards */}
      <div className="cards-container" style={{ transform: transformStyle }}>
        {visibleCards.map((card) => {
          const isSelected = selectedCardIds.includes(card.id);
          const isHovered = card.id === hoveredCardId;
          const isRelated = relatedCardIds.has(card.id);
          
          const cardProps = {
            key: card.id,
            card,
            isSelected,
            isHovered,
            isRelated,
            connectMode,
            onConnectStart: handleCardConnectStart,
            onConnectEnd: handleCardConnectEnd,
            onHover: handleCardHover,
            onLeave: handleCardLeave
          };
          
          return card.type === 'category' ? (
            <CategoryCard {...cardProps} />
          ) : (
            <AnswerCard {...cardProps} />
          );
        })}
      </div>
      
      {/* Action Bar */}
      <ActionBar />
      
      {/* Connect Mode Indicator */}
      {connectMode && (
        <div className="connect-mode-indicator">
          <span className="connect-icon">🔗</span>
          <span>Connect Mode</span>
          <button className="connect-exit-button" onClick={() => setConnectMode(false)}>Exit</button>
        </div>
      )}
    </div>
  );
};

// Optimizovali smo komponentu, ali je ne memoizujemo jer je top-level komponenta
export default Canvas;