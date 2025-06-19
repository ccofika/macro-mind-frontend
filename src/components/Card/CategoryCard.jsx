import React, { useState, useEffect, useRef, memo } from 'react';
import './Card.css';
import { useCards } from '../../context/CardContext';
import { useCollaboration } from '../../context/CollaborationContext';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

// Optimization: Extract static SVGs to prevent re-renders
const FolderIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
));

const MinimizeIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
));

const LinkIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
));

const FileIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="12" y1="13" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12" y2="17"></line>
  </svg>
));

const PlusIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
));

const LockIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
));

const CategoryCard = ({ 
  card, 
  isSelected, 
  isHovered,
  isRelated,
  connectMode,
  onConnect,
  onConnectStart,
  onConnectEnd,
  onHover,
  onLeave,
  onSelect,
  onDeselect,
  isLocked
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const cardRef = useRef(null);
  const titleInputRef = useRef(null);
  
  const { selectCard, updateCard, updateCardDebounced, createCard, getConnectedCards } = useCards();
  const { 
    isCardLockedByMe, 
    isCardLockedByOthers, 
    selectCard: collaborationSelectCard, 
    deselectCard: collaborationDeselectCard,
    isCardSelectedByMe,
    isCardSelectedByOthers
  } = useCollaboration();
  
  // Get connected cards count - memoize this calculation
  const connectionCount = React.useMemo(() => {
    return getConnectedCards ? getConnectedCards(card.id).length : 0;
  }, [card.id, getConnectedCards]);
  
  // Setup drag and drop functionality
  const { position, isDragging, handleMouseDown, updatePosition } = useDragAndDrop(card.id, card.position);
  
  // Sync with external position changes (only when not dragging locally)
  useEffect(() => {
    // Only update position if we're not currently dragging this card
    if (!isDragging && JSON.stringify(card.position) !== JSON.stringify(position)) {
      updatePosition(card.position);
    }
  }, [card.position, updatePosition, position, isDragging]);

  // Handle card clicks - now only for connect mode and selection
  const handleCardClick = (e) => {
    e.stopPropagation();
    
    console.log('CategoryCard: handleCardClick called', { 
      cardId: card.id, 
      connectMode, 
      isLocked: isCardLockedByOthers(card.id),
      expandedState: isExpanded 
    });
    
    // Check if card is locked by another user
    if (isCardLockedByOthers(card.id)) {
      console.log('CategoryCard: Card locked by others, ignoring click');
      return; // Cannot interact with card locked by others
    }
    
    // If in connect mode, handle connection logic
    if (connectMode) {
      console.log('CategoryCard: In connect mode, calling onConnect for card:', card.id);
      
      if (onConnect) {
        onConnect(card.id);
      }
      
      return; // Don't expand card when connecting
    }
    
    // Only select card on single click, don't expand
    if (!isExpanded && onSelect) {
      onSelect(card.id, false);
    }
  };
  
  // Handle double click to toggle expand - but prevent if clicking on title input area
  const handleDoubleClick = (e) => {
    // Don't expand/collapse if we're clicking on title text when expanded - allow title editing instead
    if (isExpanded && e.target.closest('.card-title')) {
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
        console.log('CategoryCard: Selecting card via collaboration:', card.id);
        collaborationSelectCard(card.id);
      }
    }
  };
  
  // Handle title change
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    
    console.log('CategoryCard: Title changed for card:', card.id, 'New title:', newTitle);
    
    // Update local state with debounced server/websocket updates
    updateCardDebounced(card.id, { title: newTitle });
  };

  // Handle title edit mode
  const handleTitleDoubleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isExpanded && !isLockedByOthers) {
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

  // Remove the old handleStartConnection function and replace it with a connection button handler
  const handleConnectionButtonClick = (e) => {
    e.stopPropagation();
    
    // Check if card is locked by another user
    if (isCardLockedByOthers(card.id)) {
      return; // Cannot start connection from locked card
    }
    
    console.log('CategoryCard: Connection button clicked for card:', card.id);
    
    if (onConnect) {
      onConnect(card.id);
    }
  };

  // Add new answer card
  const handleAddAnswer = (e) => {
    e.stopPropagation();
    
    // Check if card is locked by another user
    if (isCardLockedByOthers(card.id)) {
      return; // Cannot add answer to card locked by others
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
      console.log('CategoryCard: Deselecting card via collaboration:', card.id);
      collaborationDeselectCard(card.id);
    }
  };

  const cardStyle = {
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
    zIndex: isDragging || isSelected || isHovered ? 20 : isExpanded ? 15 : 10,
    willChange: isDragging ? 'transform' : 'auto'
  };

  const isLockedByOthers = isCardLockedByOthers(card.id);
  const isLockedByMe = isCardLockedByMe(card.id);

  return (
    <div
      ref={cardRef}
      className={`card category-card ${isSelected ? 'selected' : ''} 
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
          {isLockedByOthers ? <LockIcon /> : <FolderIcon />}
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
            <div className="category-description glass-container p-lg">
              <div className="text-secondary text-sm">
                Category containing <span className="text-accent font-medium">{connectionCount}</span> answer{connectionCount !== 1 ? 's' : ''}
              </div>
              <div className="text-tertiary text-xs" style={{marginTop: 'var(--space-sm)'}}>
                Click "Add Answer" to create new responses or "Connect" to link with other cards
              </div>
            </div>
          </div>
          
          <div className="card-actions">
            <button
              className="connection-button"
              title="Connect to another card"
              onClick={handleConnectionButtonClick}
              disabled={isLockedByOthers}
            >
              <LinkIcon />
              <span>Connect</span>
            </button>
            <button
              className="add-child-button"
              title="Add new answer"
              onClick={handleAddAnswer}
              disabled={isLockedByOthers}
            >
              <FileIcon />
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
              onClick={handleConnectionButtonClick}
              title="Connect"
              disabled={isLockedByOthers}
            >
              <LinkIcon />
            </button>
            <button 
              className="quick-action-btn"
              onClick={handleAddAnswer}
              title="Add Answer"
              disabled={isLockedByOthers}
            >
              <PlusIcon />
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
                  JSON.stringify(prevProps.card.position) === JSON.stringify(nextProps.card.position);
  
  const sameState = prevProps.isSelected === nextProps.isSelected &&
                   prevProps.isHovered === nextProps.isHovered &&
                   prevProps.isRelated === nextProps.isRelated &&
                   prevProps.connectMode === nextProps.connectMode &&
                   prevProps.isLocked === nextProps.isLocked;
  
  return sameCard && sameState;
};

export default memo(CategoryCard, arePropsEqual);