import React, { useState, useEffect } from 'react';
import './NavBar.css';

const LinkEditor = ({ categoryId, link, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [action, setAction] = useState('open');
  
  // Initialize form with link data if editing
  useEffect(() => {
    if (link) {
      setName(link.name || '');
      setUrl(link.url || '');
      setAction(link.action || 'open');
    } else {
      setName('');
      setUrl('');
      setAction('open');
    }
  }, [link]);
  
  // Handle input key events to prevent shortcuts
  const handleInputKeyDown = (e) => {
    e.stopPropagation(); // Prevent keyboard shortcuts while typing
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim() || !url.trim()) {
      return;
    }
    
    onSave(categoryId, { name: name.trim(), url: url.trim(), action });
  };

  return (
    <div className="link-editor-overlay">
      <div className="link-editor">
        <div className="link-editor-header">
          <h3>{link ? 'Edit Link' : 'Add New Link'}</h3>
          <button className="close-button" onClick={onCancel}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="link-editor-form">
          <div className="form-group">
            <label htmlFor="link-name">Link Name:</label>
            <input
              id="link-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Enter link name"
              autoFocus
              required
              className="link-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="link-url">URL:</label>
            <input
              id="link-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="https://example.com"
              required
              className="link-input"
            />
          </div>
          
          <div className="form-group">
            <label>Action:</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="action"
                  value="open"
                  checked={action === 'open'}
                  onChange={() => setAction('open')}
                  onKeyDown={handleInputKeyDown}
                />
                <span className="radio-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15,3 21,3 21,9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </span>
                Open in new tab
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="action"
                  value="copy"
                  checked={action === 'copy'}
                  onChange={() => setAction('copy')}
                  onKeyDown={handleInputKeyDown}
                />
                <span className="radio-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="m5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </span>
                Copy to clipboard
              </label>
            </div>
          </div>
          
          <div className="form-buttons">
            <button type="button" className="cancel-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="save-button" disabled={!name.trim() || !url.trim()}>
              {link ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LinkEditor;