import React from 'react';
import { useAIChat, AI_MODES } from '../../context/AIChatContext';
import './AIChatBubbles.css';

const AIChatBubbles = () => {
  const { selectedMode, setSelectedMode } = useAIChat();

  const handleModeSelect = (modeId) => {
    setSelectedMode(modeId);
  };

  return (
    <div className="ai-chat-bubbles">
      <div className="bubbles-container">
        {Object.values(AI_MODES).map(mode => (
          <button
            key={mode.id}
            className={`bubble-button ${selectedMode === mode.id ? 'active' : ''} ${mode.primary ? 'primary' : ''}`}
            onClick={() => handleModeSelect(mode.id)}
            data-tooltip={mode.description}
          >
            <div className="bubble-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={mode.icon}></path>
              </svg>
            </div>
            <span className="bubble-name">{mode.name}</span>
            {mode.primary && <span className="bubble-badge">Default</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AIChatBubbles; 