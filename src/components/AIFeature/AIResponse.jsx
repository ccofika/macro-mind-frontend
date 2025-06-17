import React, { useState } from 'react';
import { useAI } from '../../context/AIContext';
import './AIFeature.css';

const AIResponse = ({ response, cardPosition }) => {
  const { createCardFromAIResponse } = useAI();
  const [isCopied, setIsCopied] = useState(false);

  // Očisti AI odgovor od potencijalnih meta-oznaka
  const cleanResponse = (text) => {
    if (!text) return '';
    
    return text
      .replace(/\[Note: The AI service is currently unavailable.*?\]/g, '')
      .replace(/\[This is a fallback response.*?\]/g, '')
      .replace(/IMPROVED VERSION:\s*/g, '')
      .trim();
  };

  // Copy AI response to clipboard
  const handleCopy = () => {
    const cleanedResponse = cleanResponse(response);
    navigator.clipboard.writeText(cleanedResponse)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500);
      })
      .catch((err) => {
        console.error('Failed to copy AI response:', err);
      });
  };

  // Create card from AI response
  const handleCreateCard = () => {
    // Izračunaj poziciju nove kartice - malo offsetovano u odnosu na originalnu
    const newPosition = {
      x: cardPosition.x + 80,
      y: cardPosition.y + 100
    };
    
    createCardFromAIResponse(newPosition);
  };

  return (
    <div className="ai-response">
      <div className="ai-response-header">
        <span className="ai-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
        </span>
        <span>AI Improved Response</span>
        
        <div className="ai-response-actions">
          <button 
            className={`ai-copy-button ${isCopied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Copy AI response"
          >
            {isCopied ? (
              <svg className="copy-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
          </button>
          
          <button 
            className="create-card-button" 
            onClick={handleCreateCard}
            title="Create new card from this response"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="ai-response-content">
        {response ? cleanResponse(response) : "No AI response available"}
      </div>
    </div>
  );
};

export default AIResponse;