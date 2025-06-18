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
            <div className="feature-icon">📍</div>
            <h3>Local Canvas Search</h3>
            <p>Search within the current workspace with real-time results and fuzzy matching</p>
            <ul>
              <li>FlexSearch-powered indexing</li>
              <li>Priority ranking (Category → Title → Content)</li>
              <li>Debounced search-as-you-type</li>
            </ul>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3>Global Space Search</h3>
            <p>Search across all accessible spaces with cross-space navigation</p>
            <ul>
              <li>Backend API with relevance scoring</li>
              <li>Permission-aware search results</li>
              <li>Automatic space switching</li>
            </ul>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">✨</div>
            <h3>Modern UI/UX</h3>
            <p>Glassmorphism design with smooth interactions</p>
            <ul>
              <li>Backdrop blur effects</li>
              <li>Keyboard navigation support</li>
              <li>Highlighted search matches</li>
            </ul>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Performance Optimized</h3>
            <p>Efficient search with caching and optimization</p>
            <ul>
              <li>300ms debouncing</li>
              <li>Result caching</li>
              <li>Lazy loading</li>
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
        <h3>⌨️ Keyboard Shortcuts</h3>
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