import React, { useState, useRef, useEffect, memo } from 'react';
import { useCards } from '../../context/CardContext';
import { useCollaboration } from '../../context/CollaborationContext';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import './Card.css';

const LabelCard = ({ 
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
  const [isEditing, setIsEditing] = useState(false);
  const [fontSize, setFontSize] = useState(card.fontSize || 250);
  const textRef = useRef(null);
  const inputRef = useRef(null);
  
  const { updateCard, updateCardDebounced } = useCards();
  const { 
    isCardLockedByMe, 
    isCardLockedByOthers, 
    selectCard: collaborationSelectCard, 
    deselectCard: collaborationDeselectCard,
    isCardSelectedByMe,
    isCardSelectedByOthers
  } = useCollaboration();
  
  // Setup drag and drop functionality
  const { position, isDragging, handleMouseDown, updatePosition } = useDragAndDrop(card.id, card.position);
  
  // Sync with external position changes (only when not dragging locally)
  useEffect(() => {
    if (!isDragging && JSON.stringify(card.position) !== JSON.stringify(position)) {
      updatePosition(card.position);
    }
  }, [card.position, updatePosition, position, isDragging]);

  // Handle text editing
  const handleTextClick = (e) => {
    e.stopPropagation();
    if (!isCardLockedByOthers(card.id)) {
      setIsEditing(true);
    }
  };

  const handleTextChange = (e) => {
    const newTitle = e.target.value;
    updateCardDebounced(card.id, { title: newTitle });
  };

  const handleTextBlur = () => {
    setIsEditing(false);
  };

  // Handle font size changes
  const increaseFontSize = (e) => {
    e.stopPropagation();
    if (!isCardLockedByOthers(card.id)) {
      const newSize = Math.min(fontSize + 4, 400);
      setFontSize(newSize);
      updateCard(card.id, { fontSize: newSize });
    }
  };

  const decreaseFontSize = (e) => {
    e.stopPropagation();
    if (!isCardLockedByOthers(card.id)) {
      const newSize = Math.max(fontSize - 4, 150);
      setFontSize(newSize);
      updateCard(card.id, { fontSize: newSize });
    }
  };

  // Handle card selection
  const handleCardClick = (e) => {
    e.stopPropagation();
    
    if (isCardLockedByOthers(card.id)) {
      return;
    }
    
    if (onSelect) {
      onSelect(card.id);
    }
    
    if (!isCardSelectedByMe(card.id)) {
      console.log('LabelCard: Selecting card via collaboration:', card.id);
      collaborationSelectCard(card.id);
    }
  };

  // Handle deselection
  const handleDeselect = () => {
    if (onDeselect) {
      onDeselect(card.id);
    }
    
    if (isCardLockedByMe(card.id)) {
      console.log('LabelCard: Deselecting card via collaboration:', card.id);
      collaborationDeselectCard(card.id);
    }
  };

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Update fontSize from card data
  useEffect(() => {
    if (card.fontSize && card.fontSize !== fontSize) {
      setFontSize(card.fontSize);
    }
  }, [card.fontSize]);

  // Handle click outside to exit editing mode
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isEditing && textRef.current && !textRef.current.contains(event.target)) {
        setIsEditing(false);
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing]);

  const cardStyle = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    zIndex: isDragging || isSelected || isHovered ? 20 : 10,
  };
  
  const isLockedByOthers = isCardLockedByOthers(card.id);
  const isLockedByMe = isCardLockedByMe(card.id);

  return (
    <div
      ref={textRef}
      className={`label-card ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isHovered ? 'hovered' : ''} ${isRelated ? 'related' : ''} ${isLockedByOthers ? 'locked-by-others' : ''} ${isLockedByMe ? 'locked-by-me' : ''}`}
      style={cardStyle}
      onClick={handleCardClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => onHover && onHover(card.id)}
      onMouseLeave={() => onLeave && onLeave()}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={card.title}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleTextBlur();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleTextBlur();
            }
          }}
          className="label-input"
          style={{ fontSize: `${fontSize}px` }}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="label-text"
          onDoubleClick={handleTextClick}
          style={{ fontSize: `${fontSize}px` }}
        >
          {card.title}
        </div>
      )}
      
      {isSelected && !isLockedByOthers && (
        <div className="label-controls">
          <button
            className="font-size-btn"
            onClick={decreaseFontSize}
            title="Decrease font size"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button
            className="font-size-btn"
            onClick={increaseFontSize}
            title="Increase font size"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      )}
      
      {isLockedByOthers && (
        <div className="lock-indicator">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
      )}
    </div>
  );
};

// Optimization: Prevent unnecessary re-renders
const arePropsEqual = (prevProps, nextProps) => {
  const sameCard = prevProps.card.id === nextProps.card.id &&
                  prevProps.card.title === nextProps.card.title &&
                  prevProps.card.fontSize === nextProps.card.fontSize &&
                  JSON.stringify(prevProps.card.position) === JSON.stringify(nextProps.card.position);
  
  const sameState = prevProps.isSelected === nextProps.isSelected &&
                   prevProps.isHovered === nextProps.isHovered &&
                   prevProps.isRelated === nextProps.isRelated &&
                   prevProps.connectMode === nextProps.connectMode &&
                   prevProps.isLocked === nextProps.isLocked;
  
  return sameCard && sameState;
};

export default memo(LabelCard, arePropsEqual); 