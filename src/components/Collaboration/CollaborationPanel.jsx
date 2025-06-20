import React, { useState, useRef, useEffect } from 'react';
import { useCollaboration } from '../../context/CollaborationContext';
import websocketService from '../../services/websocketService';
import InvitationModal from './InvitationModal';
import InvitationNotifications from './InvitationNotifications';
import './CollaborationPanel.css';

const CollaborationPanel = () => {
  const {
    spaces,
    currentSpace,
    activeUsers,
    currentUser,
    isConnected,
    joinSpace,
    leaveSpace,
    createSpace,
    updateSpace,
    deleteSpace
  } = useCollaboration();

  const [isVisible, setIsVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [invitationModalOpen, setInvitationModalOpen] = useState(false);
  const [selectedSpaceForInvitation, setSelectedSpaceForInvitation] = useState(null);
  const [activeTab, setActiveTab] = useState('spaces'); // 'spaces' or 'users'
  
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  // Handle mouse enter/leave for auto-hide functionality
  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 300); // 300ms delay before hiding
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Prevent wheel events from affecting canvas zoom when scrolling in panel
  useEffect(() => {
    const handleWheel = (e) => {
      e.stopPropagation();
    };

    if (panelRef.current && isVisible) {
      const scrollableElements = panelRef.current.querySelectorAll('.scrollable-content');
      
      scrollableElements.forEach(element => {
        element.addEventListener('wheel', handleWheel);
      });

      return () => {
        scrollableElements.forEach(element => {
          element.removeEventListener('wheel', handleWheel);
        });
      };
    }
  }, [isVisible]);

  // Space management functions
  const handleJoinSpace = (spaceId) => {
    joinSpace(spaceId);
  };

  const handleLeaveSpace = () => {
    if (currentSpace) {
      leaveSpace();
    }
  };

  const handleCreateSpace = async (e) => {
    e.preventDefault();
    
    if (!newSpaceName.trim()) return;
    
    try {
      await createSpace(newSpaceName, '', isPublic);
      setNewSpaceName('');
      setIsCreating(false);
      setIsPublic(false);
    } catch (error) {
      console.error('Failed to create space:', error);
    }
  };

  const handleUpdateSpace = async (e) => {
    e.preventDefault();
    
    if (!editingSpace || !editingSpace.name.trim()) return;
    
    try {
      await updateSpace(editingSpace.id, {
        name: editingSpace.name,
        isPublic: editingSpace.isPublic
      });
      setEditingSpace(null);
    } catch (error) {
      console.error('Failed to update space:', error);
    }
  };

  const handleDeleteSpace = async (spaceId) => {
    if (window.confirm('Are you sure you want to delete this space?')) {
      try {
        await deleteSpace(spaceId);
      } catch (error) {
        console.error('Failed to delete space:', error);
      }
    }
  };

  const startEditing = (space) => {
    setEditingSpace({
      id: space.id || space._id,
      name: space.name,
      isPublic: space.isPublic
    });
  };

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await websocketService.connect();
    } catch (error) {
      console.error('Reconnection failed:', error);
    } finally {
      setTimeout(() => setIsReconnecting(false), 2000);
    }
  };

  const handleInviteToSpace = (space) => {
    setSelectedSpaceForInvitation(space);
    setInvitationModalOpen(true);
  };

  const handleInvitationSent = (invitation) => {
    console.log('Invitation sent:', invitation);
    // Optionally show a success message or update UI
  };

  // Get active users count
  const activeUsersCount = activeUsers ? activeUsers.length : 0;

  if (!isConnected) {
    return (
      <>
        {/* Enhanced Trigger Zone */}
        <div 
          className="collaboration-trigger offline"
          ref={triggerRef}
          onMouseEnter={handleMouseEnter}
        >
          <div className="trigger-content">
            <div className="trigger-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="trigger-status offline">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Enhanced Offline Panel */}
        <div
          className={`collaboration-panel ${isVisible ? 'visible' : ''} offline`}
          ref={panelRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="panel-header">
            <div className="header-content">
              <div className="header-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>Collaboration</h3>
            </div>
            <div className="connection-status offline">
              <div className="status-indicator">
                <div className="status-dot offline"></div>
                <span className="status-text">Offline</span>
              </div>
            </div>
          </div>
          
          <div className="panel-content">
            <div className="connection-error-card">
              <div className="error-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div className="error-content">
                <h4>Connection Lost</h4>
                <p>Unable to connect to collaboration server</p>
                <button 
                  className={`reconnect-button ${isReconnecting ? 'reconnecting' : ''}`}
                  onClick={handleReconnect}
                  disabled={isReconnecting}
                >
                  {isReconnecting ? (
                    <>
                      <div className="reconnect-spinner"></div>
                      Reconnecting...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10"/>
                        <polyline points="1 20 1 14 7 14"/>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64l1.27 1.27A7 7 0 0 1 20.49 9Z"/>
                        <path d="M3.51 15A9 9 0 0 0 18.36 18.36l-1.27-1.27A7 7 0 0 1 3.51 15Z"/>
                      </svg>
                      Reconnect
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Enhanced Connected Trigger Zone */}
      <div 
        className="collaboration-trigger connected"
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
      >
        <div className="trigger-content">
          <div className="trigger-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          
          {/* Current Space Indicator */}
          {currentSpace && (
            <div className="current-space-indicator">
              {currentSpace.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          {/* Active Users Count */}
          <div className="users-count-indicator">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            </svg>
            <span className="count">{activeUsersCount}</span>
          </div>
        </div>
      </div>

      {/* Enhanced Connected Panel */}
      <div
        className={`collaboration-panel ${isVisible ? 'visible' : ''} connected`}
        ref={panelRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="panel-header">
          <div className="header-content">
            <div className="header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3>Collaboration</h3>
          </div>
          
          <div className="connection-status connected">
            <div className="status-indicator">
              <div className="status-dot connected"></div>
              <span className="status-text">Online</span>
            </div>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="panel-tabs">
          <button 
            className={`tab-button ${activeTab === 'spaces' ? 'active' : ''}`}
            onClick={() => setActiveTab('spaces')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
            <span>Spaces</span>
            <div className="tab-badge">{spaces.length}</div>
          </button>
          
          <button 
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Users</span>
            <div className="tab-badge">{activeUsersCount}</div>
          </button>
        </div>
        
        <div className="panel-content">
          {/* Invitation Notifications */}
          <InvitationNotifications />
          
          {/* Spaces Tab Content */}
          {activeTab === 'spaces' && (
            <div className="spaces-section">
              <div className="section-header">
                <h4 className="section-title">Collaborative Spaces</h4>
                <button 
                  className="create-space-button"
                  onClick={() => setIsCreating(!isCreating)}
                  title="Create new space"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>

              {/* Create Space Form */}
              {isCreating && (
                <div className="create-space-form-container">
                  <form className="create-space-form" onSubmit={handleCreateSpace}>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Space name"
                        value={newSpaceName}
                        onChange={(e) => setNewSpaceName(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        autoFocus
                        required
                      />
                    </div>
                    
                    <div className="space-options">
                      <label className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={isPublic}
                          onChange={() => setIsPublic(!isPublic)}
                        />
                        <div className="checkbox-indicator">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                        <span>Public space</span>
                      </label>
                    </div>
                    
                    <div className="form-actions">
                      <button type="button" className="cancel-button" onClick={() => setIsCreating(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="submit-button">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Create Space
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Spaces List */}
              <div className="scrollable-content spaces-list">
                {spaces.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                        <line x1="9" y1="9" x2="9.01" y2="9"/>
                        <line x1="15" y1="9" x2="15.01" y2="9"/>
                      </svg>
                    </div>
                    <h4>No Spaces Yet</h4>
                    <p>Create your first collaborative space to get started</p>
                  </div>
                ) : (
                  spaces.map(space => {
                    const spaceId = space.id || space._id;
                    const isActive = currentSpace?.id === spaceId || currentSpace?._id === spaceId;
                    
                    return (
                      <div 
                        key={spaceId} 
                        className={`space-item ${isActive ? 'active' : ''}`}
                      >
                        {editingSpace && editingSpace.id === spaceId ? (
                          <form className="edit-space-form" onSubmit={handleUpdateSpace}>
                            <div className="form-group">
                              <input
                                type="text"
                                value={editingSpace.name}
                                onChange={(e) => setEditingSpace({...editingSpace, name: e.target.value})}
                                onKeyDown={(e) => e.stopPropagation()}
                                autoFocus
                                required
                              />
                            </div>
                            
                            <div className="space-options">
                              <label className="checkbox-option">
                                <input
                                  type="checkbox"
                                  checked={editingSpace.isPublic}
                                  onChange={() => setEditingSpace({
                                    ...editingSpace, 
                                    isPublic: !editingSpace.isPublic
                                  })}
                                />
                                <div className="checkbox-indicator">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                </div>
                                <span>Public space</span>
                              </label>
                            </div>
                            
                            <div className="edit-actions">
                              <button type="button" className="cancel-button" onClick={() => setEditingSpace(null)}>
                                Cancel
                              </button>
                              <button type="submit" className="save-button">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                Save
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="space-info" onClick={() => handleJoinSpace(spaceId)}>
                              <div className="space-main">
                                <div className="space-icon">
                                  {isActive ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"/>
                                      <polyline points="8 12 12 16 16 12"/>
                                      <line x1="12" y1="8" x2="12" y2="16"/>
                                    </svg>
                                  ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"/>
                                      <polyline points="9 12 12 15 15 12"/>
                                    </svg>
                                  )}
                                </div>
                                <div className="space-details">
                                  <div className="space-name-and-meta">
                                    <h5 className="space-name">{space.name}</h5>
                                    <div className="space-meta">
                                      <span className={`visibility-badge ${space.isPublic ? 'public' : 'private'}`}>
                                        {space.isPublic ? 'Public' : 'Private'}
                                      </span>
                                      {isActive && <span className="current-badge">Current</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-actions">
                              {/* Show invite button for public spaces except the main public space */}
                              {space.isPublic && space.name !== 'Public Space' && space.name !== 'General' && space.name !== 'Main' && (
                                <button 
                                  className="action-button invite"
                                  onClick={() => handleInviteToSpace(space)}
                                  title="Invite users"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                    <circle cx="8.5" cy="7" r="4"/>
                                    <line x1="20" y1="8" x2="20" y2="14"/>
                                    <line x1="23" y1="11" x2="17" y2="11"/>
                                  </svg>
                                </button>
                              )}
                              
                              <button 
                                className="action-button edit"
                                onClick={() => startEditing(space)}
                                title="Edit space"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/>
                                </svg>
                              </button>
                              
                              <button 
                                className="action-button delete"
                                onClick={() => handleDeleteSpace(spaceId)}
                                title="Delete space"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18"/>
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                </svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
          
          {/* Users Tab Content */}
          {activeTab === 'users' && (
            <div className="users-section">
              <div className="section-header">
                <h4 className="section-title">Active Users</h4>
                <div className="users-count-badge">
                  {activeUsersCount}
                </div>
              </div>
              
              <div className="scrollable-content users-list">
                {activeUsersCount === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <h4>No Active Users</h4>
                    <p>Join a space to see who's collaborating</p>
                  </div>
                ) : (
                  activeUsers
                    .filter(user => user && user.id)
                    .map(user => (
                      <div 
                        key={user.id} 
                        className={`user-item ${user.id === currentUser?.id ? 'current-user' : ''}`}
                      >
                        <div 
                          className="user-avatar" 
                          style={{ 
                            backgroundColor: user.color || '#3B82F6'
                          }}
                        >
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="user-info">
                          <div className="user-name">
                            {user.name || 'Anonymous'}
                            {user.id === currentUser?.id && <span className="you-label">(You)</span>}
                          </div>
                          <div className="user-status">
                            <div className="online-indicator"></div>
                            <span>Online</span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invitation Modal */}
      {invitationModalOpen && (
        <InvitationModal
          isOpen={invitationModalOpen}
          onClose={() => setInvitationModalOpen(false)}
          space={selectedSpaceForInvitation}
          onInvitationSent={handleInvitationSent}
        />
      )}
    </>
  );
};

export default CollaborationPanel; 