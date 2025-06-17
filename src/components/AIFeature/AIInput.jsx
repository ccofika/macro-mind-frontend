import React, { useState } from 'react';
import { useAI } from '../../context/AIContext';
import './AIFeature.css';

const AIInput = ({ cardId }) => {
  const [input, setInput] = useState('');
  const { loading, error, improveResponse } = useAI();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    console.log(`Submitting AI request for card ${cardId} with input: ${input}`);
    
    try {
      await improveResponse(cardId, input);
      setInput(''); // Očisti input nakon uspešnog slanja
    } catch (error) {
      console.error("Error submitting AI request:", error);
      // Greška će biti prikazana kroz error state u AIContext
    }
  };

  return (
    <div className="ai-input-container">
      <form onSubmit={handleSubmit}>
        <div className="ai-input-row">
          <span className="ai-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
          </span>
          <input
            type="text"
            className="ai-input"
            placeholder="Describe improvements needed..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            className="ai-submit-button" 
            disabled={loading || !input.trim()}
            title="Get AI improvements"
          >
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            )}
          </button>
        </div>
      </form>
      
      {error && <div className="ai-error">{error}</div>}
    </div>
  );
};

export default AIInput;