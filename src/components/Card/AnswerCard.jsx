import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import './Card.css';
import { useCards } from '../../context/CardContext';
import { useAI } from '../../context/AIContext';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import AIInput from '../AIFeature/AIInput';
import AIResponse from '../AIFeature/AIResponse';

const AnswerCard = ({ 
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
  const [isCopied, setIsCopied] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const cardRef = useRef(null);
  const { selectCard, updateCard, createCard, getConnectedCards } = useCards();
  const { aiResponse, activeCardId, clearAIResponse } = useAI();
  
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

  // Clear AI response when card is closed
  useEffect(() => {
    if (!isExpanded && activeCardId === card.id) {
      clearAIResponse();
    }
  }, [isExpanded, activeCardId, card.id, clearAIResponse]);

  // Handle ESC key to minimize
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    
    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isExpanded]);

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
  
  // Handle content edit with debouncing
  const [localContent, setLocalContent] = useState(card.content || '');
  const debouncedUpdateRef = useRef(null);
  
  useEffect(() => {
    setLocalContent(card.content || '');
  }, [card.content]);
  
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    
    if (debouncedUpdateRef.current) {
      clearTimeout(debouncedUpdateRef.current);
    }
    
    debouncedUpdateRef.current = setTimeout(() => {
      updateCard(card.id, { content: newContent });
      debouncedUpdateRef.current = null;
    }, 300);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }
    };
  }, []);
  
  // Copy content to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(localContent)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
      });
  };

  // Quick copy for collapsed card
  const handleQuickCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(card.content || '')
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
  };

  // Start connection from this card
  const handleStartConnection = (e) => {
    e.stopPropagation();
    const rect = cardRef.current.getBoundingClientRect();
    const centerPos = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    onConnectStart(card.id, centerPos);
  };

  // Add new child card
  const handleAddChild = (e) => {
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
    transform: `translate(${position.x}px, ${position.y}px)`,
    zIndex: isDragging || isSelected || isHovered ? 20 : isExpanded ? 15 : 10,
  };

  return (
    <div
      ref={cardRef}
      className={`card answer-card ${isSelected ? 'selected' : ''} 
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <line x1="10" y1="9" x2="8" y2="9"></line>
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
            <div className="content-wrapper">
              <textarea
                className="content-textarea"
                value={localContent}
                onChange={handleContentChange}
                placeholder="Enter your macro response here..."
                onClick={(e) => e.stopPropagation()}
              />
              <button 
                className={`content-copy-button ${isCopied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                {isCopied ? (
                  <svg className="copy-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </button>
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
              title="Add child card"
              onClick={handleAddChild}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <span>Add Child</span>
            </button>
          </div>
          
          <div className="card-ai-section">
            <AIInput cardId={card.id} />
            
            {activeCardId === card.id && aiResponse && (
              <AIResponse response={aiResponse} cardPosition={position} />
            )}
          </div>
        </>
      ) : (
        <>
          {card.content && (
            <div className="card-preview">
              {card.content.substring(0, 100)}...
            </div>
          )}
          
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
            
            {card.content && (
              <button 
                className={`quick-action-btn ${isCopied ? 'copied' : ''}`}
                onClick={handleQuickCopy}
                title="Quick copy"
              >
                {isCopied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </button>
            )}
            
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
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <span>{connectionCount} connections</span>
            </div>
            {card.content && (
              <div className="card-stat">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span>{card.content.length} chars</span>
              </div>
            )}
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

export default memo(AnswerCard, (prevProps, nextProps) => {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.isRelated === nextProps.isRelated &&
    prevProps.connectMode === nextProps.connectMode &&
    JSON.stringify(prevProps.card.position) === JSON.stringify(nextProps.card.position) &&
    prevProps.card.title === nextProps.card.title &&
    prevProps.card.content === nextProps.card.content &&
    (prevProps.activeCardId === prevProps.card.id) === (nextProps.activeCardId === nextProps.card.id)
  );
});