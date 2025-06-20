import React, { useState, useRef, useEffect, useContext } from 'react';
import './NavBar.css';
import AdvancedSearchBar from './AdvancedSearchBar';
import LinkEditor from './LinkEditor';
import CategoryManager from './CategoryManager';
import ActionBar from '../ActionBar/ActionBar';
import AuthContext from '../../context/AuthContext';
import { 
  getUserNavPreferences, 
  updateNavCategories, 
  addNavLink, 
  updateNavLink, 
  deleteNavLink 
} from '../../services/userService';

const NavBar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [categories, setCategories] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stakePagesDomain, setStakePagesDomain] = useState('com');
  const [showStakeMoreDomains, setShowStakeMoreDomains] = useState(false);
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);
  const navRef = useRef(null);
  const timeoutRef = useRef(null);
  const { currentUser, logout } = useContext(AuthContext);
  
  // Stake domains configuration
  const stakeDomainsConfig = {
    'com': { url: 'stake.com', label: '.com' },
    'bet': { url: 'stake.bet', label: '.bet' },
    'ac': { url: 'stake.ac', label: '.ac' },
    'games': { url: 'stake.games', label: '.games' },
    'stakeru8.com': { url: 'stakeru8.com', label: 'stakeru8.com' },
    // More domains for "view more" section
    'pet': { url: 'stake.pet', label: '.pet' },
    'stake1001.com': { url: 'stake1001.com', label: 'stake1001.com' },
    'stake1002.com': { url: 'stake1002.com', label: 'stake1002.com' },
    'stake1003.com': { url: 'stake1003.com', label: 'stake1003.com' },
    'stake1021.com': { url: 'stake1021.com', label: 'stake1021.com' },
    'stake1022.com': { url: 'stake1022.com', label: 'stake1022.com' },
    'mba': { url: 'stake.mba', label: '.mba' },
    'jp': { url: 'stake.jp', label: '.jp' },
    'bz': { url: 'stake.bz', label: '.bz' },
    'staketr.com': { url: 'staketr.com', label: 'staketr.com' },
    'ceo': { url: 'stake.ceo', label: '.ceo' },
    'krd': { url: 'stake.krd', label: '.krd' }
  };
  
  const primaryDomains = ['com', 'bet', 'ac', 'games', 'stakeru8.com'];
  const moreDomains = ['pet', 'stake1001.com', 'stake1002.com', 'stake1003.com', 'stake1021.com', 'stake1022.com', 'mba', 'jp', 'bz', 'staketr.com', 'ceo', 'krd'];
  
  // Load user navigation preferences from backend
  useEffect(() => {
    if (currentUser) {
      loadNavPreferences();
    }
  }, [currentUser]);
  
  const loadNavPreferences = async () => {
    try {
      setLoading(true);
      const preferences = await getUserNavPreferences();
      setCategories(preferences.categories || []);
      setLinks(preferences.links || []);
    } catch (error) {
      console.error('Error loading nav preferences:', error);
      // Fallback to default categories if backend fails
      setCategories([
        { id: 'stake', name: 'Stake Pages', icon: 'document', isDefault: true },
        { id: 'crypto', name: 'Crypto Explorers', icon: 'link', isDefault: true },
        { id: 'documents', name: 'Documents', icon: 'document', isDefault: true },
        { id: 'excel', name: 'Excel Tables', icon: 'grid', isDefault: true }
      ]);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };
  
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
    // Don't auto-close if modal windows are open
    if (showLinkEditor || showCategoryManager || showStakeMoreDomains || showDomainDropdown) {
      return;
    }
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
      setShowLinkEditor(false);
      setShowDomainDropdown(false);
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

  // ESC key handler for closing More Domains panel
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && showStakeMoreDomains) {
        setShowStakeMoreDomains(false);
      }
    };

    if (showStakeMoreDomains) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showStakeMoreDomains]);

  // Click outside handler for domain dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDomainDropdown && !e.target.closest('.custom-domain-select')) {
        setShowDomainDropdown(false);
      }
    };

    if (showDomainDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDomainDropdown]);


  
  // Handle clicking on navigation item
  const handleNavItemClick = (item, categoryId) => {
    let finalUrl = item.url;
    
    // Special handling for Stake Pages domain switching
    if (categoryId === 'stake' && stakePagesDomain !== 'com') {
      const selectedDomainConfig = stakeDomainsConfig[stakePagesDomain];
      const originalDomainConfig = stakeDomainsConfig['com'];
      
      if (selectedDomainConfig && originalDomainConfig) {
        // Replace the original domain with the selected domain
        // This handles both stake.com -> stake.bet and stake.com -> stakeru8.com
        finalUrl = item.url.replace(originalDomainConfig.url, selectedDomainConfig.url);
      }
    }
    
    if (item.action === 'copy') {
      navigator.clipboard.writeText(finalUrl)
        .then(() => {
          // Show temporary toast or indicator
          const toast = document.createElement('div');
          toast.className = 'copy-toast';
          const domainText = categoryId === 'stake' && stakePagesDomain !== 'com' 
            ? `with ${stakeDomainsConfig[stakePagesDomain]?.label}` 
            : '';
          toast.textContent = `Link copied! ${domainText}`;
          document.body.appendChild(toast);
          
          setTimeout(() => {
            toast.remove();
          }, 2000);
        });
    } else if (item.action === 'open') {
      window.open(finalUrl, '_blank');
    }
  };
  
  // Add new link
  const handleAddLink = async (categoryId, linkData) => {
    try {
      const response = await addNavLink({ ...linkData, categoryId });
      await loadNavPreferences(); // Reload to get updated data
      setShowLinkEditor(false);
      // Optionally close dropdown after a delay when modal closes
      if (!showCategoryManager && !showStakeMoreDomains) {
        timeoutRef.current = setTimeout(() => {
          setIsExpanded(false);
        }, 2000); // Give user 2 seconds to interact with dropdown again
      }
    } catch (error) {
      console.error('Error adding link:', error);
      alert('Failed to add link. Please try again.');
    }
  };
  
  // Edit existing link
  const handleUpdateLink = async (linkId, linkData) => {
    try {
      await updateNavLink(linkId, linkData);
      await loadNavPreferences(); // Reload to get updated data
      setShowLinkEditor(false);
      setEditingLink(null);
      // Optionally close dropdown after a delay when modal closes
      if (!showCategoryManager && !showStakeMoreDomains) {
        timeoutRef.current = setTimeout(() => {
          setIsExpanded(false);
        }, 2000); // Give user 2 seconds to interact with dropdown again
      }
    } catch (error) {
      console.error('Error updating link:', error);
      alert('Failed to update link. Please try again.');
    }
  };
  
  // Delete link
  const handleDeleteLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to delete this link?')) {
      return;
    }
    
    try {
      await deleteNavLink(linkId);
      await loadNavPreferences(); // Reload to get updated data
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Failed to delete link. Please try again.');
    }
  };
  
  // Start editing a link
  const startEditingLink = (link) => {
    setEditingLink(link);
    setShowLinkEditor(true);
    // Clear any pending close timeout when opening modal
    clearTimeout(timeoutRef.current);
  };
  
  // Add new link button
  const handleAddLinkClick = (categoryId) => {
    setActiveCategory(categoryId);
    setEditingLink(null);
    setShowLinkEditor(true);
    // Clear any pending close timeout when opening modal
    clearTimeout(timeoutRef.current);
  };

  // Handle logout
  const handleLogout = (e) => {
    e.stopPropagation();
    logout();
  };

  // Update categories
  const handleUpdateCategories = async (updatedCategories) => {
    try {
      await updateNavCategories(updatedCategories);
      await loadNavPreferences(); // Reload to get updated data
      setShowCategoryManager(false);
      // Optionally close dropdown after a delay when modal closes
      if (!showLinkEditor && !showStakeMoreDomains) {
        timeoutRef.current = setTimeout(() => {
          setIsExpanded(false);
        }, 2000); // Give user 2 seconds to interact with dropdown again
      }
    } catch (error) {
      console.error('Error updating categories:', error);
      throw error; // Re-throw to let CategoryManager handle the error
    }
  };

  // Get icon display for category
  const getIconDisplay = (iconValue) => {
    const iconMap = {
      'document': '📄',
      'link': '🔗',
      'grid': '⚏',
      'folder': '📁',
      'star': '⭐',
      'tag': '🏷️',
      'bookmark': '🔖',
      'tool': '🔧'
    };
    return iconMap[iconValue] || '📁';
  };

  // Get links for a specific category
  const getCategoryLinks = (categoryId) => {
    return links.filter(link => link.categoryId === categoryId);
  };

  // Prevent keyboard shortcuts when typing in inputs
  const handleDropdownKeyDown = (e) => {
    // Stop propagation to prevent shortcuts
    e.stopPropagation();
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
          onKeyDown={handleDropdownKeyDown} // Prevent shortcuts in entire dropdown
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
          
          {/* Categories Management Button */}
          <div className="categories-management">
                         <button 
               className="manage-categories-button"
               onClick={() => {
                 setShowCategoryManager(true);
                 // Clear any pending close timeout when opening modal
                 clearTimeout(timeoutRef.current);
               }}
             >
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
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Manage Categories
            </button>
          </div>
          
          {/* Navigation categories */}
          {loading ? (
            <div className="navbar-loading">
              <div className="loading-spinner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
              </div>
              <span>Loading categories...</span>
            </div>
          ) : (
            <div className="navbar-categories">
              {categories.map(category => (
                <div 
                  key={category.id}
                  className={`navbar-category ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                >
                  <div className="category-header">
                    <span className="category-icon">{getIconDisplay(category.icon)}</span>
                    <span className="category-label">{category.name}</span>
                    
                    {/* Domain selector for Stake Pages */}
                    {category.id === 'stake' && (
                      <div className="stake-domain-selector">
                        <div className="custom-domain-select">
                          <button
                            className="domain-select-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDomainDropdown(!showDomainDropdown);
                            }}
                            onKeyDown={handleDropdownKeyDown}
                          >
                            <span>{stakeDomainsConfig[stakePagesDomain]?.label}</span>
                            <svg 
                              className={`dropdown-arrow ${showDomainDropdown ? 'rotated' : ''}`}
                              width="12" 
                              height="12" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2"
                            >
                              <polyline points="6,9 12,15 18,9"></polyline>
                            </svg>
                          </button>
                          
                          {showDomainDropdown && (
                            <div className="domain-dropdown-menu">
                              {primaryDomains.map(domain => (
                                <button
                                  key={domain}
                                  className={`domain-option ${stakePagesDomain === domain ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStakePagesDomain(domain);
                                    setShowDomainDropdown(false);
                                  }}
                                >
                                  {stakeDomainsConfig[domain].label}
                                </button>
                              ))}
                              <button
                                className="domain-option view-more"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowStakeMoreDomains(true);
                                  setShowDomainDropdown(false);
                                  // Clear any pending close timeout when opening modal
                                  clearTimeout(timeoutRef.current);
                                }}
                              >
                                View More →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <svg 
                      className={`category-toggle ${activeCategory === category.id ? 'rotated' : ''}`}
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
                  
                  {activeCategory === category.id && (
                    <div className="category-items">
                      {getCategoryLinks(category.id).map(link => (
                        <div key={link.id} className="nav-item-container">
                          <div 
                            className="nav-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavItemClick(link, category.id);
                            }}
                          >
                            <span className="item-bullet">•</span>
                            <span className="item-name">{link.name}</span>
                            <div className="nav-item-actions">
                              <button
                                className="nav-item-edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingLink(link);
                                }}
                                title="Edit link"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                              <button
                                className="nav-item-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLink(link.id);
                                }}
                                title="Delete link"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3,6 5,6 21,6"></polyline>
                                  <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add link button */}
                      <button 
                        className="add-link-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddLinkClick(category.id);
                        }}
                      >
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
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Link
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stake More Domains Panel */}
      {showStakeMoreDomains && (
        <div 
          className="stake-more-domains-overlay"
          onClick={(e) => {
            // Close if clicking on overlay (not on panel)
            if (e.target === e.currentTarget) {
              setShowStakeMoreDomains(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="domains-panel-title"
        >
          <div 
            className="stake-more-domains-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="stake-more-domains-header">
              <h3 id="domains-panel-title">All Stake Domains</h3>
              <button 
                className="close-button" 
                onClick={() => setShowStakeMoreDomains(false)}
                autoFocus
                aria-label="Close domains panel"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="stake-more-domains-content">
              <div className="domains-grid">
                {[...primaryDomains, ...moreDomains].map(domain => (
                  <button
                    key={domain}
                    className={`domain-button ${stakePagesDomain === domain ? 'active' : ''}`}
                    onClick={() => {
                      setStakePagesDomain(domain);
                      setShowStakeMoreDomains(false);
                    }}
                  >
                    <span className="domain-label">{stakeDomainsConfig[domain].label}</span>
                    <span className="domain-url">{stakeDomainsConfig[domain].url}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="stake-more-domains-footer">
              <div className="current-selection">
                Current: <strong>{stakeDomainsConfig[stakePagesDomain]?.label}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Editor Modal */}
      {showLinkEditor && (
        <LinkEditor
          categoryId={activeCategory}
          link={editingLink}
          onSave={editingLink ? 
            (categoryId, linkData) => handleUpdateLink(editingLink.id, linkData) :
            handleAddLink
          }
                               onCancel={() => {
            setShowLinkEditor(false);
            setEditingLink(null);
            // Optionally close dropdown after a delay when modal closes
            if (!showCategoryManager && !showStakeMoreDomains) {
              timeoutRef.current = setTimeout(() => {
                 setIsExpanded(false);
               }, 2000); // Give user 2 seconds to interact with dropdown again
             }
           }}
        />
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onUpdateCategories={handleUpdateCategories}
                               onClose={() => {
            setShowCategoryManager(false);
            // Optionally close dropdown after a delay when modal closes
            if (!showLinkEditor && !showStakeMoreDomains) {
              timeoutRef.current = setTimeout(() => {
                setIsExpanded(false);
              }, 2000); // Give user 2 seconds to interact with dropdown again
            }
          }}
        />
      )}
    </>
  );
};

export default NavBar;