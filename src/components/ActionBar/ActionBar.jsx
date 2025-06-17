import React, { useState } from 'react';
import { useCards } from '../../context/CardContext';
import './ActionBar.css';

const ActionBar = ({ setConnectMode }) => {
  const [showTooltip, setShowTooltip] = useState('');
  const { createCategoryCard, createAnswerCard } = useCards();

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
      >
        <span className="action-icon">📁</span>
        {showTooltip === 'category' && <div className="tooltip">New Category</div>}
      </button>
      
      <button 
        className="action-button"
        onClick={handleCreateAnswer}
        onMouseEnter={() => setShowTooltip('answer')}
        onMouseLeave={() => setShowTooltip('')}
      >
        <span className="action-icon">📄</span>
        {showTooltip === 'answer' && <div className="tooltip">New Answer</div>}
      </button>
      
      <button 
        className="action-button"
        onClick={handleConnectMode}
        onMouseEnter={() => setShowTooltip('connect')}
        onMouseLeave={() => setShowTooltip('')}
      >
        <span className="action-icon">🔗</span>
        {showTooltip === 'connect' && <div className="tooltip">Connect Cards</div>}
      </button>
    </div>
  );
};

export default ActionBar;