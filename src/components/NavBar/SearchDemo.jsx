import React, { useState } from 'react';
import AdvancedSearchBar from './AdvancedSearchBar';
import './SearchDemo.css';

const SearchDemo = () => {
  const [demoCards] = useState([
    {
      id: '1',
      type: 'category',
      title: 'Project Planning',
      content: 'High-level project planning and roadmap discussions',
      position: { x: 100, y: 100 },
      spaceId: 'public'
    },
    {
      id: '2',
      type: 'answer',
      title: 'Meeting Notes',
      content: 'Weekly team meeting notes and action items',
      position: { x: 400, y: 200 },
      spaceId: 'public'
    },
    {
      id: '3',
      type: 'question',
      title: 'Technical Issues',
      content: 'List of technical challenges and potential solutions',
      position: { x: 700, y: 150 },
      spaceId: 'workspace-1'
    },
    {
      id: '4',
      type: 'category',
      title: 'Design System',
      content: 'UI components and design guidelines',
      position: { x: 200, y: 400 },
      spaceId: 'workspace-1'
    }
  ]);

  return (
    <div className="search-demo">
      <div className="demo-header">
        <h2>🔍 Advanced Search System Demo</h2>
        <p>Try searching for terms like "project", "meeting", "design", or "technical"</p>
      </div>
      
      <div className="demo-search-container">
        <AdvancedSearchBar />
      </div>
      
      <div className="demo-features">
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <h3>Smart Ranking</h3>
            <p>Priority ranking (Category → Title → Content)</p>
            <ul>
              <li>Fuzzy matching for typos</li>
              <li>Real-time results as you type</li>
            </ul>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </div>
            <h3>Global Search</h3>
            <p>Search across all your cards</p>
            <ul>
              <li>Filter by categories and types</li>
              <li>Jump to any card instantly</li>
            </ul>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h3>Lightning Fast</h3>
            <p>Instant search results</p>
            <ul>
              <li>Optimized for large datasets</li>
              <li>Smooth animations and transitions</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="demo-cards">
        <h3>Sample Cards (for testing)</h3>
        <div className="cards-grid">
          {demoCards.map(card => (
            <div key={card.id} className={`demo-card ${card.type}`}>
              <div className="card-header">
                <span className="card-icon">
                  {card.type === 'category' ? '📁' : 
                   card.type === 'answer' ? '💡' : 
                   card.type === 'question' ? '❓' : '📄'}
                </span>
                <span className="card-type">{card.type}</span>
              </div>
              <h4>{card.title}</h4>
              <p>{card.content}</p>
              <div className="card-meta">
                <span>Space: {card.spaceId === 'public' ? 'Public' : 'Workspace'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="demo-keyboard-shortcuts">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          Keyboard Shortcuts
        </h3>
        <div className="shortcuts-grid">
          <div className="shortcut">
            <kbd>↑</kbd><kbd>↓</kbd>
            <span>Navigate results</span>
          </div>
          <div className="shortcut">
            <kbd>Enter</kbd>
            <span>Select result</span>
          </div>
          <div className="shortcut">
            <kbd>Esc</kbd>
            <span>Close search</span>
          </div>
          <div className="shortcut">
            <kbd>Tab</kbd>
            <span>Toggle search mode</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchDemo; 