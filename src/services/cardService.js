import api from './api';

export const cardService = {
  // Get all cards
  getAllCards: async () => {
    try {
      const response = await api.get('/cards');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch cards:', error);
      throw error;
    }
  },
  
  // Get single card by ID
  getCardById: async (id) => {
    try {
      const response = await api.get(`/cards/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch card ${id}:`, error);
      throw error;
    }
  },
  
  // Create new card
  createCard: async (cardData) => {
    try {
      const response = await api.post('/cards', cardData);
      return response.data;
    } catch (error) {
      console.error('Failed to create card:', error);
      throw error;
    }
  },
  
  // Update card
  updateCard: async (id, cardData) => {
    try {
      const response = await api.put(`/cards/${id}`, cardData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update card ${id}:`, error);
      throw error;
    }
  },
  
  // Delete card
  deleteCard: async (id) => {
    try {
      const response = await api.delete(`/cards/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete card ${id}:`, error);
      throw error;
    }
  },
  
  // Get connections
  getConnections: async () => {
    try {
      const response = await api.get('/connections');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      throw error;
    }
  },
  
  // Create connection
  createConnection: async (connectionData) => {
    try {
      const response = await api.post('/connections', connectionData);
      return response.data;
    } catch (error) {
      console.error('Failed to create connection:', error);
      throw error;
    }
  },
  
  // Delete connection
  deleteConnection: async (id) => {
    try {
      const response = await api.delete(`/connections/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete connection ${id}:`, error);
      throw error;
    }
  }
};