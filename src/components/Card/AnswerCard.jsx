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

const CloseIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
));

const AnswerCard = ({ 
  card, 
  isSelected, 
  isHovered,
  isRelated,
  connectMode,
  connectSource,
  onConnect,
  onConnectStart,
  onConnectEnd,
  onHover,
  onLeave,
  onSelect,
  onDeselect,
  selectedForDeletion,
  onSelectForDeletion,
  onDeleteConnections
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
  
  // Sync with external position changes (only when not dragging locally)
  useEffect(() => {
    // Only update position if we're not currently dragging this card
    if (!isDragging && JSON.stringify(card.position) !== JSON.stringify(position)) {
      updatePosition(card.position);
    }
  }, [card.position, updatePosition, position, isDragging]);

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

  // Handle card click - now only for connect mode and selection
  const handleCardClick = (e) => {
    e.stopPropagation();
    
    console.log('AnswerCard: handleCardClick called', { 
      cardId: card.id, 
      connectMode, 
      isLocked: isCardLockedByOthers(card.id),
      expandedState: isExpanded,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey
    });
    
    // Check if card is locked by another user
    if (isCardLockedByOthers(card.id)) {
      console.log('AnswerCard: Card locked by others, ignoring click');
      return; // Cannot interact with card locked by others
    }
    
    // If in connect mode, handle connection deletion selection logic
    if (connectMode) {
      console.log('AnswerCard: In connect mode, selecting for deletion:', card.id);
      
      // Select card for connection deletion
      if (onSelectForDeletion) {
        onSelectForDeletion(card.id);
      }
      
      return; // Don't expand card when in connect mode
    }
    
    // Check for multi-selection modifiers (Shift, Ctrl, Cmd)
    const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
    
    // Always handle selection regardless of expand state for multi-select
    if (onSelect) {
      onSelect(card.id, isMultiSelect);
    }
    
    // Only use collaboration for single selection
    if (!isMultiSelect && collaborationSelectCard) {
      collaborationSelectCard(card.id);
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
    
    // Toggle expansion state
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Select and lock the card when expanding
    if (newExpandedState) {
      if (onSelect) {
        onSelect(card.id, false);
      }
      
      if (collaborationSelectCard) {
        collaborationSelectCard(card.id);
      }
    }
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

  // Auto-resize textarea to fit content
  const autoResizeTextarea = useCallback(() => {
    if (contentTextareaRef.current) {
      const textarea = contentTextareaRef.current;
      
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Get computed styles to calculate accurate dimensions
      const computedStyle = window.getComputedStyle(textarea);
      const fontSize = parseFloat(computedStyle.fontSize);
      const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.5;
      const paddingTop = parseFloat(computedStyle.paddingTop);
      const paddingBottom = parseFloat(computedStyle.paddingBottom);
      const borderTop = parseFloat(computedStyle.borderTopWidth);
      const borderBottom = parseFloat(computedStyle.borderBottomWidth);
      
      // Calculate minimum and maximum heights
      const minLines = 3;
      const maxLines = 20;
      const minHeight = lineHeight * minLines + paddingTop + paddingBottom + borderTop + borderBottom;
      const maxHeight = lineHeight * maxLines + paddingTop + paddingBottom + borderTop + borderBottom;
      
      // Get the height needed for the content
      const neededHeight = Math.max(minHeight, Math.min(maxHeight, textarea.scrollHeight));
      
      // Set the height
      textarea.style.height = `${neededHeight}px`;
    }
  }, []);

  // Auto-resize when content changes
  useEffect(() => {
    if (isExpanded) {
      autoResizeTextarea();
    }
  }, [localContent, isExpanded, autoResizeTextarea]);

  // Auto-resize when textarea becomes visible
  useEffect(() => {
    if (isExpanded && contentTextareaRef.current) {
      // Small delay to ensure textarea is fully rendered
      setTimeout(autoResizeTextarea, 10);
    }
  }, [isExpanded, autoResizeTextarea]);
  
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    
    console.log('AnswerCard: Content changed for card:', card.id, 'New content length:', newContent.length);
    
    // Auto-resize textarea after content change
    setTimeout(autoResizeTextarea, 0);
    
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

  // Remove the old handleStartConnection function and replace it with a connection button handler
  const handleConnectionButtonClick = (e) => {
    e.stopPropagation();
    
    // Check if card is locked by another user
    if (isCardLockedByOthers(card.id)) {
      return; // Cannot start connection from locked card
    }
    
    console.log('AnswerCard: Connection button clicked for card:', card.id);
    
    if (onConnectStart) {
      onConnectStart(card.id);
    }
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
        
        {/* DEBUG: Always show X button for testing */}
        {connectMode && (
          <button 
            className="card-delete-connections-action"
            onClick={(e) => {
              e.stopPropagation();
              console.log('X button clicked for card:', card.id);
              if (onDeleteConnections) {
                onDeleteConnections(card.id);
              }
            }}
            title="Delete all connections for this card"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              zIndex: 1000,
              display: 'flex'
            }}
          >
            <CloseIcon />
          </button>
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
                onInput={autoResizeTextarea}
                onClick={handleContentClick}
                onMouseDown={handleContentMouseDown}
                onKeyDown={handleContentKeyDown}
                placeholder="Enter your macro response here..."
                disabled={isLockedByOthers}
              />
              <button 
                className="copy-button" 
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                {isCopied && <span className="copied-indicator">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
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
              onClick={handleConnectionButtonClick}
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
              onClick={handleConnectionButtonClick}
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
              handleConnectionButtonClick(e);
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