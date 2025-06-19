import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AuthContext from './AuthContext';
import websocketService from '../services/websocketService';
import api from '../services/api';

const CollaborationContext = createContext();

export const useCollaboration = () => useContext(CollaborationContext);

export const CollaborationProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  
  // State
  const [activeUsers, setActiveUsers] = useState([]);
  const [cursorPositions, setCursorPositions] = useState(new Map());
  const [lockedCards, setLockedCards] = useState(new Map());
  const [selectedCards, setSelectedCards] = useState(new Map()); // userId -> cardId
  const [currentSpace, setCurrentSpace] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use ref to store the callback to avoid stale closure issues
  const cardContextSyncCallbackRef = useRef(null);

  // Function to register the sync callback
  const registerCardContextSync = useCallback((callback) => {
    console.log('Collaboration: registerCardContextSync called with:', typeof callback);
    console.log('Collaboration: Callback function:', callback);
    cardContextSyncCallbackRef.current = callback;
    console.log('Collaboration: Callback stored in ref');
  }, []);
  
  // Debug: Track when cardContextSyncCallback changes
  useEffect(() => {
    console.log('Collaboration: cardContextSyncCallback changed to:', !!cardContextSyncCallbackRef.current);
  }, []);
  
  // Load spaces from API
  const loadSpaces = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      const response = await api.get('/spaces');
      setSpaces(response.data);
      setError(null);
    } catch (error) {
      console.error('Error loading spaces:', error);
      setError('Failed to load spaces');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);
  
  // Connection management
  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    console.log('Collaboration: Connection effect triggered', { 
      currentUser: !!currentUser, 
      currentUserEmail: currentUser?.email,
      hasToken: !!localStorage.getItem('token'),
      token: localStorage.getItem('token')?.substring(0, 20) + '...'
    });
    
    if (!currentUser) {
      console.log('Collaboration: No current user, disconnecting WebSocket');
      websocketService.disconnect();
      setIsConnected(false);
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Collaboration: No token found, disconnecting WebSocket');
      websocketService.disconnect();
      setIsConnected(false);
      return;
    }
    
    console.log('Collaboration: User and token found, connecting to WebSocket...');
    
    // Small delay to ensure everything is properly set
    const connectTimeout = setTimeout(() => {
      // Connect to WebSocket
      websocketService.connect()
        .then(() => {
          console.log('Collaboration: WebSocket connected successfully');
          setIsConnected(true);
          setError(null);
        })
        .catch(error => {
          console.error('Collaboration: WebSocket connection failed:', error);
          setIsConnected(false);
          setError('Failed to connect to collaboration server: ' + error.message);
        });
    }, 500); // 500ms delay
    
    // Load spaces
    loadSpaces();
    
    // Cleanup on unmount
    return () => {
      clearTimeout(connectTimeout);
      websocketService.disconnect();
      setIsConnected(false);
    };
  }, [currentUser, loadSpaces]);
  
  // Set up WebSocket event listeners
  useEffect(() => {
    // Authentication success event
    const handleAuthenticated = () => {
      console.log('Collaboration: WebSocket authenticated');
      setIsConnected(true);
      setError(null);
      
      // Clear any existing users before joining
      setActiveUsers([]);
      setCursorPositions(new Map());
      setLockedCards(new Map());
      
      // Auto-join public space after authentication
      setTimeout(() => {
        console.log('Collaboration: Auto-joining public space');
        const success = websocketService.joinSpace('public');
        if (!success) {
          console.warn('Collaboration: Failed to auto-join public space');
          setError('Failed to join default space');
        }
      }, 100);
    };
    
    // Authentication error event
    const handleAuthError = (message) => {
      console.error('Collaboration: Authentication failed:', message);
      setIsConnected(false);
      setError('Authentication failed: ' + message);
    };
    
    // Connection events
    const handleConnected = () => {
      console.log('Collaboration: WebSocket connected');
    };
    
    const handleDisconnected = () => {
      console.log('Collaboration: WebSocket disconnected');
      setIsConnected(false);
    };
    
    const handleError = (error) => {
      console.error('Collaboration: WebSocket error:', error);
      setError('Connection error: ' + error);
    };
    
    // User join event
    const handleUserJoin = (data) => {
      console.log('Collaboration: User joined:', data.userName || data.name);
      
      // Validate user data
      if (!data || !data.userId) {
        console.warn('Collaboration: Invalid user join data:', data);
        return;
      }
      
      setActiveUsers(prev => {
        // Check if user already exists to avoid duplicates
        const existingIndex = prev.findIndex(user => user.id === data.userId);
        const newUser = {
          id: data.userId,
          name: data.userName || data.name || 'Unknown User',
          username: data.userName || data.name || 'Unknown User',
          color: data.userColor || '#000000',
          cursor: { x: 0, y: 0 },
          cursorPosition: { x: 0, y: 0 },
          lastActivity: data.timestamp || Date.now()
        };
        
        if (existingIndex >= 0) {
          // Update existing user
          const updated = [...prev];
          updated[existingIndex] = newUser;
          return updated;
        } else {
          // Add new user
          return [...prev, newUser];
        }
      });
    };
    
    // User leave event
    const handleUserLeave = (data) => {
      const leavingUserId = data.userId || data;
      console.log('Collaboration: User left:', leavingUserId);
      
      // Validate that we have a valid user ID
      if (!leavingUserId) {
        console.warn('Collaboration: Invalid user leave data:', data);
        return;
      }
      
      setActiveUsers(prev => prev.filter(user => user.id !== leavingUserId));
      setCursorPositions(prev => {
        const newPositions = new Map(prev);
        newPositions.delete(leavingUserId);
        return newPositions;
      });
    };
    
    // Cursor update event
    const handleCursorUpdate = (data) => {
      // Validate cursor data
      if (!data || typeof data.x !== 'number' || typeof data.y !== 'number' || !data.userId) {
        console.warn('Collaboration: Invalid cursor data received:', data);
        return;
      }
      
      setCursorPositions(prev => {
        const newPositions = new Map(prev);
        newPositions.set(data.userId, {
          x: data.x,
          y: data.y,
          userName: data.userName,
          userColor: data.userColor
        });
        return newPositions;
      });
      
      // Also update activeUsers with cursor position for CursorTrail component
      setActiveUsers(prev => {
        return prev.map(user => 
          user.id === data.userId 
            ? { 
                ...user, 
                cursorPosition: { x: data.x, y: data.y },
                cursor: { x: data.x, y: data.y }
              }
            : user
        );
      });
    };
    
    // Card lock/unlock events
    const handleCardLock = (data) => {
      console.log('Collaboration: Card locked:', data);
      setLockedCards(prev => {
        const newLocked = new Map(prev);
        newLocked.set(data.cardId, {
          userId: data.userId,
          userName: data.userName,
          userColor: data.userColor
        });
        return newLocked;
      });
    };
    
    const handleCardUnlock = (data) => {
      console.log('Collaboration: Card unlocked:', data);
      setLockedCards(prev => {
        const newLocked = new Map(prev);
        newLocked.delete(data.cardId);
        return newLocked;
      });
    };
    
    // Card selection events
    const handleCardSelected = (data) => {
      console.log('Collaboration: Card selected:', data);
      setSelectedCards(prev => {
        const newSelected = new Map(prev);
        newSelected.set(data.userId, data.cardId);
        return newSelected;
      });
    };
    
    const handleCardDeselected = (data) => {
      console.log('Collaboration: Card deselected:', data);
      setSelectedCards(prev => {
        const newSelected = new Map(prev);
        newSelected.delete(data.userId);
        return newSelected;
      });
    };
    
    // Users list event
    const handleUsersList = (data) => {
      console.log('Collaboration: handleUsersList received data:', data);
      
      if (!data) {
        console.warn('Collaboration: Users list received null/undefined data');
        setActiveUsers([]);
        return;
      }
      
      let users = [];
      if (Array.isArray(data)) {
        // Normal case: array of users
        users = data;
        console.log('Collaboration: Users list received (array):', data.length, 'users');
      } else if (typeof data === 'object' && data.id) {
        // Edge case: single user object - wrap it in array
        users = [data];
        console.log('Collaboration: Users list received (single user):', data.name || data.id);
      } else {
        console.warn('Collaboration: Users list received invalid data format:', typeof data, data);
        setActiveUsers([]);
        return;
      }
      
      // Ensure all users have required properties to avoid downstream errors
      const validUsers = users.filter(user => user && user.id).map(user => ({
        id: user.id,
        name: user.name || 'Unknown User',
        username: user.name || 'Unknown User', // ActiveUsers component expects 'username'
        color: user.color || '#000000',
        picture: user.picture || null,
        cursor: user.cursor || { x: 0, y: 0 },
        cursorPosition: user.cursor || { x: 0, y: 0 } // For CursorTrail component
      }));
      
      console.log('Collaboration: Setting active users:', validUsers.length, 'valid users');
      console.log('Collaboration: Users details:', validUsers.map(u => ({ id: u.id, name: u.name, color: u.color })));
      setActiveUsers(validUsers);
    };
    
    // Locks list event (when joining a space)
    const handleLocksList = (data) => {
      console.log('Collaboration: Received locks list:', data);
      const lockMap = new Map();
      
      data.forEach(lock => {
        lockMap.set(lock.cardId, {
          userId: lock.userId,
          userName: lock.userName,
          userColor: lock.userColor
        });
      });
      
      setLockedCards(lockMap);
      console.log('Collaboration: Applied lock states for', lockMap.size, 'cards');
    };
    
    // Selections list event (when joining a space)
    const handleSelectionsList = (data) => {
      console.log('Collaboration: Received selections list:', data);
      const selectionMap = new Map();
      
      data.forEach(selection => {
        selectionMap.set(selection.userId, selection.cardId);
      });
      
      setSelectedCards(selectionMap);
      console.log('Collaboration: Applied selection states for', selectionMap.size, 'users');
    };

    // Space joined event
    const handleSpaceJoined = (data) => {
      console.log('Collaboration: handleSpaceJoined called with data:', data);
      console.log('Collaboration: Joined space:', data.name);
      const spaceData = {
        id: data.spaceId,
        name: data.name,
        isPublic: data.isPublic
      };
      setCurrentSpace(spaceData);
      
      // Clear users list and selections when joining new space - will be repopulated by users:list event
      console.log('Collaboration: Clearing active users and selections for new space');
      setActiveUsers([]);
      setCursorPositions(new Map());
      setLockedCards(new Map());
      setSelectedCards(new Map());
      
      // Sync with CardContext if callback is available
      console.log('Collaboration: Syncing with CardContext', { 
        hasCallback: !!cardContextSyncCallbackRef.current, 
        spaceId: spaceData.id 
      });
      if (cardContextSyncCallbackRef.current) {
        cardContextSyncCallbackRef.current(spaceData.id);
        console.log('Collaboration: CardContext sync callback called');
      }
    };
    
    // Connection close event
    const handleClose = () => {
      console.log('Collaboration: Connection closed');
      setIsConnected(false);
    };
    
    // Card creation, update, deletion, and connection handlers
    const handleCardCreated = (data) => {
      console.log('Collaboration: Card created by user:', data.userName, 'in space:', data.card.spaceId);
      // Note: Actual card state is managed by CardContext
    };

    const handleCardUpdated = (data) => {
      console.log('Collaboration: Card updated by user:', data.userName, 'in space:', data.card.spaceId);
      // Note: Actual card state is managed by CardContext
    };

    const handleCardDeleted = (data) => {
      console.log('Collaboration: Card deleted by user:', data.userName);
      // Note: Actual card state is managed by CardContext
    };

    const handleConnectionCreated = (data) => {
      console.log('Collaboration: Connection created by user:', data.userName, 'in space:', data.connection.spaceId);
      // Note: Actual connection state is managed by CardContext
    };

    const handleConnectionDeleted = (data) => {
      console.log('Collaboration: Connection deleted by user:', data.userName);
      // Note: Actual connection state is managed by CardContext
    };

    // Register ALL event listeners (always, regardless of connection status)
    console.log('Collaboration: Registering all event listeners...');
    websocketService.on('authenticated', handleAuthenticated);
    websocketService.on('authError', handleAuthError);
    websocketService.on('connected', handleConnected);
    websocketService.on('disconnected', handleDisconnected);
    websocketService.on('error', handleError);
    websocketService.on('userJoined', handleUserJoin);
    websocketService.on('userLeft', handleUserLeave);
    websocketService.on('cursorMove', handleCursorUpdate);
    websocketService.on('cardLocked', handleCardLock);
    websocketService.on('cardUnlocked', handleCardUnlock);
    websocketService.on('cardSelected', handleCardSelected);
    websocketService.on('cardDeselected', handleCardDeselected);
    websocketService.on('card:created', handleCardCreated);
    websocketService.on('card:updated', handleCardUpdated);
    websocketService.on('card:deleted', handleCardDeleted);
    websocketService.on('connection:created', handleConnectionCreated);
    websocketService.on('connection:deleted', handleConnectionDeleted);
    websocketService.on('usersList', handleUsersList);
    websocketService.on('locksList', handleLocksList);
    websocketService.on('selectionsList', handleSelectionsList);
    websocketService.on('spaceJoined', handleSpaceJoined);
    websocketService.on('close', handleClose);
    console.log('Collaboration: All event listeners registered');
    
          // Cleanup ALL event listeners on unmount
      return () => {
        console.log('Collaboration: Cleaning up all event listeners...');
        websocketService.off('authenticated', handleAuthenticated);
        websocketService.off('authError', handleAuthError);
        websocketService.off('connected', handleConnected);
        websocketService.off('disconnected', handleDisconnected);
        websocketService.off('error', handleError);
        websocketService.off('userJoined', handleUserJoin);
        websocketService.off('userLeft', handleUserLeave);
        websocketService.off('cursorMove', handleCursorUpdate);
        websocketService.off('cardLocked', handleCardLock);
        websocketService.off('cardUnlocked', handleCardUnlock);
        websocketService.off('cardSelected', handleCardSelected);
        websocketService.off('cardDeselected', handleCardDeselected);
        websocketService.off('card:created', handleCardCreated);
        websocketService.off('card:updated', handleCardUpdated);
        websocketService.off('card:deleted', handleCardDeleted);
        websocketService.off('connection:created', handleConnectionCreated);
        websocketService.off('connection:deleted', handleConnectionDeleted);
        websocketService.off('usersList', handleUsersList);
        websocketService.off('locksList', handleLocksList);
        websocketService.off('selectionsList', handleSelectionsList);
        websocketService.off('spaceJoined', handleSpaceJoined);
        websocketService.off('close', handleClose);
      };
  }, []);
  
  // Space management functions
  const joinSpace = useCallback((spaceId) => {
    console.log('Collaboration: Joining space:', spaceId);
    if (!isConnected) {
      console.warn('Collaboration: Not connected, cannot join space');
      // Try to reconnect if not connected
      if (currentUser) {
        websocketService.connect().then(() => {
          console.log('Collaboration: Reconnected, trying to join space again');
          websocketService.joinSpace(spaceId);
        }).catch(error => {
          console.error('Collaboration: Failed to reconnect:', error);
          setError('Failed to connect to collaboration server');
        });
      }
      return;
    }
    websocketService.joinSpace(spaceId);
  }, [isConnected, currentUser]);
  
  const leaveSpace = useCallback(() => {
    console.log('Collaboration: Leaving space');
    if (!isConnected || !currentSpace) return;
    websocketService.leaveSpace();
    setCurrentSpace(null);
    
    // Sync with CardContext if callback is available
    if (cardContextSyncCallbackRef.current) {
      cardContextSyncCallbackRef.current(null);
    }
  }, [isConnected, currentSpace]);
  
  const createSpace = useCallback(async (name, description, isPublic = false) => {
    try {
      const response = await api.post('/spaces', {
        name,
        description,
        isPublic
      });
      await loadSpaces();
      return response.data;
    } catch (error) {
      console.error('Error creating space:', error);
      throw error;
    }
  }, [loadSpaces]);
  
  const updateSpace = useCallback(async (spaceId, updates) => {
    try {
      const response = await api.put(`/spaces/${spaceId}`, updates);
      await loadSpaces();
      return response.data;
    } catch (error) {
      console.error('Error updating space:', error);
      throw error;
    }
  }, [loadSpaces]);
  
  const deleteSpace = useCallback(async (spaceId) => {
    try {
      await api.delete(`/spaces/${spaceId}`);
      if (currentSpace && currentSpace.id === spaceId) {
        leaveSpace();
      }
      await loadSpaces();
    } catch (error) {
      console.error('Error deleting space:', error);
      throw error;
    }
  }, [currentSpace, leaveSpace, loadSpaces]);
  
  // Collaboration functions
  const updateCursorPosition = useCallback((x, y) => {
    if (!isConnected) return;
    websocketService.updateCursor(x, y);
  }, [isConnected]);
  
  const lockCard = useCallback((cardId) => {
    if (!isConnected) return;
    websocketService.lockCard(cardId);
  }, [isConnected]);
  
  const unlockCard = useCallback((cardId) => {
    if (!isConnected) return;
    websocketService.unlockCard(cardId);
  }, [isConnected]);
  
  const selectCard = useCallback((cardId) => {
    console.log('Collaboration: selectCard called for:', cardId, 'isConnected:', isConnected);
    if (!isConnected) return;
    websocketService.selectCard(cardId);
  }, [isConnected]);
  
  const deselectCard = useCallback((cardId) => {
    console.log('Collaboration: deselectCard called for:', cardId, 'isConnected:', isConnected);
    if (!isConnected) return;
    websocketService.deselectCard(cardId);
  }, [isConnected]);
  
  const clearAllSelections = useCallback(() => {
    console.log('Collaboration: clearAllSelections called, isConnected:', isConnected);
    if (!isConnected) return;
    websocketService.clearAllSelections();
  }, [isConnected]);
  
  // Helper functions
  const isCardLockedByMe = useCallback((cardId) => {
    if (!currentUser || !lockedCards.has(cardId)) return false;
    return lockedCards.get(cardId).userId === currentUser._id;
  }, [currentUser, lockedCards]);
  
  const isCardLockedByOthers = useCallback((cardId) => {
    if (!currentUser || !lockedCards.has(cardId)) return false;
    return lockedCards.get(cardId).userId !== currentUser._id;
  }, [currentUser, lockedCards]);
  
  const getCardLockInfo = useCallback((cardId) => {
    return lockedCards.get(cardId) || null;
  }, [lockedCards]);
  
  const getUserById = useCallback((userId) => {
    return activeUsers.find(user => user.id === userId) || null;
  }, [activeUsers]);
  
  const isCardSelectedByUser = useCallback((cardId, userId) => {
    return selectedCards.get(userId) === cardId;
  }, [selectedCards]);
  
  const getCardSelectedByUser = useCallback((userId) => {
    return selectedCards.get(userId) || null;
  }, [selectedCards]);
  
  const isCardSelectedByMe = useCallback((cardId) => {
    if (!currentUser) return false;
    return selectedCards.get(currentUser._id) === cardId;
  }, [currentUser, selectedCards]);
  
  const isCardSelectedByOthers = useCallback((cardId) => {
    if (!currentUser) return false;
    for (const [userId, selectedCardId] of selectedCards) {
      if (userId !== currentUser._id && selectedCardId === cardId) {
        return true;
      }
    }
    return false;
  }, [currentUser, selectedCards]);
  
  // Context value
  const value = {
    // State
    activeUsers,
    cursorPositions,
    lockedCards,
    selectedCards,
    currentSpace,
    spaces,
    isConnected,
    isLoading,
    error,
    
    // Space management
    joinSpace,
    leaveSpace,
    createSpace,
    updateSpace,
    deleteSpace,
    loadSpaces,
    
    // Collaboration
    updateCursorPosition,
    lockCard,
    unlockCard,
    selectCard,
    deselectCard,
    clearAllSelections,
    
    // Helpers
    isCardLockedByMe,
    isCardLockedByOthers,
    getCardLockInfo,
    getUserById,
    isCardSelectedByUser,
    getCardSelectedByUser,
    isCardSelectedByMe,
    isCardSelectedByOthers,
    
    // Card context sync
    registerCardContextSync
  };
  
  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};

export default CollaborationContext; 