import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useCanvas } from './CanvasContext';
import { cardApi, connectionApi } from '../services/api';
import websocketService from '../services/websocketService';
import { cardService } from '../services/cardService';
import { useCollaboration } from './CollaborationContext';
import { CollaborationContext } from './CollaborationContext';

const CardContext = createContext();

export const useCards = () => {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('useCards must be used within a CardProvider');
  }
  return context;
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
  
  const { screenToCanvas } = useCanvas();

  // Get collaboration context for integrated selection
  const collaboration = useContext(useCollaboration);
  const {
    selectCard: collaborationSelectCard,
    deselectCard: collaborationDeselectCard,
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
      // Add the new card to the state if it's not already there
      setCards(prevCards => {
        const exists = prevCards.some(card => card.id === data.card.id);
        if (!exists) {
          console.log('CardContext: Adding new card from remote user:', data.card.title);
          return [...prevCards, data.card];
        }
        return prevCards;
      });
    };

    const handleCardUpdated = (data) => {
      console.log('CardContext: Received card updated event:', data);
      // Update the card in the state
      setCards(prevCards => {
        return prevCards.map(card => 
          card.id === data.card.id ? { ...card, ...data.card } : card
        );
      });
    };

    const handleCardDeleted = (data) => {
      console.log('CardContext: Received card deleted event:', data);
      // Remove the card from the state
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
      // Add the new connection if it doesn't exist
      setConnections(prevConnections => {
        const exists = prevConnections.some(conn => conn.id === data.connection.id);
        if (!exists) {
          console.log('CardContext: Adding new connection from remote user');
          return [...prevConnections, data.connection];
        }
        return prevConnections;
      });
    };

    const handleConnectionDeleted = (data) => {
      console.log('CardContext: Received connection deleted event:', data);
      // Remove the connection from the state
      setConnections(prevConnections => 
        prevConnections.filter(conn => conn.id !== data.connectionId)
      );
    };

    // Register event listeners
    websocketService.on('cardCreated', handleCardCreated);
    websocketService.on('cardUpdated', handleCardUpdated);
    websocketService.on('cardDeleted', handleCardDeleted);
    websocketService.on('connectionCreated', handleConnectionCreated);
    websocketService.on('connectionDeleted', handleConnectionDeleted);

    // Cleanup event listeners
    return () => {
      websocketService.off('cardCreated', handleCardCreated);
      websocketService.off('cardUpdated', handleCardUpdated);
      websocketService.off('cardDeleted', handleCardDeleted);
      websocketService.off('connectionCreated', handleConnectionCreated);
      websocketService.off('connectionDeleted', handleConnectionDeleted);
    };
  }, []);

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
    // Verify cards exist
    const sourceExists = cards.some(c => c.id === sourceId);
    const targetExists = cards.some(c => c.id === targetId);
    
    if (!sourceExists || !targetExists) return false;
    
    // Check if connection already exists
    const connectionExists = connections.some(
      c => c.sourceId === sourceId && c.targetId === targetId
    );
    
    if (connectionExists) return false;
    
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
      const savedConnection = await connectionApi.createConnection(sourceId, targetId, spaceId);
      
      // Update local state with server-generated ID
      setConnections(prev => prev.map(conn => 
        (conn.sourceId === sourceId && conn.targetId === targetId && conn.id === newConnection.id)
          ? savedConnection
          : conn
      ));
      
      // Notify other users via websocket
      websocketService.notifyConnectionCreated(savedConnection);
    } catch (err) {
      console.error("Failed to create connection on server:", err);
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
    
    const title = type === 'category' ? 'New Category' : 'New Answer';
    const content = type === 'answer' ? '' : null;
    
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

  // Update card
  const updateCard = useCallback(async (id, updates) => {
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
      
      // Get the updated card and notify other users
      const updatedCard = cards.find(card => card.id === id);
      if (updatedCard) {
        websocketService.notifyCardUpdated({ ...updatedCard, ...updates });
      }
    } catch (err) {
      console.error(`Failed to update card ${id} on server:`, err);
      // Card is still updated locally
    }
  }, [connections, addToHistory]);

  // Move card
  const moveCard = useCallback((id, position) => {
    setCards(prevCards => {
      return prevCards.map(card => 
        card.id === id 
          ? { ...card, position } 
          : card
      );
    });
  }, []);

  // Finalize move (add to history and update server)
  const finalizeMoveCard = useCallback(async () => {
    // Add current state to history
    addToHistory(cards, connections);
    
    try {
      console.log("Finalizing card positions...");
      
      // Get current positions of all cards
      const positions = cards.map(card => ({
        id: card.id,
        position: card.position
      }));
      
      console.log(`Sending ${positions.length} card positions to server`);
      
      // Ensure we have the latest state before sending to server
      // This is important because React state updates are asynchronous
      setTimeout(async () => {
        try {
          // Update positions on server in bulk with the latest state
          const latestPositions = cards.map(card => ({
            id: card.id,
            position: card.position
          }));
          
          const result = await cardApi.updateCardPositions(latestPositions);
          console.log("Card positions saved successfully:", result);
        } catch (err) {
          console.error("Failed to update card positions on server:", err);
        }
      }, 0);
    } catch (err) {
      console.error("Failed to prepare card positions update:", err);
    }
  }, [cards, connections, addToHistory]);

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
    // Find the connection to get its ID
    const connection = connections.find(
      c => c.sourceId === sourceId && c.targetId === targetId
    );
    
    if (!connection) return;
    
    setConnections(prev => {
      const newConnections = prev.filter(
        c => !(c.sourceId === sourceId && c.targetId === targetId)
      );
      addToHistory(cards, newConnections);
      return newConnections;
    });
    
    try {
      // Delete on server
      await connectionApi.deleteConnection(connection.id);
      
      // Notify other users via websocket
      websocketService.notifyConnectionDeleted(connection.id);
    } catch (err) {
      console.error("Failed to delete connection on server:", err);
      // Connection is still removed locally
    }
  }, [cards, connections, addToHistory]);

  // Handle card selection
  const selectCard = useCallback((id, isMultiSelect = false) => {
    // Use collaboration system for card selection
    if (collaborationSelectCard && !isMultiSelect) {
      // Single selection through collaboration system
      collaborationSelectCard(id);
      setSelectedCardIds([id]);
    } else {
      // Fallback to local selection for multi-select or when collaboration is not available
      setSelectedCardIds(prev => {
        if (isMultiSelect) {
          return prev.includes(id) 
            ? prev.filter(cardId => cardId !== id) // Deselect if already selected
            : [...prev, id]; // Add to selection
        } else {
          return [id]; // Single selection
        }
      });
    }
  }, [collaborationSelectCard]);

  // Clear selection
  const clearSelection = useCallback(() => {
    // Deselect current card through collaboration if applicable
    if (collaborationDeselectCard && selectedCardIds.length > 0) {
      selectedCardIds.forEach(cardId => {
        if (isCardSelectedByMe && isCardSelectedByMe(cardId)) {
          collaborationDeselectCard(cardId);
        }
      });
    }
    setSelectedCardIds([]);
  }, [collaborationDeselectCard, selectedCardIds, isCardSelectedByMe]);

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
    createCard,
    createCategoryCard,
    createAnswerCard,
    updateCard,
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