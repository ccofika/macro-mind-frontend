import React, { useState, useEffect, useRef, memo } from 'react';
import './Card.css';
import { useCards } from '../../context/CardContext';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

const CategoryCard = ({ 
  card, 
  isSelected, 
  isHovered,
  isRelated,
  connectMode,
  onConnectStart,
  onConnectEnd,
  onHover,
  onLeave
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const cardRef = useRef(null);
  const { selectCard, updateCard, createCard, getConnectedCards } = useCards();
  
  // Get connected cards count
  const connectedCards = getConnectedCards ? getConnectedCards(card.id) : [];
  const connectionCount = connectedCards.length;
  
  // Setup drag and drop functionality
  const { position, isDragging, handleMouseDown, updatePosition } = useDragAndDrop(card.id, card.position);
  
  // Sync with external position changes
  useEffect(() => {
    if (JSON.stringify(card.position) !== JSON.stringify(position)) {
      updatePosition(card.position);
    }
  }, [card.position, updatePosition, position]);

  // Handle click on card
  const handleCardClick = (e) => {
    e.stopPropagation();
    
    if (connectMode) {
      const rect = cardRef.current.getBoundingClientRect();
      const centerPos = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      onConnectEnd(card.id, centerPos);
    } else {
      selectCard(card.id, e.ctrlKey);
    }
  };
  
  // Handle double click to toggle expand
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  // Handle title edit
  const handleTitleChange = (e) => {
    updateCard(card.id, { title: e.target.value });
  };

  // Start connection from this card
  const handleStartConnection = (e) => {
    e.stopPropagation();
    if (connectMode) {
      const rect = cardRef.current.getBoundingClientRect();
      const centerPos = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      onConnectStart(card.id, centerPos);
    }
  };

  // Add new answer card
  const handleAddAnswer = (e) => {
    e.stopPropagation();
    if (createCard) {
      const newPosition = {
        x: position.x + 50,
        y: position.y + 150
      };
      createCard('answer', newPosition, card.id);
    }
  };

  // Minimize card
  const handleMinimize = (e) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  const cardStyle = {
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
    zIndex: isDragging || isSelected || isHovered ? 20 : isExpanded ? 15 : 10,
    willChange: isDragging ? 'transform' : 'auto'
  };

  return (
    <div
      ref={cardRef}
      className={`card category-card ${isSelected ? 'selected' : ''} 
                ${isDragging ? 'dragging' : ''} 
                ${isHovered ? 'hovered' : ''} 
                ${isRelated ? 'related' : ''}
                ${isExpanded ? 'expanded' : ''}`}
      style={cardStyle}
      onClick={handleCardClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={connectMode ? null : handleMouseDown}
      onMouseEnter={() => onHover(card.id)}
      onMouseLeave={onLeave}
    >
      <div className="card-header">
        <span className="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
        </span>
        {isExpanded && isEditingTitle ? (
          <input
            type="text"
            className="card-title-input"
            value={card.title}
            onChange={handleTitleChange}
            onBlur={() => setIsEditingTitle(false)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <div 
            className="card-title"
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (isExpanded) setIsEditingTitle(true);
            }}
          >
            {card.title}
          </div>
        )}
        
        {isExpanded && (
          <button 
            className="card-minimize-action"
            onClick={handleMinimize}
            title="Minimize (Esc)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        )}
      </div>

      {isExpanded ? (
        <>
          <div className="card-content">
            <div className="category-description">
              <p>Category containing {connectionCount} answer{connectionCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          
          <div className="card-actions">
            <button
              className="connection-button"
              title="Connect to another card"
              onClick={handleStartConnection}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <span>Connect</span>
            </button>
            <button
              className="add-child-button"
              title="Add new answer"
              onClick={handleAddAnswer}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="13" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12" y2="17"></line>
              </svg>
              <span>Add Answer</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="card-preview">
            Click to manage {connectionCount} answer{connectionCount !== 1 ? 's' : ''}
          </div>
          
          <div className="card-quick-actions">
            <button 
              className="quick-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              title="Expand"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </button>
            
            <button 
              className="quick-action-btn"
              onClick={handleAddAnswer}
              title="Quick add answer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </button>
            
            <button 
              className="quick-action-btn"
              onClick={handleStartConnection}
              title="Quick connect"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </button>
          </div>
          
          <div className="card-footer-stats">
            <div className="card-stat">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Category</span>
            </div>
            <div className="card-stat">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <span>{connectionCount} items</span>
            </div>
          </div>
        </>
      )}
      
      {connectionCount > 0 && (
        <div className="connection-count">{connectionCount}</div>
      )}
      
      {connectMode && (
        <div className="connection-handles">
          <div 
            className="connection-handle"
            onClick={(e) => {
              e.stopPropagation();
              const rect = cardRef.current.getBoundingClientRect();
              const pos = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
              };
              onConnectStart(card.id, pos);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default memo(CategoryCard, (prevProps, nextProps) => {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.isRelated === nextProps.isRelated &&
    prevProps.connectMode === nextProps.connectMode &&
    JSON.stringify(prevProps.card.position) === JSON.stringify(nextProps.card.position) &&
    prevProps.card.title === nextProps.card.title
  );
});