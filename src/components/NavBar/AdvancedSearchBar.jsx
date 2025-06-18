import React, { useState, useEffect, useRef, useCallback } from 'react';
import FlexSearch from 'flexsearch';
import './AdvancedSearchBar.css';
import { searchService } from '../../services/searchService';
import { useCanvas } from '../../context/CanvasContext';
import { useCards } from '../../context/CardContext';
import { useCollaboration } from '../../context/CollaborationContext';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const AdvancedSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(() => {
    return localStorage.getItem('searchMode') || 'current';
  });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [index, setIndex] = useState(null);
  
  const searchInputRef = useRef(null);
  const resultsRef = useRef(null);
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  const { currentSpace, navigateTo } = useCanvas();
  const { cards, setSelectedCardIds } = useCards();
  const { joinSpace } = useCollaboration();

  // Initialize FlexSearch index
  useEffect(() => {
    const searchIndex = new FlexSearch.Index({
      tokenize: 'forward',
      threshold: 2,
      resolution: 9,
      depth: 3
    });
    setIndex(searchIndex);
  }, []);

  // Build index when cards change
  useEffect(() => {
    if (index && cards && searchMode === 'current') {
      index.clear();
      cards.forEach(card => {
        const searchText = [
          card.category || '',
          card.title || '',
          card.question || '',
          card.answer || '',
          card.notes || ''
        ].join(' ').toLowerCase();
        
        index.add(card.id, searchText);
      });
    }
  }, [index, cards, searchMode]);

  // Save search mode preference
  useEffect(() => {
    localStorage.setItem('searchMode', searchMode);
  }, [searchMode]);

  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsDropdownVisible(false);
      return;
    }

    setIsLoading(true);
    setIsDropdownVisible(true);

    try {
      if (searchMode === 'current' && index && cards) {
        // Local search
        const searchResults = index.search(query.toLowerCase(), { limit: 20 });
        const results = searchResults
          .map(id => cards.find(card => card.id === id))
          .filter(Boolean)
          .map(card => {
            let score = 0;
            const queryLower = query.toLowerCase();
            
            // Category priority (highest)
            if (card.category && card.category.toLowerCase().includes(queryLower)) {
              score += 50;
            }
            
            // Title priority (high)
            if (card.title && card.title.toLowerCase().includes(queryLower)) {
              score += 30;
            }
            
            // Content priority (medium)
            const contentFields = [card.question, card.answer, card.notes].filter(Boolean);
            contentFields.forEach(field => {
              if (field.toLowerCase().includes(queryLower)) {
                score += 10;
              }
            });
            
            // Boost category cards
            if (card.category) {
              score += 30;
            }
            
            return { ...card, searchScore: score };
          })
          .sort((a, b) => b.searchScore - a.searchScore);

        setSearchResults(results);
      } else {
        // Global search via API
        const results = await searchService.searchCards(query, 'all');
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchMode, index, cards]);

  // Perform search when debounced query changes
  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const handleResultClick = useCallback(async (result) => {
    setSearchQuery('');
    setSearchResults([]);
    setIsDropdownVisible(false);
    setSelectedIndex(-1);
    
    if (result.spaceId && result.spaceId !== currentSpace?.id) {
      // Cross-space navigation
      try {
        console.log('Cross-space navigation: switching to space', result.spaceId);
        // First join the space
        joinSpace(result.spaceId);
        
        // Wait for space to load, then navigate to card position
        setTimeout(() => {
          if (result.position) {
            console.log('Navigating to card position:', result.position);
            navigateTo(result.position, 1.2); // Navigate with slight zoom
          }
        }, 1000); // Give time for space to load
      } catch (error) {
        console.error('Failed to navigate to space:', error);
      }
    } else {
      // Same space navigation - use the proper navigateTo function from CanvasContext
      if (result.position) {
        navigateTo(result.position, 1.2); // Navigate to card position with slight zoom
      }
    }
    
    // Highlight the card
    setSelectedCardIds([result.id]);
    setTimeout(() => setSelectedCardIds([]), 2000);
  }, [currentSpace, navigateTo, setSelectedCardIds, joinSpace]);

  const handleKeyDown = useCallback((e) => {
    if (!isDropdownVisible || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          handleResultClick(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSearchQuery('');
        setSearchResults([]);
        setIsDropdownVisible(false);
        setSelectedIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  }, [isDropdownVisible, searchResults, selectedIndex, handleResultClick]);

  const highlightMatch = (text, query) => {
    if (!text || !query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  const getCardTypeIcon = (card) => {
    switch (card.type) {
      case 'category':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        );
      case 'question':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12" y2="17"></line>
          </svg>
        );
      case 'answer':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
          </svg>
        );
    }
  };

  const toggleSearchMode = () => {
    const newMode = searchMode === 'current' ? 'all' : 'current';
    setSearchMode(newMode);
    if (debouncedQuery) {
      // Re-perform search with new mode
      performSearch(debouncedQuery);
    }
  };

  return (
    <div className="advanced-search-container">
      <div className="search-input-container">
        <svg 
          className="search-icon" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="M21 21l-4.35-4.35"></path>
        </svg>
        
        <input
          ref={searchInputRef}
          type="text"
          className="search-input"
          placeholder={`Search ${searchMode === 'current' ? 'current canvas' : 'all spaces'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchResults.length > 0) {
              setIsDropdownVisible(true);
            }
          }}
        />

        {/* Integrated Search Mode Toggle */}
        <button 
          className={`search-mode-toggle ${searchMode}`}
          onClick={toggleSearchMode}
          title={`Switch to ${searchMode === 'current' ? 'All Spaces' : 'Current Canvas'}`}
        >
          {searchMode === 'current' ? (
            <>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <path d="M21 15l-5-5L5 21"></path>
              </svg>
              <span>Canvas</span>
            </>
          ) : (
            <>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10,8 16,12 10,16 10,8"></polygon>
              </svg>
              <span>Global</span>
            </>
          )}
        </button>

        {isLoading && (
          <div className="search-loading">
            <svg 
              className="loading-spinner" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isDropdownVisible && (
        <div className="search-results-dropdown" ref={resultsRef}>
          {searchResults.length > 0 ? (
            <>
              <div className="search-results-header">
                <span className="results-count">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </span>
                <span className="search-mode-indicator">
                  {searchMode === 'current' ? 'Current Canvas' : 'All Spaces'}
                </span>
              </div>
              
              <div className="search-results-list">
                {searchResults.map((result, index) => (
                  <div
                    key={result.id}
                    className={`search-result-item ${selectedIndex === index ? 'selected' : ''}`}
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="result-icon">
                      {getCardTypeIcon(result)}
                    </div>
                    
                    <div className="result-content">
                      <div className="result-title">
                        <span 
                          dangerouslySetInnerHTML={{
                            __html: highlightMatch(result.title || result.question || 'Untitled', searchQuery)
                          }}
                        />
                        {result.category && (
                          <span className="result-category">
                            in {highlightMatch(result.category, searchQuery)}
                          </span>
                        )}
                      </div>
                      
                      {(result.answer || result.notes) && (
                        <div className="result-preview">
                          <span 
                            dangerouslySetInnerHTML={{
                              __html: highlightMatch(
                                (result.answer || result.notes || '').substring(0, 120) + 
                                (result.answer && result.answer.length > 120 ? '...' : ''),
                                searchQuery
                              )
                            }}
                          />
                        </div>
                      )}
                    </div>
                    
                    {result.spaceId !== currentSpace?.id && (
                      <div className="result-space-indicator">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="search-no-results">
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
              </svg>
              <p>No results found for "{searchQuery}"</p>
              <small>Try adjusting your search terms or switching search modes</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchBar; 