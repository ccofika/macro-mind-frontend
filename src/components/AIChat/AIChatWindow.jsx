import React, { useState, useRef, useEffect, useContext } from 'react';
import { useAIChat } from '../../context/AIChatContext';
import { useCards } from '../../context/CardContext';
import AuthContext from '../../context/AuthContext';
import AIChatSidebar from './AIChatSidebar';
import AIChatMessages from './AIChatMessages';
import AIChatInput from './AIChatInput';
import AIChatBubbles from './AIChatBubbles';
import './AIChatWindow.css';

const AIChatWindow = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 1000, height: 700 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const windowRef = useRef(null);
  const headerRef = useRef(null);
  const resizeRef = useRef(null);
  
  const { currentChat, selectedMode, isOpen, closeChat } = useAIChat();
  const { currentUser } = useContext(AuthContext);

  // Handle window dragging
  const handleMouseDown = (e) => {
    if (e.target.closest('.resize-handle') || e.target.closest('.ai-chat-content')) return;
    
    setIsDragging(true);
    const rect = windowRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Handle window resizing
  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.x));
        const newY = Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragOffset.y));
        setPosition({ x: newX, y: newY });
      }
      
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newWidth = Math.max(600, Math.min(window.innerWidth - position.x, resizeStart.width + deltaX));
        const newHeight = Math.max(400, Math.min(window.innerHeight - position.y, resizeStart.height + deltaY));
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isDragging ? 'grabbing' : 'nw-resize';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
      };
    }
  }, [isDragging, isResizing, dragOffset, resizeStart, size, position]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeChat();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, closeChat]);

  // Prevent closing when clicking inside the window
  const handleWindowClick = (e) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div className="ai-chat-overlay" onClick={closeChat}>
      <div
        ref={windowRef}
        className="ai-chat-window glass-container-strong"
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height
        }}
        onClick={handleWindowClick}
      >
        {/* Header Bar */}
        <div
          ref={headerRef}
          className="ai-chat-header"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="ai-chat-header-info">
            <div className="header-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <path d="M8 10h.01"></path>
                <path d="M12 10h.01"></path>
                <path d="M16 10h.01"></path>
              </svg>
            </div>
            <div className="header-content">
              <span className="header-title">AI Chat Assistant</span>
              <span className="header-subtitle">
                {currentChat?.title || 'New Conversation'} • {selectedMode || 'Macro'}
              </span>
            </div>
          </div>
          
          <div className="ai-chat-header-actions">
            <button className="header-action-button" title="Minimize" onClick={(e) => e.stopPropagation()}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 15 11"></polyline>
              </svg>
            </button>
            
            <button className="header-action-button close-button" onClick={closeChat} title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="ai-chat-content">
          {/* Sidebar */}
          <AIChatSidebar />
          
          {/* Main Chat Area */}
          <div className="ai-chat-main">
            {/* Messages Area */}
            <div className="ai-chat-messages-container">
              <AIChatMessages />
            </div>
            
            {/* Bubble Buttons */}
            <div className="ai-chat-bubbles-container">
              <AIChatBubbles />
            </div>
            
            {/* Input Area */}
            <div className="ai-chat-input-container">
              <AIChatInput />
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          ref={resizeRef}
          className="resize-handle"
          onMouseDown={handleResizeMouseDown}
          style={{ cursor: isResizing ? 'nw-resize' : 'nw-resize' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default AIChatWindow; 