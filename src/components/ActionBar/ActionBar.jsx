import React, { useState, useContext } from 'react';
import { useCards } from '../../context/CardContext';
import { useAIChat } from '../../context/AIChatContext';
import './ActionBar.css';

const ActionBar = () => {
  const [showTooltip, setShowTooltip] = useState('');
  const { createCategoryCard, createAnswerCard, createLabelCard, connectMode, setConnectMode } = useCards();
  const { isOpen, openChat } = useAIChat();

  const handleCreateCategory = () => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    createCategoryCard('New Category', { x: centerX, y: centerY });
  };

  const handleCreateAnswer = () => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    createAnswerCard('New Answer', 'Enter your response here...', { x: centerX, y: centerY });
  };

  const handleCreateLabel = () => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    createLabelCard('New Label', { x: centerX, y: centerY });
  };

  const handleConnectMode = () => {
    // Toggle connect mode directly using the prop
    if (setConnectMode) {
      setConnectMode(prev => !prev);
    }
  };

  const handleOpenAIChat = () => {
    openChat();
  };

  return (
    <div className="action-bar">
      <button 
        className="action-button"
        onClick={handleCreateCategory}
        onMouseEnter={() => setShowTooltip('category')}
        onMouseLeave={() => setShowTooltip('')}
        title="New Category"
      >
        <svg 
          className="action-icon" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        {showTooltip === 'category' && <div className="tooltip">New Category</div>}
      </button>
      
      <button 
        className="action-button"
        onClick={handleCreateAnswer}
        onMouseEnter={() => setShowTooltip('answer')}
        onMouseLeave={() => setShowTooltip('')}
        title="New Answer"
      >
        <svg 
          className="action-icon" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10,9 9,9 8,9"></polyline>
        </svg>
        {showTooltip === 'answer' && <div className="tooltip">New Answer</div>}
      </button>

      <button 
        className="action-button"
        onClick={handleCreateLabel}
        onMouseEnter={() => setShowTooltip('label')}
        onMouseLeave={() => setShowTooltip('')}
        title="New Label"
      >
        <svg 
          className="action-icon" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"></path>
          <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7"></path>
          <path d="M8 12h8"></path>
        </svg>
        {showTooltip === 'label' && <div className="tooltip">New Label</div>}
      </button>
      
      <button 
        className={`action-button ${connectMode ? 'active' : ''}`}
        onClick={handleConnectMode}
        onMouseEnter={() => setShowTooltip('connect')}
        onMouseLeave={() => setShowTooltip('')}
        title="Connect Cards"
      >
        <svg 
          className="action-icon" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        {showTooltip === 'connect' && <div className="tooltip">Connect Cards</div>}
      </button>

      <button 
        className={`action-button ai-chat-button ${isOpen ? 'active' : ''}`}
        onClick={handleOpenAIChat}
        onMouseEnter={() => setShowTooltip('ai-chat')}
        onMouseLeave={() => setShowTooltip('')}
        title="AI Assistant"
      >
        <svg 
          className="action-icon" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M12 8V4l8 8-8 8v-4H4l8-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path>
        </svg>
        {showTooltip === 'ai-chat' && <div className="tooltip">AI Assistant</div>}
      </button>
    </div>
  );
};

export default ActionBar;