import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import './Card.css';
import { useCards } from '../../context/CardContext';
import { useAI } from '../../context/AIContext';
import { useCollaboration } from '../../context/CollaborationContext';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import AIInput from '../AIFeature/AIInput';
import AIResponse from '../AIFeature/AIResponse';

// Memoized icons for better performance
const FileIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <line x1="10" y1="9" x2="8" y2="9"></line>
  </svg>
));

const MinimizeIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
));

const LockIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
));

const AnswerCard = ({ 
  card, 
  isSelected, 
  isHovered,
  isRelated,
  connectMode,
  onConnectStart,
  onConnectEnd,
  onHover,
  onLeave,
  onSelect,
  onDeselect
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const cardRef = useRef(null);
  const titleInputRef = useRef(null);
  const contentTextareaRef = useRef(null);
  
  const { selectCard, updateCard, updateCardDebounced, createCard, getConnectedCards } = useCards();
  const { aiResponse, activeCardId, clearAIResponse } = useAI();
  const { 
    isCardLockedByMe, 
    isCardLockedByOthers, 
    selectCard: collaborationSelectCard, 
    deselectCard: collaborationDeselectCard,
    isCardSelectedByMe,
    isCardSelectedByOthers
  } = useCollaboration();
  
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

  // Handle ESC key to minimize (only when not editing)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isExpanded && !isEditingTitle && document.activeElement !== contentTextareaRef.current) {
        setIsExpanded(false);
      }
    };
    
    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isExpanded, isEditingTitle]);

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
      // Check if card is locked by another user
      if (isCardLockedByOthers(card.id)) {
        return; // Cannot select card locked by others
      }
      
      // Lock the card when selected
      if (!isCardLockedByMe(card.id) && !isSelected) {
        console.log('AnswerCard: Selecting card via collaboration:', card.id);
        collaborationSelectCard(card.id);
      }
      
      // Handle selection - always use onSelect if provided, otherwise fall back to context
      if (onSelect) {
        onSelect(card.id, e.ctrlKey);
      } else if (selectCard) {
        selectCard(card.id, e.ctrlKey);
      }
    }
  };
  
  // Handle double click to toggle expand - but prevent if clicking on editable areas
  const handleDoubleClick = (e) => {
    // Don't expand/collapse if we're clicking on title text or content area when expanded
    if (isExpanded && (e.target.closest('.card-title') || e.target.closest('.content-textarea'))) {
      return;
    }
    
    e.stopPropagation();
    
    // Check if card is locked by another user
    if (isCardLockedByOthers(card.id)) {
      return; // Cannot expand card locked by others
    }
    
    setIsExpanded(!isExpanded);
  };
  
  // Handle title edit
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    
    console.log('AnswerCard: Title changed for card:', card.id, 'New title:', newTitle);
    
    // Update local state with debounced server/websocket updates
    updateCardDebounced(card.id, { title: newTitle });
  };

  // Handle title edit mode
  const handleTitleDoubleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isExpanded && !isCardLockedByOthers(card.id)) {
      setIsEditingTitle(true);
    }
  };

  // Handle title input events to prevent interference with shortcuts
  const handleTitleInputKeyDown = (e) => {
    // Stop propagation of all key events to prevent triggering shortcuts
    e.stopPropagation();
    
    // Handle specific keys
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditingTitle(false);
      titleInputRef.current?.blur();
    }
  };

  const handleTitleInputClick = (e) => {
    // Prevent card selection when clicking inside title input
    e.stopPropagation();
  };

  const handleTitleInputMouseDown = (e) => {
    // Prevent card dragging when interacting with title input
    e.stopPropagation();
  };

  const handleTitleInputBlur = () => {
    setIsEditingTitle(false);
  };

  // Focus title input when entering edit mode
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);
  
  // Handle content edit with debouncing
  const [localContent, setLocalContent] = useState(card.content || '');
  const debouncedUpdateRef = useRef(null);
  
  useEffect(() => {
    setLocalContent(card.content || '');
  }, [card.content]);
  
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    
    console.log('AnswerCard: Content changed for card:', card.id, 'New content length:', newContent.length);
    
    // Clear existing timeout
    if (debouncedUpdateRef.current) {
      clearTimeout(debouncedUpdateRef.current);
    }
    
    // Use debounced update for content changes
    debouncedUpdateRef.current = setTimeout(() => {
      console.log('AnswerCard: Sending debounced content update for card:', card.id);
      updateCardDebounced(card.id, { content: newContent });
      debouncedUpdateRef.current = null;
    }, 300);
  };

  // Handle content textarea events to prevent interference with shortcuts
  const handleContentKeyDown = (e) => {
    // Stop propagation of all key events to prevent triggering shortcuts
    e.stopPropagation();
  };

  const handleContentClick = (e) => {
    // Prevent card selection when clicking inside content textarea
    e.stopPropagation();
  };

  const handleContentMouseDown = (e) => {
    // Prevent card dragging when interacting with content textarea
    e.stopPropagation();
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }
      
      // Unlock the card if it's locked by me when component unmounts
      if (isCardLockedByMe(card.id)) {
        collaborationDeselectCard(card.id);
      }
    };
  }, [card.id, isCardLockedByMe, collaborationDeselectCard]);
  
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
    
    // Check if card is locked by another user
    if (isCardLockedByOthers(card.id)) {
      return; // Cannot start connection from locked card
    }
    
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
    
    // Check if card is locked by another user
    if (isCardLockedByOthers(card.id)) {
      return; // Cannot add child to locked card
    }
    
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
  
  // Handle card deselection
  const handleDeselect = () => {
    if (onDeselect) {
      onDeselect(card.id);
    }
    
    // Unlock the card when deselected
    if (isCardLockedByMe(card.id)) {
      console.log('AnswerCard: Deselecting card via collaboration:', card.id);
      collaborationDeselectCard(card.id);
    }
  };

  const cardStyle = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    zIndex: isDragging || isSelected || isHovered ? 20 : isExpanded ? 15 : 10,
  };
  
  const isLockedByOthers = isCardLockedByOthers(card.id);
  const isLockedByMe = isCardLockedByMe(card.id);

  return (
    <div
      ref={cardRef}
      className={`card answer-card ${isSelected ? 'selected' : ''} 
                ${isDragging ? 'dragging' : ''} 
                ${isHovered ? 'hovered' : ''} 
                ${isRelated ? 'related' : ''}
                ${isExpanded ? 'expanded' : ''}
                ${isLockedByOthers ? 'locked-by-others' : ''}
                ${isLockedByMe ? 'locked-by-me' : ''}`}
      style={cardStyle}
      onClick={handleCardClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={connectMode || isLockedByOthers ? null : handleMouseDown}
      onMouseEnter={() => onHover(card.id)}
      onMouseLeave={onLeave}
    >
      <div className="card-header">
        <span className="card-icon">
          {isLockedByOthers ? <LockIcon /> : <FileIcon />}
        </span>
        {isExpanded && isEditingTitle && !isLockedByOthers ? (
          <input
            ref={titleInputRef}
            type="text"
            className="card-title-input"
            value={card.title}
            onChange={handleTitleChange}
            onBlur={handleTitleInputBlur}
            onClick={handleTitleInputClick}
            onMouseDown={handleTitleInputMouseDown}
            onKeyDown={handleTitleInputKeyDown}
            autoFocus
          />
        ) : (
          <div 
            className="card-title" 
            onDoubleClick={handleTitleDoubleClick}
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
            <MinimizeIcon />
          </button>
        )}
      </div>
      
      {isExpanded ? (
        <>
          <div className="card-content">
            <div className="content-wrapper">
              <textarea
                ref={contentTextareaRef}
                className="content-textarea"
                value={localContent}
                onChange={handleContentChange}
                onClick={handleContentClick}
                onMouseDown={handleContentMouseDown}
                onKeyDown={handleContentKeyDown}
                placeholder="Enter your macro response here..."
                disabled={isLockedByOthers}
              />
              <button 
                className={`content-copy-button ${isCopied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            
            {/* AI feature integration */}
            {isExpanded && (
              <div className="ai-section">
                <AIInput cardId={card.id} disabled={isLockedByOthers} />
                {activeCardId === card.id && aiResponse && (
                  <AIResponse response={aiResponse} cardId={card.id} disabled={isLockedByOthers} />
                )}
              </div>
            )}
          </div>
          
          <div className="card-actions">
            <button
              className="connection-button"
              title="Connect to another card"
              onClick={handleStartConnection}
              disabled={isLockedByOthers}
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
              onClick={handleAddChild}
              disabled={isLockedByOthers}
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
            {card.content ? (
              <div className="content-preview">
                {card.content.length > 50 
                  ? `${card.content.substring(0, 50)}...` 
                  : card.content}
              </div>
            ) : (
              <div className="content-preview empty">
                Empty answer card
              </div>
            )}
          </div>
          
          <div className="card-quick-actions">
            <button 
              className="quick-action-btn"
              onClick={handleStartConnection}
              title="Connect"
              disabled={isLockedByOthers}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </button>
            <button 
              className="quick-action-btn"
              onClick={handleQuickCopy}
              title="Copy content"
              disabled={isLockedByOthers}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              {isCopied && <span className="copied-indicator">✓</span>}
            </button>
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
              handleStartConnection(e);
            }}
          />
        </div>
      )}
    </div>
  );
};

// Optimization: Prevent unnecessary re-renders
const arePropsEqual = (prevProps, nextProps) => {
  const sameCard = prevProps.card.id === nextProps.card.id &&
                  prevProps.card.title === nextProps.card.title &&
                  prevProps.card.content === nextProps.card.content &&
                  JSON.stringify(prevProps.card.position) === JSON.stringify(nextProps.card.position);
  
  const sameState = prevProps.isSelected === nextProps.isSelected &&
                   prevProps.isHovered === nextProps.isHovered &&
                   prevProps.isRelated === nextProps.isRelated &&
                   prevProps.connectMode === nextProps.connectMode;
  
  return sameCard && sameState;
};

export default memo(AnswerCard, arePropsEqual);