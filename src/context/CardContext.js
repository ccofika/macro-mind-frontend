import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useCanvas } from './CanvasContext';
import { cardApi, connectionApi } from '../services/api';
import websocketService from '../services/websocketService';
import { cardService } from '../services/cardService';
import { useCollaboration } from './CollaborationContext';
import CollaborationContext from './CollaborationContext';

const CardContext = createContext();

export const useCards = () => {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('useCards must be used within a CardProvider');
  }
  return context;
};

// Throttle utility function
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

// Debounce utility function for text updates
const debounce = (func, delay) => {
  let timeoutId;
  return function() {
    const args = arguments;
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(context, args), delay);
  };
};

export const CardProvider = ({ children }) => {
  const [cards, setCards] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentSpaceId, setCurrentSpaceId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectMode, setConnectMode] = useState(false);
  
  const { screenToCanvas } = useCanvas();

  // Get collaboration context for integrated selection
  const collaboration = useContext(CollaborationContext);
  const {
    selectCard: collaborationSelectCard,
    deselectCard: collaborationDeselectCard,
    clearAllSelections: collaborationClearAllSelections,
    isCardSelectedByMe,
    selectedCards
  } = collaboration || {};

  // Function to set current space (called from CollaborationContext)
  const setCurrentSpace = useCallback((spaceId) => {
    console.log('CardContext: setCurrentSpace called with:', spaceId);
    setCurrentSpaceId(spaceId);
  }, []);

  // Load cards and connections for the current space
  const loadSpaceData = useCallback(async (spaceId) => {
    if (!spaceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading data for space:', spaceId);
      
      // Load cards from server for this space
      const cardsData = await cardApi.getAllCards(spaceId);
      setCards(cardsData);
      
      // Load connections from server for this space
      const connectionsData = await connectionApi.getAllConnections(spaceId);
      setConnections(connectionsData);
      
      console.log(`Loaded ${cardsData.length} cards and ${connectionsData.length} connections for space ${spaceId}`);
    } catch (err) {
      console.error("Failed to load space data:", err);
      setError("Failed to load cards and connections for this space");
      
      // Clear cards and connections on error
      setCards([]);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data when space changes
  useEffect(() => {
    console.log('CardContext: currentSpaceId changed to:', currentSpaceId);
    if (currentSpaceId) {
      loadSpaceData(currentSpaceId);
    } else {
      // If no space is selected, clear the data
      setCards([]);
      setConnections([]);
    }
  }, [currentSpaceId, loadSpaceData]);

  // Set up websocket event listeners for real-time collaboration
  useEffect(() => {
    const handleCardCreated = (data) => {
      console.log('CardContext: Received card created event:', data);
      // Only add cards from the current space or if no space is set
      if (!currentSpaceId || data.card.spaceId === currentSpaceId) {
        setCards(prevCards => {
          const exists = prevCards.some(card => card.id === data.card.id);
          if (!exists) {
            console.log('CardContext: Adding new card from remote user:', data.card.title);
            return [...prevCards, data.card];
          }
          return prevCards;
        });
      } else {
        console.log('CardContext: Ignoring card created event - wrong space');
      }
    };

    const handleCardUpdated = (data) => {
      console.log('CardContext: Received card updated event:', {
        cardId: data.card.id,
        cardTitle: data.card.title,
        cardPosition: data.card.position,
        cardSpaceId: data.card.spaceId,
        currentSpaceId: currentSpaceId,
        userId: data.userId,
        userName: data.userName
      });
      
      // Only update cards from the current space
      if (!currentSpaceId || data.card.spaceId === currentSpaceId || !data.card.spaceId) {
        setCards(prevCards => {
          const existingCard = prevCards.find(card => card.id === data.card.id);
          if (!existingCard) {
            console.log('CardContext: Card not found in local state, ignoring update');
            return prevCards;
          }
          
          // Check if this card is currently being dragged locally
          // If so, ignore the network update to prevent conflicts
          const isDraggedLocally = moveCard.throttledUpdates && moveCard.throttledUpdates.has(data.card.id);
          if (isDraggedLocally) {
            console.log('CardContext: Ignoring network update for locally dragged card:', data.card.id);
            return prevCards;
          }
          
          console.log('CardContext: Updating card from network:', data.card.id);
          return prevCards.map(card => 
            card.id === data.card.id 
              ? { ...card, ...data.card, updatedAt: new Date().toISOString() }
              : card
          );
        });
      }
    };

    const handleCardDeleted = (data) => {
      console.log('CardContext: Received card deleted event:', data);
      // Remove the card from the state (no space filtering needed for deletion)
      setCards(prevCards => prevCards.filter(card => card.id !== data.cardId));
      // Also remove any connections involving this card
      setConnections(prevConnections => 
        prevConnections.filter(conn => 
          conn.sourceId !== data.cardId && conn.targetId !== data.cardId
        )
      );
    };

    const handleConnectionCreated = (data) => {
      console.log('CardContext: Received connection created event:', data);
      // Only add connections from the current space
      if (!currentSpaceId || data.connection.spaceId === currentSpaceId) {
        setConnections(prevConnections => {
          const exists = prevConnections.some(conn => conn.id === data.connection.id);
          if (!exists) {
            console.log('CardContext: Adding new connection from remote user');
            return [...prevConnections, data.connection];
          }
          return prevConnections;
        });
      } else {
        console.log('CardContext: Ignoring connection created event - wrong space');
      }
    };

    const handleConnectionDeleted = (data) => {
      console.log('CardContext: Received connection deleted event:', data);
      // Remove the connection from the state (no space filtering needed for deletion)
      setConnections(prevConnections => 
        prevConnections.filter(conn => conn.id !== data.connectionId)
      );
    };

    // Register event listeners
    websocketService.on('card:created', handleCardCreated);
    websocketService.on('card:updated', handleCardUpdated);
    websocketService.on('card:deleted', handleCardDeleted);
    websocketService.on('connection:created', handleConnectionCreated);
    websocketService.on('connection:deleted', handleConnectionDeleted);

    console.log('CardContext: Websocket event listeners registered for space:', currentSpaceId);

    // Cleanup event listeners
    return () => {
      websocketService.off('card:created', handleCardCreated);
      websocketService.off('card:updated', handleCardUpdated);
      websocketService.off('card:deleted', handleCardDeleted);
      websocketService.off('connection:created', handleConnectionCreated);
      websocketService.off('connection:deleted', handleConnectionDeleted);
      console.log('CardContext: Websocket event listeners cleaned up');
    };
  }, [currentSpaceId]);

  // Add card history for undo/redo
  const addToHistory = useCallback((cardsSnapshot, connectionsSnapshot) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      cards: JSON.parse(JSON.stringify(cardsSnapshot)),
      connections: JSON.parse(JSON.stringify(connectionsSnapshot))
    });
    
    // Limit history to 30 entries
    if (newHistory.length > 30) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Connect cards - moved before createCard to avoid dependency issue
  const connectCards = useCallback(async (sourceId, targetId) => {
    console.log('CardContext: connectCards called:', { sourceId, targetId, currentSpaceId });
    
    // Verify cards exist
    const sourceExists = cards.some(c => c.id === sourceId);
    const targetExists = cards.some(c => c.id === targetId);
    
    if (!sourceExists || !targetExists) {
      console.log('CardContext: connectCards failed - cards do not exist');
      return false;
    }
    
    // Check if connection already exists (bidirectional)
    const connectionExists = connections.some(
      c => (c.sourceId === sourceId && c.targetId === targetId) ||
           (c.sourceId === targetId && c.targetId === sourceId)
    );
    
    if (connectionExists) {
      console.log('CardContext: connectCards failed - connection already exists');
      return false;
    }
    
    const newConnection = {
      id: uuidv4(),
      sourceId,
      targetId
    };
    
    setConnections(prev => {
      const newConnections = [...prev, newConnection];
      addToHistory(cards, newConnections);
      return newConnections;
    });
    
    try {
      // Create on server with current space
      const spaceId = currentSpaceId || 'public';
      console.log('CardContext: Creating connection on server:', { sourceId, targetId, spaceId });
      
      const savedConnection = await connectionApi.createConnection(sourceId, targetId, spaceId);
      
      console.log('CardContext: Connection created on server:', savedConnection);
      
      // Update local state with server-generated ID
      setConnections(prev => prev.map(conn => 
        (conn.sourceId === sourceId && conn.targetId === targetId && conn.id === newConnection.id)
          ? savedConnection
          : conn
      ));
      
      // Notify other users via websocket
      console.log('CardContext: Notifying other users of connection creation');
      websocketService.notifyConnectionCreated(savedConnection);
    } catch (err) {
      console.error("CardContext: Failed to create connection on server:", err);
      // Connection still exists locally
    }
    
    return true;
  }, [cards, connections, addToHistory, currentSpaceId]);

  // Create a new card (generic function)
  const createCard = useCallback(async (type, position, parentId = null) => {
    if (!currentSpaceId) {
      console.warn('Cannot create card: no current space selected');
      return null;
    }
    
    let title, content, fontSize;
    
    if (type === 'category') {
      title = 'New Category';
      content = null;
    } else if (type === 'label') {
      title = 'New Label';
      content = null;
      fontSize = 16;
    } else {
      title = 'New Answer';
      content = '';
    }
    
    const newCard = {
      id: uuidv4(),
      type,
      title,
      content,
      position,
      parentId,
      spaceId: currentSpaceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add fontSize for label cards
    if (type === 'label') {
      newCard.fontSize = fontSize;
    }
    
    setCards(prevCards => [...prevCards, newCard]);
    addToHistory([...cards, newCard], connections);
    
    try {
      const savedCard = await cardApi.createCard(newCard);
      setCards(prevCards => prevCards.map(card => 
        card.id === newCard.id ? savedCard : card
      ));
      
      // Notify other users via websocket
      websocketService.notifyCardCreated(savedCard);
      
      // If there's a parent, create a connection
      if (parentId) {
        connectCards(parentId, savedCard.id);
      }
      
      return savedCard.id;
    } catch (err) {
      console.error("Failed to create card on server:", err);
      return newCard.id;
    }
  }, [cards, connections, addToHistory, connectCards, currentSpaceId]);

  // Create category card
  const createCategoryCard = useCallback((title, screenPosition) => {
    const canvasPosition = screenToCanvas ? screenToCanvas(screenPosition) : screenPosition;
    return createCard('category', canvasPosition);
  }, [createCard, screenToCanvas]);

  // Create answer card
  const createAnswerCard = useCallback((title, content, screenPosition) => {
    const canvasPosition = screenToCanvas ? screenToCanvas(screenPosition) : screenPosition;
    return createCard('answer', canvasPosition);
  }, [createCard, screenToCanvas]);

  // Create label card
  const createLabelCard = useCallback((title, screenPosition) => {
    const canvasPosition = screenToCanvas ? screenToCanvas(screenPosition) : screenPosition;
    return createCard('label', canvasPosition);
  }, [createCard, screenToCanvas]);

  // Update card
  const updateCard = useCallback(async (id, updates) => {
    console.log('CardContext: updateCard called for card:', id, 'with updates:', updates);
    
    // Store the current card before update for websocket notification
    const currentCard = cards.find(card => card.id === id);
    
    setCards(prevCards => {
      const newCards = prevCards.map(card => 
        card.id === id 
          ? { ...card, ...updates, updatedAt: new Date().toISOString() } 
          : card
      );
      addToHistory(newCards, connections);
      return newCards;
    });
    
    try {
      // Update on server
      await cardApi.updateCard(id, updates);
      
      // Notify other users via websocket with updated card data
      if (currentCard) {
        const updatedCard = { ...currentCard, ...updates, updatedAt: new Date().toISOString() };
        websocketService.notifyCardUpdated(updatedCard);
      }
    } catch (err) {
      console.error(`Failed to update card ${id} on server:`, err);
      // Card is still updated locally
    }
  }, [cards, connections, addToHistory]);

  // Debounced version for text updates
  const updateCardDebounced = useCallback((id, updates) => {
    console.log('CardContext: updateCardDebounced called for card:', id, 'with updates:', updates);
    
    // Update local state immediately for responsive UI
    setCards(prevCards => {
      return prevCards.map(card => 
        card.id === id 
          ? { ...card, ...updates, updatedAt: new Date().toISOString() } 
          : card
      );
    });
    
    // Create debounced functions per card to avoid conflicts
    if (!updateCardDebounced.debouncedFunctions) {
      updateCardDebounced.debouncedFunctions = new Map();
    }
    
    if (!updateCardDebounced.debouncedFunctions.has(id)) {
      updateCardDebounced.debouncedFunctions.set(id, debounce(async (cardId, cardUpdates) => {
        try {
          // Update on server
          await cardApi.updateCard(cardId, cardUpdates);
          
          // Get current cards state using functional setState to avoid stale closure
          setCards(currentCards => {
            const latestCard = currentCards.find(card => card.id === cardId);
            if (latestCard) {
              const updatedCard = { ...latestCard, ...cardUpdates, updatedAt: new Date().toISOString() };
              websocketService.notifyCardUpdated(updatedCard);
            }
            return currentCards; // No state change needed
          });
        } catch (err) {
          console.error(`Failed to update card ${cardId} on server:`, err);
        }
      }, 500)); // 500ms debounce for text updates
    }
    
    updateCardDebounced.debouncedFunctions.get(id)(id, updates);
  }, []); // Remove cards dependency to avoid recreating functions

  // Move card - FIXED for perfect multi-card dragging
  const moveCard = useCallback((id, position, isRealTime = false) => {
    // Check if this is a multi-card drag
    const isMultiCardDrag = selectedCardIds.length > 1 && selectedCardIds.includes(id);
    
    if (isMultiCardDrag) {
      // ===== MULTI-CARD DRAG - FIXED APPROACH =====
      console.log('CardContext: Multi-card drag - setting absolute positions');
      
      // Store the initial positions when drag starts if not already stored
      if (!moveCard.initialPositions) {
        moveCard.initialPositions = new Map();
        selectedCardIds.forEach(cardId => {
          const card = cards.find(c => c.id === cardId);
          if (card) {
            moveCard.initialPositions.set(cardId, { ...card.position });
          }
        });
        
        // Store the initial position of the dragged card
        const draggedCard = cards.find(card => card.id === id);
        if (draggedCard) {
          moveCard.draggedCardInitialPos = { ...draggedCard.position };
        }
      }
      
      // Calculate delta from the initial position of the dragged card
      const deltaX = position.x - moveCard.draggedCardInitialPos.x;
      const deltaY = position.y - moveCard.draggedCardInitialPos.y;
      
      // Update positions of ALL selected cards based on their initial positions
      setCards(prevCards => {
        return prevCards.map(card => {
          if (selectedCardIds.includes(card.id)) {
            const initialPos = moveCard.initialPositions.get(card.id);
            if (initialPos) {
              return {
                ...card,
                position: {
                  x: initialPos.x + deltaX,
                  y: initialPos.y + deltaY
                }
              };
            }
          }
          return card;
        });
      });
      
      // Send network updates for all selected cards (throttled)
      if (isRealTime) {
        selectedCardIds.forEach(cardId => {
          if (!moveCard.throttledUpdates) {
            moveCard.throttledUpdates = new Map();
          }
          
          if (!moveCard.throttledUpdates.has(cardId)) {
            moveCard.throttledUpdates.set(cardId, throttle((cId, newPos) => {
              const updatedCard = { 
                id: cId,
                position: newPos,
                updatedAt: new Date().toISOString() 
              };
              websocketService.notifyCardUpdated(updatedCard);
            }, 50));
          }
          
          const initialPos = moveCard.initialPositions.get(cardId);
          if (initialPos) {
            const newPos = {
              x: initialPos.x + deltaX,
              y: initialPos.y + deltaY
            };
            moveCard.throttledUpdates.get(cardId)(cardId, newPos);
          }
        });
      }
    } else {
      // ===== SINGLE CARD DRAG =====
      setCards(prevCards => {
        return prevCards.map(card => 
          card.id === id 
            ? { ...card, position } 
            : card
        );
      });
      
      // Send network update for single card (throttled)
      if (isRealTime) {
        if (!moveCard.throttledUpdates) {
          moveCard.throttledUpdates = new Map();
        }
        
        if (!moveCard.throttledUpdates.has(id)) {
          moveCard.throttledUpdates.set(id, throttle((cardId, pos) => {
            const updatedCard = { 
              id: cardId,
              position: pos,
              updatedAt: new Date().toISOString() 
            };
            websocketService.notifyCardUpdated(updatedCard);
          }, 50));
        }
        
        moveCard.throttledUpdates.get(id)(id, position);
      }
    }
  }, [selectedCardIds, cards]);

  // Finalize move (add to history and update server)
  const finalizeMoveCard = useCallback(async () => {
    // Clear all throttled updates to allow network updates again
    if (moveCard.throttledUpdates) {
      moveCard.throttledUpdates.clear();
    }
    
    // Clear stored initial positions for multi-card drag
    if (moveCard.initialPositions) {
      moveCard.initialPositions.clear();
      moveCard.initialPositions = null;
      moveCard.draggedCardInitialPos = null;
    }
    
    // Get current state and add to history
    setCards(currentCards => {
      setConnections(currentConnections => {
        addToHistory(currentCards, currentConnections);
        return currentConnections;
      });
      
      // Now finalize the move with current positions
      (async () => {
        try {
          console.log("CardContext: Finalizing card positions...");
          
          // Get current positions of all cards
          const positions = currentCards.map(card => ({
            id: card.id,
            position: card.position
          }));
          
          
          // Update positions on server only (websocket already sent during drag)
          try {
            const result = await cardApi.updateCardPositions(positions);
          } catch (err) {
            console.error("Failed to update card positions on server:", err);
          }
        } catch (err) {
          console.error("Failed to prepare card positions update:", err);
        }
      })();
      
      return currentCards;
    });
  }, [addToHistory]); // Remove cards and connections dependencies

  // Delete card
  const deleteCard = useCallback(async (ids) => {
    if (!Array.isArray(ids)) {
      ids = [ids];
    }
    
    setCards(prevCards => {
      const newCards = prevCards.filter(card => !ids.includes(card.id));
      
      // Also remove any connections to these cards
      setConnections(prevConnections => {
        const newConnections = prevConnections.filter(
          conn => !ids.includes(conn.sourceId) && !ids.includes(conn.targetId)
        );
        
        addToHistory(newCards, newConnections);
        return newConnections;
      });
      
      return newCards;
    });
    
    try {
      // Delete on server (if multiple ids)
      if (ids.length > 1) {
        await cardApi.deleteMultipleCards(ids);
      } else {
        // Single id
        await cardApi.deleteCard(ids[0]);
      }
      
      // Notify other users via websocket for each deleted card
      ids.forEach(cardId => {
        websocketService.notifyCardDeleted(cardId);
      });
    } catch (err) {
      console.error("Failed to delete card(s) on server:", err);
      // Cards are still deleted locally
    }
  }, [addToHistory]);

  // Remove connection
  const removeConnection = useCallback(async (sourceId, targetId) => {
    console.log('CardContext: removeConnection called:', { sourceId, targetId });
    
    // Find the connection to get its ID (bidirectional search)
    const connection = connections.find(
      c => (c.sourceId === sourceId && c.targetId === targetId) ||
           (c.sourceId === targetId && c.targetId === sourceId)
    );
    
    if (!connection) {
      console.log('CardContext: removeConnection failed - connection not found');
      return;
    }
    
    console.log('CardContext: Found connection to remove:', connection);
    
    setConnections(prev => {
      const newConnections = prev.filter(
        c => !(c.sourceId === sourceId && c.targetId === targetId)
      );
      addToHistory(cards, newConnections);
      return newConnections;
    });
    
    try {
      // Delete on server
      console.log('CardContext: Deleting connection on server:', connection.id);
      await connectionApi.deleteConnection(connection.id);
      
      // Notify other users via websocket
      console.log('CardContext: Notifying other users of connection deletion');
      websocketService.notifyConnectionDeleted(connection.id);
    } catch (err) {
      console.error("CardContext: Failed to delete connection on server:", err);
      // Connection is still removed locally
    }
  }, [cards, connections, addToHistory]);

  // Handle card selection - SIMPLIFIED
  const selectCard = useCallback((id, isMultiSelect = false) => {
    console.log('CardContext: selectCard called', { id, isMultiSelect, currentSelection: selectedCardIds });
    
    if (isMultiSelect) {
      // Multi-selection - toggle card in selection
      setSelectedCardIds(prev => {
        const newSelection = prev.includes(id) 
          ? prev.filter(cardId => cardId !== id) // Remove if already selected
          : [...prev, id]; // Add if not selected
        
        console.log('CardContext: Multi-select result:', newSelection);
        return newSelection;
      });
    } else {
      // Single selection - replace current selection
      setSelectedCardIds([id]);
      console.log('CardContext: Single select result:', [id]);
      
      // Use collaboration system for single selection
      if (collaborationSelectCard) {
        collaborationSelectCard(id);
      }
    }
  }, [selectedCardIds, collaborationSelectCard]);

  // Clear selection
  const clearSelection = useCallback(() => {
    console.log('CardContext: Clearing all selections via collaboration');
    
    // Use collaboration system to clear all selections
    if (collaborationClearAllSelections) {
      collaborationClearAllSelections();
    } else {
      // Fallback: manual deselection
      if (collaborationDeselectCard && selectedCardIds.length > 0) {
        selectedCardIds.forEach(cardId => {
          if (isCardSelectedByMe && isCardSelectedByMe(cardId)) {
            collaborationDeselectCard(cardId);
          }
        });
      }
    }
    
    setSelectedCardIds([]);
  }, [collaborationClearAllSelections, collaborationDeselectCard, selectedCardIds, isCardSelectedByMe]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setCards(prevState.cards);
      setConnections(prevState.connections);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setCards(nextState.cards);
      setConnections(nextState.connections);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  // Save to local storage as backup
  useEffect(() => {
    if (cards.length === 0 && connections.length === 0) return;
    
    const timer = setTimeout(() => {
      localStorage.setItem('cards', JSON.stringify(cards));
      localStorage.setItem('connections', JSON.stringify(connections));
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [cards, connections]);

  // Delete selected cards
  const deleteSelectedCards = useCallback(() => {
    if (selectedCardIds.length > 0) {
      // Deselect cards through collaboration before deleting
      if (collaborationDeselectCard) {
        selectedCardIds.forEach(cardId => {
          if (isCardSelectedByMe && isCardSelectedByMe(cardId)) {
            collaborationDeselectCard(cardId);
          }
        });
      }
      
      deleteCard(selectedCardIds);
      setSelectedCardIds([]);
    }
  }, [selectedCardIds, deleteCard, collaborationDeselectCard, isCardSelectedByMe]);

  // Get a card by ID
  const getCardById = useCallback((id) => {
    return cards.find(card => card.id === id);
  }, [cards]);

  // Get connected cards for a given card ID
  const getConnectedCards = useCallback((cardId) => {
    const connectedCardIds = new Set();
    
    connections.forEach(conn => {
      if (conn.sourceId === cardId) {
        connectedCardIds.add(conn.targetId);
      } else if (conn.targetId === cardId) {
        connectedCardIds.add(conn.sourceId);
      }
    });
    
    return cards.filter(card => connectedCardIds.has(card.id));
  }, [cards, connections]);

  // Add card function for ActionBar
  const addCard = useCallback((type = 'category') => {
    const position = { x: 100, y: 100 };
    return createCard(type, position);
  }, [createCard]);

  // Context value
  const value = {
    cards,
    connections,
    selectedCardIds,
    setSelectedCardIds,
    loading,
    error,
    currentSpaceId,
    setCurrentSpace,
    connectMode,
    setConnectMode,
    createCard,
    createCategoryCard,
    createAnswerCard,
    createLabelCard,
    updateCard,
    updateCardDebounced,
    moveCard,
    finalizeMoveCard,
    deleteCard,
    connectCards,
    removeConnection,
    selectCard,
    clearSelection,
    undo,
    redo,
    deleteSelectedCards,
    getCardById,
    getConnectedCards,
    addCard
  };

  return (
    <CardContext.Provider value={value}>
      {children}
    </CardContext.Provider>
  );
};