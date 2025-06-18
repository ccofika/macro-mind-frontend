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
    if (!currentUser) {
      setIsConnected(false);
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      setIsConnected(false);
      return;
    }
    
    console.log('Collaboration: Connecting to WebSocket...');
    
    // Connect to WebSocket
    websocketService.connect()
      .then(() => {
        console.log('Collaboration: WebSocket connected');
        setIsConnected(true);
        setError(null);
      })
      .catch(error => {
        console.error('Collaboration: WebSocket connection failed:', error);
        setIsConnected(false);
        setError('Failed to connect to collaboration server');
      });
    
    // Load spaces
    loadSpaces();
    
    // Cleanup on unmount
    return () => {
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
      console.log('Collaboration: User joined:', data.userName);
      setActiveUsers(prev => {
        const filtered = prev.filter(user => user.id !== data.userId);
        return [...filtered, {
          id: data.userId,
          name: data.userName,
          color: data.userColor,
          cursor: { x: 0, y: 0 },
          lastActivity: data.timestamp
        }];
      });
    };
    
    // User leave event
    const handleUserLeave = (data) => {
      console.log('Collaboration: User left:', data.userId);
      setActiveUsers(prev => prev.filter(user => user.id !== data.userId));
      setCursorPositions(prev => {
        const newPositions = new Map(prev);
        newPositions.delete(data.userId);
        return newPositions;
      });
    };
    
    // Cursor update event
    const handleCursorUpdate = (data) => {
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
    };
    
    // Card lock event
    const handleCardLock = (data) => {
      setLockedCards(prev => {
        const newLocks = new Map(prev);
        newLocks.set(data.cardId, {
          userId: data.userId,
          userName: data.userName,
          userColor: data.userColor
        });
        return newLocks;
      });
    };
    
    // Card unlock event
    const handleCardUnlock = (data) => {
      setLockedCards(prev => {
        const newLocks = new Map(prev);
        newLocks.delete(data.cardId);
        return newLocks;
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
        cursor: user.cursor || { x: 0, y: 0 }
      }));
      
      console.log('Collaboration: Setting active users:', validUsers.length, 'valid users');
      setActiveUsers(validUsers);
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
    websocketService.on('usersList', handleUsersList);
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
      websocketService.off('usersList', handleUsersList);
      websocketService.off('spaceJoined', handleSpaceJoined);
      websocketService.off('close', handleClose);
    };
  }, []);
  
  // Space management functions
  const joinSpace = useCallback((spaceId) => {
    console.log('Collaboration: Joining space:', spaceId);
    if (!isConnected) {
      console.warn('Collaboration: Not connected, cannot join space');
      return;
    }
    websocketService.joinSpace(spaceId);
  }, [isConnected]);
  
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
  
  // Context value
  const value = {
    // State
    activeUsers,
    cursorPositions,
    lockedCards,
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
    
    // Helpers
    isCardLockedByMe,
    isCardLockedByOthers,
    getCardLockInfo,
    getUserById,
    
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