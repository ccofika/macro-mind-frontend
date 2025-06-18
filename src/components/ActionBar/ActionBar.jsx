import React, { useState } from 'react';
import { useCards } from '../../context/CardContext';
import './ActionBar.css';

const ActionBar = () => {
  const [showTooltip, setShowTooltip] = useState('');
  const { createCategoryCard, createAnswerCard, connectMode, setConnectMode } = useCards();

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

  const handleConnectMode = () => {
    // Toggle connect mode directly using the prop
    if (setConnectMode) {
      setConnectMode(prev => !prev);
    }
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
    </div>
  );
};

export default ActionBar;