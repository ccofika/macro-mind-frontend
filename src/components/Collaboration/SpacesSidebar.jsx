import React, { useState } from 'react';
import { useCollaboration } from '../../context/CollaborationContext';
import websocketService from '../../services/websocketService';
import './SpacesSidebar.css';

const SpacesSidebar = () => {
  const {
    spaces,
    currentSpace,
    isConnected,
    joinSpace,
    leaveSpace,
    createSpace,
    updateSpace,
    deleteSpace
  } = useCollaboration();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
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
      <div className="spaces-sidebar">
        <div className="spaces-header">
          <h3>Collaborative Spaces</h3>
        </div>
        <div className="spaces-connection-error">
          <span className="connection-error-icon">⚠️</span>
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
    );
  }
  
  return (
    <div className="spaces-sidebar">
      <div className="spaces-header">
        <h3>Collaborative Spaces</h3>
        <button 
          className="create-space-button"
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? 'Cancel' : '+ New Space'}
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
          <div className="space-visibility">
            <label>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={() => setIsPublic(!isPublic)}
              />
              Public space
            </label>
          </div>
          <button type="submit" className="submit-space-button">Create Space</button>
        </form>
      )}
      
      <div className="spaces-list">
        {spaces.length === 0 ? (
          <div className="no-spaces">
            <p>No spaces available</p>
            <p className="no-spaces-hint">Create a space to collaborate with others</p>
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
                    <div className="space-visibility">
                      <label>
                        <input
                          type="checkbox"
                          checked={editingSpace.isPublic}
                          onChange={() => setEditingSpace({
                            ...editingSpace, 
                            isPublic: !editingSpace.isPublic
                          })}
                        />
                        Public
                      </label>
                    </div>
                    <div className="edit-space-actions">
                      <button type="submit" className="save-space-button">Save</button>
                      <button 
                        type="button" 
                        className="cancel-edit-button"
                        onClick={() => setEditingSpace(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="space-info" onClick={() => handleJoinSpace(spaceId)}>
                      <div className="space-name-container">
                        <span className="space-icon">🌐</span>
                        <span className="space-name">{space.name}</span>
                      </div>
                      {space.isPublic ? (
                        <span className="space-public-badge">Public</span>
                      ) : (
                        <span className="space-private-badge">Private</span>
                      )}
                    </div>
                    
                    {currentSpace?.id === spaceId && (
                      <div className="space-actions">
                        <button 
                          className="edit-space-button"
                          onClick={() => startEditing({...space, id: spaceId})}
                          title="Edit space"
                        >
                          ✏️
                        </button>
                        <button 
                          className="delete-space-button"
                          onClick={() => handleDeleteSpace(spaceId)}
                          title="Delete space"
                        >
                          🗑️
                        </button>
                        <button 
                          className="leave-space-button"
                          onClick={handleLeaveSpace}
                          title="Leave space"
                        >
                          ❌
                        </button>
                      </div>
                    )}
                  </>
                )}
                
                {currentSpace?.id === spaceId && (
                  <div className="active-space-indicator">
                    <span className="active-dot"></span>
                    <span>Currently active</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SpacesSidebar; 