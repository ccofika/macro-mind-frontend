import React, { useState, useRef, useEffect, useContext } from 'react';
import './NavBar.css';
import AdvancedSearchBar from './AdvancedSearchBar';
import LinkEditor from './LinkEditor';
import ActionBar from '../ActionBar/ActionBar';
import AuthContext from '../../context/AuthContext';

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
  const { currentUser, logout } = useContext(AuthContext);
  
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

  // Handle logout
  const handleLogout = (e) => {
    e.stopPropagation();
    logout();
  };

  return (
    <>
      {/* Main Top Bar with 3-Section Layout */}
      <div className="navbar-top-container">
        {/* GREEN SECTION - Collapsible Dropdown Menu */}
        <div className="navbar-section-green">
          <div 
            className={`navbar-dropdown-toggle ${isExpanded ? 'expanded' : 'collapsed'}`}
            onClick={toggleNavBar}
            onMouseEnter={handleMouseEnter}
          >
            <svg 
              className="dropdown-icon" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </div>
        </div>

        {/* BLUE SECTION - Main Search Bar */}
        <div className="navbar-section-blue">
          <AdvancedSearchBar />
        </div>

        {/* YELLOW SECTION - Existing ActionBar */}
        <div className="navbar-section-yellow">
          <ActionBar />
        </div>
      </div>

      {/* Dropdown Menu Content (when expanded) */}
      {isExpanded && (
        <div 
          className="navbar-dropdown-content"
          ref={navRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* User info section */}
          <div className="user-info">
            <div className="user-avatar">
              {currentUser?.picture ? (
                <img src={currentUser.picture} alt="Profile" />
              ) : (
                <span>{currentUser?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="user-details">
              <div className="user-name">{currentUser?.name || 'User'}</div>
              <div className="user-email">{currentUser?.email}</div>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
          
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
                  <svg 
                    className="category-icon" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                  </svg>
                  <span className="category-label">Stake Pages</span>
                  <svg 
                    className={`category-toggle ${activeCategory === 'stake' ? 'rotated' : ''}`}
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
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
                          <svg 
                            className="item-action-icon"
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            {item.action === 'copy' ? (
                              <>
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="m5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </>
                            ) : (
                              <>
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                              </>
                            )}
                          </svg>
                        </div>
                        <div className="nav-item-actions">
                          <button
                            className="nav-item-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingLink('stake', item);
                            }}
                          >
                            <svg 
                              width="12" 
                              height="12" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="m18 2 4 4-6 6H4v-4l10-6z"></path>
                              <path d="m14.5 5.5-3 3"></path>
                            </svg>
                          </button>
                          <button
                            className="nav-item-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLink('stake', item.id);
                            }}
                          >
                            <svg 
                              width="12" 
                              height="12" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <polyline points="3,6 5,6 21,6"></polyline>
                              <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
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
                      <svg 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Add Link
                    </button>
                  </div>
                )}
              </div>
              
              <div 
                className={`navbar-category ${activeCategory === 'crypto' ? 'active' : ''}`}
                onClick={() => setActiveCategory(activeCategory === 'crypto' ? null : 'crypto')}
              >
                <div className="category-header">
                  <svg 
                    className="category-icon" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  <span className="category-label">Crypto Explorers</span>
                  <svg 
                    className={`category-toggle ${activeCategory === 'crypto' ? 'rotated' : ''}`}
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
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
                          <svg 
                            className="item-action-icon"
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            {item.action === 'copy' ? (
                              <>
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="m5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </>
                            ) : (
                              <>
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                              </>
                            )}
                          </svg>
                        </div>
                        <div className="nav-item-actions">
                          <button
                            className="nav-item-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingLink('crypto', item);
                            }}
                          >
                            <svg 
                              width="12" 
                              height="12" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="m18 2 4 4-6 6H4v-4l10-6z"></path>
                              <path d="m14.5 5.5-3 3"></path>
                            </svg>
                          </button>
                          <button
                            className="nav-item-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLink('crypto', item.id);
                            }}
                          >
                            <svg 
                              width="12" 
                              height="12" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <polyline points="3,6 5,6 21,6"></polyline>
                              <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
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
                      <svg 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Add Link
                    </button>
                  </div>
                )}
              </div>
              
              <div 
                className={`navbar-category ${activeCategory === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveCategory(activeCategory === 'documents' ? null : 'documents')}
              >
                <div className="category-header">
                  <svg 
                    className="category-icon" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13,2 13,9 20,9"></polyline>
                  </svg>
                  <span className="category-label">Documents</span>
                  <svg 
                    className={`category-toggle ${activeCategory === 'documents' ? 'rotated' : ''}`}
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
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
                          <svg 
                            className="item-action-icon"
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            {item.action === 'copy' ? (
                              <>
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="m5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </>
                            ) : (
                              <>
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                              </>
                            )}
                          </svg>
                        </div>
                        <div className="nav-item-actions">
                          <button
                            className="nav-item-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingLink('documents', item);
                            }}
                          >
                            <svg 
                              width="12" 
                              height="12" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="m18 2 4 4-6 6H4v-4l10-6z"></path>
                              <path d="m14.5 5.5-3 3"></path>
                            </svg>
                          </button>
                          <button
                            className="nav-item-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLink('documents', item.id);
                            }}
                          >
                            <svg 
                              width="12" 
                              height="12" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <polyline points="3,6 5,6 21,6"></polyline>
                              <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
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
                      <svg 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Add Link
                    </button>
                  </div>
                )}
              </div>
              
              <div 
                className={`navbar-category ${activeCategory === 'excel' ? 'active' : ''}`}
                onClick={() => setActiveCategory(activeCategory === 'excel' ? null : 'excel')}
              >
                <div className="category-header">
                  <svg 
                    className="category-icon" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <span className="category-label">Excel Tables</span>
                  <svg 
                    className={`category-toggle ${activeCategory === 'excel' ? 'rotated' : ''}`}
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
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
                          <svg 
                            className="item-action-icon"
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            {item.action === 'copy' ? (
                              <>
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="m5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </>
                            ) : (
                              <>
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                              </>
                            )}
                          </svg>
                        </div>
                        <div className="nav-item-actions">
                          <button
                            className="nav-item-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingLink('excel', item);
                            }}
                          >
                            <svg 
                              width="12" 
                              height="12" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="m18 2 4 4-6 6H4v-4l10-6z"></path>
                              <path d="m14.5 5.5-3 3"></path>
                            </svg>
                          </button>
                          <button
                            className="nav-item-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLink('excel', item.id);
                            }}
                          >
                            <svg 
                              width="12" 
                              height="12" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <polyline points="3,6 5,6 21,6"></polyline>
                              <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
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
                      <svg 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Add Link
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default NavBar;