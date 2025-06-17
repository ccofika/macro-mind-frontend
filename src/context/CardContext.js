import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useCanvas } from './CanvasContext';
import { cardApi, connectionApi } from '../services/api';

const CardContext = createContext();

export const useCards = () => useContext(CardContext);

export const CardProvider = ({ children }) => {
  const [cards, setCards] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const { screenToCanvas } = useCanvas();

  // Load initial data from server
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load cards from server
        const cardsData = await cardApi.getAllCards();
        setCards(cardsData);
        
        // Load connections from server
        const connectionsData = await connectionApi.getAllConnections();
        setConnections(connectionsData);
      } catch (err) {
        console.error("Failed to load data from server:", err);
        setError("Failed to load cards and connections from server");
        
        // Try to load from localStorage as fallback
        try {
          const savedCards = localStorage.getItem('cards');
          const savedConnections = localStorage.getItem('connections');
          
          if (savedCards) setCards(JSON.parse(savedCards));
          if (savedConnections) setConnections(JSON.parse(savedConnections));
        } catch (localErr) {
          console.error("Also failed to load from localStorage:", localErr);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
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
      // Create on server
      const savedConnection = await connectionApi.createConnection(sourceId, targetId);
      
      // Update local state with server-generated ID
      setConnections(prev => prev.map(conn => 
        (conn.sourceId === sourceId && conn.targetId === targetId && conn.id === newConnection.id)
          ? savedConnection
          : conn
      ));
    } catch (err) {
      console.error("Failed to create connection on server:", err);
      // Connection still exists locally
    }
    
    return true;
  }, [cards, connections, addToHistory]);

  // Create a new card (generic function)
  const createCard = useCallback(async (type, position, parentId = null) => {
    const title = type === 'category' ? 'New Category' : 'New Answer';
    const content = type === 'answer' ? '' : null;
    
    const newCard = {
      id: uuidv4(),
      type,
      title,
      content,
      position,
      parentId,
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
      
      // If there's a parent, create a connection
      if (parentId) {
        connectCards(parentId, savedCard.id);
      }
      
      return savedCard.id;
    } catch (err) {
      console.error("Failed to create card on server:", err);
      return newCard.id;
    }
  }, [cards, connections, addToHistory, connectCards]);

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
    } catch (err) {
      console.error("Failed to delete connection on server:", err);
      // Connection is still removed locally
    }
  }, [cards, connections, addToHistory]);

  // Handle card selection
  const selectCard = useCallback((id, isMultiSelect = false) => {
    setSelectedCardIds(prev => {
      if (isMultiSelect) {
        return prev.includes(id) 
          ? prev.filter(cardId => cardId !== id) // Deselect if already selected
          : [...prev, id]; // Add to selection
      } else {
        return [id]; // Single selection
      }
    });
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedCardIds([]);
  }, []);

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
      deleteCard(selectedCardIds);
      setSelectedCardIds([]);
    }
  }, [selectedCardIds, deleteCard]);

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
    loading,
    error,
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