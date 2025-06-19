import React, { useState, useRef, useEffect } from 'react';
import { useCollaboration } from '../../context/CollaborationContext';
import websocketService from '../../services/websocketService';
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
      const scrollableElements = panelRef.current.querySelectorAll('.spaces-list, .users-list');
      
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

  if (!isConnected) {
    return (
      <>
        {/* Trigger Zone */}
        <div 
          className="collaboration-trigger offline"
          ref={triggerRef}
          onMouseEnter={handleMouseEnter}
        >
          <div className="trigger-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
          <div className="trigger-status offline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
        </div>

        {/* Panel */}
        <div
          className={`collaboration-panel ${isVisible ? 'visible' : ''} offline`}
          ref={panelRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="panel-header">
            <h3>Collaborative Spaces</h3>
            <div className="connection-indicator offline">
              <span className="status-dot"></span>
              <span>Offline</span>
            </div>
          </div>
          
          <div className="panel-content">
            <div className="connection-error">
              <span className="error-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </span>
              <p>Not connected to collaboration server</p>
              <button 
                className={`reconnect-button ${isReconnecting ? 'reconnecting' : ''}`}
                onClick={handleReconnect}
                disabled={isReconnecting}
              >
                {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Trigger Zone */}
      <div 
        className="collaboration-trigger"
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
      >
        <div className="trigger-icon">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
        <div className="trigger-status">
          {currentSpace && <div className="current-space-indicator">{currentSpace.name.substring(0, 1)}</div>}
          {activeUsers.length > 0 && <div className="users-count">{activeUsers.length}</div>}
        </div>
      </div>

      {/* Panel */}
      <div
        className={`collaboration-panel ${isVisible ? 'visible' : ''}`}
        ref={panelRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="panel-header">
          <h3>Collaborative Spaces</h3>
          <div className="connection-indicator">
            <span className="status-dot"></span>
            <span>Online</span>
          </div>
        </div>
        
        <div className="panel-content">
          {/* Spaces Section */}
          <div className="spaces-section">
            <div className="section-header">
              <span className="section-title">Spaces</span>
              <button 
                className="create-space-button" 
                onClick={() => setIsCreating(!isCreating)}
                title="Create New Space"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>

            {isCreating && (
              <form className="create-space-form" onSubmit={handleCreateSpace}>
                <input
                  type="text"
                  placeholder="Space name..."
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  autoFocus
                />
                <div className="space-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Public space
                  </label>
                </div>
                <button type="submit" className="submit-button">Create Space</button>
              </form>
            )}

            {spaces.length > 0 ? (
              <div className="spaces-list">
                {spaces.map(space => (
                  <div key={space._id} className={`space-item ${currentSpace?._id === space._id ? 'active' : ''}`}>
                    <div className="space-info" onClick={() => handleJoinSpace(space._id)}>
                      <div className="space-main">
                        <span className="space-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                            <line x1="9" y1="9" x2="9.01" y2="9"/>
                            <line x1="15" y1="9" x2="15.01" y2="9"/>
                          </svg>
                        </span>
                        <div className="space-details">
                          <div className="space-name-and-meta">
                            <span className="space-name">{space.name}</span>
                            <div className="space-meta">
                              <span className={`visibility-badge ${space.isPublic ? 'public' : 'private'}`}>
                                {space.isPublic ? 'Public' : 'Private'}
                              </span>
                              {currentSpace?._id === space._id && (
                                <span className="current-badge">Current</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {space.createdBy === currentUser?.id && (
                      <div className="space-actions">
                        {editingSpace === space._id ? (
                          <form className="edit-space-form" onSubmit={(e) => handleUpdateSpace(e, space._id)}>
                            <input
                              type="text"
                              defaultValue={space.name}
                              autoFocus
                            />
                            <div className="edit-actions">
                              <button type="submit" className="save-button">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              </button>
                              <button 
                                type="button" 
                                className="cancel-button"
                                onClick={() => setEditingSpace(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <button 
                              className="action-button edit" 
                              onClick={() => setEditingSpace(space._id)}
                              title="Edit Space"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button 
                              className="action-button delete" 
                              onClick={() => handleDeleteSpace(space._id)}
                              title="Delete Space"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                </span>
                <p>No spaces available</p>
                <small>Create your first space to start collaborating</small>
              </div>
            )}
          </div>

          {/* Active Users Section */}
          <div className="users-section">
            <div className="section-header">
              <span className="section-title">Active Users</span>
              {activeUsers.length > 0 && (
                <span className="users-count-badge">{activeUsers.length}</span>
              )}
            </div>

            <div className="users-list">
              {activeUsers.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">👤</span>
                  <p>No other users active</p>
                </div>
              ) : (
                activeUsers.map(user => (
                  <div 
                    key={user.id} 
                    className={`user-item ${user.id === currentUser?.id ? 'current-user' : ''}`}
                  >
                    <div 
                      className="user-avatar" 
                      style={{ backgroundColor: user.color }}
                    >
                      {user.username.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <div className="user-name">
                        {user.username}
                        {user.id === currentUser?.id && <span className="you-label">(You)</span>}
                      </div>
                      <div className="user-status">
                        <span className="online-indicator"></span>
                        <span>Online</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CollaborationPanel; 