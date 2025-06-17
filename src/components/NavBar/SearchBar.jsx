import React, { useState, useEffect, useRef } from 'react';
import { useCards } from '../../context/CardContext';
import { useCanvas } from '../../context/CanvasContext';
import './NavBar.css';

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const { cards } = useCards();
  const { canvasToScreen } = useCanvas();
  const searchRef = useRef(null);
  
  // Filter cards based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const results = cards.filter(card => {
      const titleMatch = card.title.toLowerCase().includes(term);
      const contentMatch = card.content && card.content.toLowerCase().includes(term);
      return titleMatch || contentMatch;
    }).slice(0, 10); // Limit to 10 results for performance
    
    setSearchResults(results);
  }, [searchTerm, cards]);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsResultsVisible(true);
  };
  
  // Handle clicking on a search result
  const handleResultClick = (cardId, position) => {
    // Find the card in state
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    // Center view on the card
    console.log("Navigate to card:", card);
    // Here would be the logic to center the canvas on the card position
    
    // Clear search
    setSearchTerm('');
    setIsResultsVisible(false);
  };
  
  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsResultsVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="search-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search cards..."
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setIsResultsVisible(true)}
        />
        {searchTerm && (
          <button 
            className="search-clear" 
            onClick={() => setSearchTerm('')}
          >
            ✕
          </button>
        )}
      </div>
      
      {isResultsVisible && searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map(card => (
            <div 
              key={card.id}
              className="search-result-item"
              onClick={() => handleResultClick(card.id, card.position)}
            >
              <div className="search-result-icon">
                {card.type === 'category' ? '📁' : '📄'}
              </div>
              <div className="search-result-content">
                <div className="search-result-title">{card.title}</div>
                {card.content && (
                  <div className="search-result-snippet">
                    {card.content.substring(0, 60)}...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {isResultsVisible && searchTerm && searchResults.length === 0 && (
        <div className="search-results">
          <div className="search-no-results">
            No results found for "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;