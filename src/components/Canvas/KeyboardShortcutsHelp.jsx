import React, { useState, useEffect } from 'react';
import { isInputFieldActive } from '../../utils/keyboardUtils';
import './KeyboardShortcutsHelp.css';

const KeyboardShortcutsHelp = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Toggle visibility with '?' key
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip shortcuts if any input field is active
      if (isInputFieldActive()) {
        return;
      }
      
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        setIsVisible(prev => !prev);
      }
      
      // Also hide when Escape is pressed
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);
  
  // Hide after a timeout when first loaded
  useEffect(() => {
    // Show briefly on first load
    setIsVisible(true);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!isVisible) {
    return (
      <button 
        className="shortcuts-help-button" 
        onClick={() => setIsVisible(true)}
        title="Show Keyboard Shortcuts"
      >
        ?
      </button>
    );
  }
  
  return (
    <div className="shortcuts-help-overlay">
      <div className="shortcuts-help-content">
        <div className="shortcuts-help-header">
          <h3>Keyboard Shortcuts</h3>
          <button onClick={() => setIsVisible(false)}>×</button>
        </div>
        
        <div className="shortcuts-help-section">
          <h4>Navigation</h4>
          <div className="shortcuts-help-grid">
            <div className="shortcut">
              <span className="key">Drag</span>
              <span className="description">Pan the canvas</span>
            </div>
            <div className="shortcut">
              <span className="key">Scroll</span>
              <span className="description">Zoom in/out</span>
            </div>
            <div className="shortcut">
              <span className="key">m</span>
              <span className="description">Toggle mini-map</span>
            </div>
            <div className="shortcut">
              <span className="key">p</span>
              <span className="description">Toggle offscreen pointers</span>
            </div>
          </div>
        </div>
        
        <div className="shortcuts-help-section">
          <h4>Cards</h4>
          <div className="shortcuts-help-grid">
            <div className="shortcut">
              <span className="key">Double-click</span>
              <span className="description">Create new category</span>
            </div>
            <div className="shortcut">
              <span className="key">c</span>
              <span className="description">Toggle connect mode</span>
            </div>
            <div className="shortcut">
              <span className="key">Del</span>
              <span className="description">Delete selected card(s)</span>
            </div>
          </div>
        </div>
        
        <div className="shortcuts-help-section">
          <h4>Performance</h4>
          <div className="shortcuts-help-grid">
            <div className="shortcut">
              <span className="key">h</span>
              <span className="description">High performance mode</span>
            </div>
          </div>
        </div>
        
        <div className="shortcuts-help-footer">
          <span>Press <strong>?</strong> to toggle this help</span>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp; 