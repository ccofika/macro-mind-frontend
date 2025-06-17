import React, { useState, useEffect } from 'react';
import './NavBar.css';

const LinkEditor = ({ category, link, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [action, setAction] = useState('open');
  
  // Initialize form with link data if editing
  useEffect(() => {
    if (link) {
      setName(link.name || '');
      setUrl(link.url || '');
      setAction(link.action || 'open');
    }
  }, [link]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim() || !url.trim()) {
      return;
    }
    
    onSave(category, { name, url, action });
    
    // Reset form
    setName('');
    setUrl('');
    setAction('open');
  };
  
  const getCategoryDisplayName = () => {
    switch(category) {
      case 'stake': return 'Stake Pages';
      case 'crypto': return 'Crypto Explorers';
      case 'documents': return 'Documents';
      case 'excel': return 'Excel Tables';
      default: return category;
    }
  };

  return (
    <div className="link-editor">
      <h3>{link ? 'Edit Link' : 'Add New Link'}</h3>
      <div className="link-editor-category">
        Category: <strong>{getCategoryDisplayName()}</strong>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="link-name">Link Name:</label>
          <input
            id="link-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter link name"
            autoFocus
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="link-url">URL:</label>
          <input
            id="link-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Action:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="action"
                value="open"
                checked={action === 'open'}
                onChange={() => setAction('open')}
              />
              Open in new tab
            </label>
            <label>
              <input
                type="radio"
                name="action"
                value="copy"
                checked={action === 'copy'}
                onChange={() => setAction('copy')}
              />
              Copy to clipboard
            </label>
          </div>
        </div>
        
        <div className="form-buttons">
          <button type="button" className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="save-button">
            {link ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LinkEditor;