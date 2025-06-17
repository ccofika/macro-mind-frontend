import React, { useState, useRef, useEffect } from 'react';
import './NavBar.css';
import SearchBar from './SearchBar';
import LinkEditor from './LinkEditor';

const NavBar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [categoryLinks, setCategoryLinks] = useState({
    stake: [],
    crypto: [],
    documents: [],
    excel: []
  });
  const navRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Load saved links on component mount
  useEffect(() => {
    const savedLinks = localStorage.getItem('navLinks');
    if (savedLinks) {
      try {
        setCategoryLinks(JSON.parse(savedLinks));
      } catch (e) {
        console.error('Failed to parse saved links', e);
      }
    }
  }, []);
  
  // Save links when they change
  useEffect(() => {
    localStorage.setItem('navLinks', JSON.stringify(categoryLinks));
  }, [categoryLinks]);
  
  // Handle manual expand/collapse
  const toggleNavBar = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Handle hover events for auto-expand/collapse
  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setIsExpanded(true);
  };
  
  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
      setShowLinkEditor(false);
    }, 500); // 500ms delay before collapsing
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Handle clicking on navigation item
  const handleNavItemClick = (item) => {
    if (item.action === 'copy') {
      navigator.clipboard.writeText(item.url)
        .then(() => {
          // Show temporary toast or indicator
          const toast = document.createElement('div');
          toast.className = 'copy-toast';
          toast.textContent = 'Link copied!';
          document.body.appendChild(toast);
          
          setTimeout(() => {
            toast.remove();
          }, 2000);
        });
    } else if (item.action === 'open') {
      window.open(item.url, '_blank');
    }
  };
  
  // Add new link
  const addLink = (category, linkData) => {
    setCategoryLinks(prev => ({
      ...prev,
      [category]: [...prev[category], { 
        ...linkData,
        id: Date.now().toString()
      }]
    }));
    setShowLinkEditor(false);
  };
  
  // Edit existing link
  const updateLink = (category, linkId, linkData) => {
    setCategoryLinks(prev => ({
      ...prev,
      [category]: prev[category].map(link => 
        link.id === linkId ? { ...link, ...linkData } : link
      )
    }));
    setShowLinkEditor(false);
    setEditingLink(null);
  };
  
  // Delete link
  const deleteLink = (category, linkId) => {
    setCategoryLinks(prev => ({
      ...prev,
      [category]: prev[category].filter(link => link.id !== linkId)
    }));
  };
  
  // Start editing a link
  const startEditingLink = (category, link) => {
    setEditingLink({ category, link });
    setShowLinkEditor(true);
  };
  
  // Add new link button
  const handleAddLink = (category) => {
    setActiveCategory(category);
    setEditingLink({ category, link: null });
    setShowLinkEditor(true);
  };

  return (
    <div 
      className={`navbar ${isExpanded ? 'expanded' : 'collapsed'}`}
      ref={navRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="navbar-toggle" onClick={toggleNavBar}>
        {isExpanded ? '◀' : '🔍'}
      </div>
      
      {isExpanded && (
        <div className="navbar-content">
          <SearchBar />
          
          {showLinkEditor && (
            <LinkEditor 
              category={editingLink?.category} 
              link={editingLink?.link}
              onSave={(category, linkData) => {
                if (editingLink?.link) {
                  updateLink(category, editingLink.link.id, linkData);
                } else {
                  addLink(category, linkData);
                }
              }}
              onCancel={() => {
                setShowLinkEditor(false);
                setEditingLink(null);
              }}
            />
          )}
          
          {!showLinkEditor && (
            <div className="navbar-categories">
              <div 
                className={`navbar-category ${activeCategory === 'stake' ? 'active' : ''}`}
                onClick={() => setActiveCategory(activeCategory === 'stake' ? null : 'stake')}
              >
                <div className="category-header">
                  <span className="category-icon">📑</span>
                  <span className="category-label">Stake Pages</span>
                  <span className="category-toggle">{activeCategory === 'stake' ? '▼' : '▶'}</span>
                </div>
                
                {activeCategory === 'stake' && (
                  <div className="category-items">
                    {categoryLinks.stake.map(item => (
                      <div key={item.id} className="nav-item-container">
                        <div 
                          className="nav-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavItemClick(item);
                          }}
                        >
                          <span className="item-bullet">•</span>
                          {item.name}
                          <span className="item-action-icon">
                            {item.action === 'copy' ? '📋' : '🔗'}
                          </span>
                        </div>
                        <div className="nav-item-actions">
                          <button
                            className="nav-item-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingLink('stake', item);
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            className="nav-item-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLink('stake', item.id);
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    <button 
                      className="add-link-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddLink('stake');
                      }}
                    >
                      + Add Link
                    </button>
                  </div>
                )}
              </div>
              
              <div 
                className={`navbar-category ${activeCategory === 'crypto' ? 'active' : ''}`}
                onClick={() => setActiveCategory(activeCategory === 'crypto' ? null : 'crypto')}
              >
                <div className="category-header">
                  <span className="category-icon">🔗</span>
                  <span className="category-label">Crypto Explorers</span>
                  <span className="category-toggle">{activeCategory === 'crypto' ? '▼' : '▶'}</span>
                </div>
                
                {activeCategory === 'crypto' && (
                  <div className="category-items">
                    {categoryLinks.crypto.map(item => (
                      <div key={item.id} className="nav-item-container">
                        <div 
                          className="nav-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavItemClick(item);
                          }}
                        >
                          <span className="item-bullet">•</span>
                          {item.name}
                          <span className="item-action-icon">
                            {item.action === 'copy' ? '📋' : '🔗'}
                          </span>
                        </div>
                        <div className="nav-item-actions">
                          <button
                            className="nav-item-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingLink('crypto', item);
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            className="nav-item-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLink('crypto', item.id);
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    <button 
                      className="add-link-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddLink('crypto');
                      }}
                    >
                      + Add Link
                    </button>
                  </div>
                )}
              </div>
              
              <div 
                className={`navbar-category ${activeCategory === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveCategory(activeCategory === 'documents' ? null : 'documents')}
              >
                <div className="category-header">
                  <span className="category-icon">📄</span>
                  <span className="category-label">Documents</span>
                  <span className="category-toggle">{activeCategory === 'documents' ? '▼' : '▶'}</span>
                </div>
                
                {activeCategory === 'documents' && (
                  <div className="category-items">
                    {categoryLinks.documents.map(item => (
                      <div key={item.id} className="nav-item-container">
                        <div 
                          className="nav-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavItemClick(item);
                          }}
                        >
                          <span className="item-bullet">•</span>
                          {item.name}
                          <span className="item-action-icon">
                            {item.action === 'copy' ? '📋' : '🔗'}
                          </span>
                        </div>
                        <div className="nav-item-actions">
                          <button
                            className="nav-item-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingLink('documents', item);
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            className="nav-item-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLink('documents', item.id);
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    <button 
                      className="add-link-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddLink('documents');
                      }}
                    >
                      + Add Link
                    </button>
                  </div>
                )}
              </div>
              
              <div 
                className={`navbar-category ${activeCategory === 'excel' ? 'active' : ''}`}
                onClick={() => setActiveCategory(activeCategory === 'excel' ? null : 'excel')}
              >
                <div className="category-header">
                  <span className="category-icon">📊</span>
                  <span className="category-label">Excel Tables</span>
                  <span className="category-toggle">{activeCategory === 'excel' ? '▼' : '▶'}</span>
                </div>
                
                {activeCategory === 'excel' && (
                  <div className="category-items">
                    {categoryLinks.excel.map(item => (
                      <div key={item.id} className="nav-item-container">
                        <div 
                          className="nav-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavItemClick(item);
                          }}
                        >
                          <span className="item-bullet">•</span>
                          {item.name}
                          <span className="item-action-icon">
                            {item.action === 'copy' ? '📋' : '🔗'}
                          </span>
                        </div>
                        <div className="nav-item-actions">
                          <button
                            className="nav-item-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingLink('excel', item);
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            className="nav-item-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLink('excel', item.id);
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    <button 
                      className="add-link-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddLink('excel');
                      }}
                    >
                      + Add Link
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NavBar;