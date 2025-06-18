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
          <div className="trigger-icon">→</div>
          <div className="trigger-status offline">⚠️</div>
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
              <span className="error-icon">⚠️</span>
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
        <div className="trigger-icon">→</div>
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
              >
                {isCreating ? '✕' : '+'}
              </button>
            </div>

            {isCreating && (
              <form className="create-space-form" onSubmit={handleCreateSpace}>
                <input
                  type="text"
                  placeholder="Space name"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  autoFocus
                />
                <div className="space-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={() => setIsPublic(!isPublic)}
                    />
                    <span className="checkmark"></span>
                    Public space
                  </label>
                </div>
                <button type="submit" className="submit-button">Create Space</button>
              </form>
            )}

            <div className="spaces-list">
              {spaces.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🌐</span>
                  <p>No spaces available</p>
                  <small>Create a space to collaborate</small>
                </div>
              ) : (
                spaces.map(space => {
                  const spaceId = space.id || space._id;
                  return (
                    <div 
                      key={spaceId} 
                      className={`space-item ${currentSpace?.id === spaceId ? 'active' : ''}`}
                    >
                      {editingSpace && editingSpace.id === spaceId ? (
                        <form className="edit-space-form" onSubmit={handleUpdateSpace}>
                          <input
                            type="text"
                            value={editingSpace.name}
                            onChange={(e) => setEditingSpace({...editingSpace, name: e.target.value})}
                            autoFocus
                          />
                          <div className="space-options">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={editingSpace.isPublic}
                                onChange={() => setEditingSpace({
                                  ...editingSpace, 
                                  isPublic: !editingSpace.isPublic
                                })}
                              />
                              <span className="checkmark"></span>
                              Public
                            </label>
                          </div>
                          <div className="edit-actions">
                            <button type="submit" className="save-button">✓</button>
                            <button 
                              type="button" 
                              className="cancel-button"
                              onClick={() => setEditingSpace(null)}
                            >
                              ✕
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="space-info" onClick={() => handleJoinSpace(spaceId)}>
                            <div className="space-main">
                              <span className="space-icon">🌐</span>
                              <div className="space-details">
                                <span className="space-name">{space.name}</span>
                                <div className="space-meta">
                                  <span className={`visibility-badge ${space.isPublic ? 'public' : 'private'}`}>
                                    {space.isPublic ? 'Public' : 'Private'}
                                  </span>
                                  {currentSpace?.id === spaceId && (
                                    <span className="current-badge">Current</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-actions">
                            <button 
                              className="action-button edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(space);
                              }}
                              title="Edit space"
                            >
                              ✎
                            </button>
                            {currentSpace?.id === spaceId ? (
                              <button 
                                className="action-button leave"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLeaveSpace();
                                }}
                                title="Leave space"
                              >
                                ←
                              </button>
                            ) : (
                              <button 
                                className="action-button delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSpace(spaceId);
                                }}
                                title="Delete space"
                              >
                                🗑
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
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