import axios from 'axios';

// Base API URL - adjust for production/development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response);
    return Promise.reject(error);
  }
);

// Card-related API calls
export const cardApi = {
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
      console.error('Failed to update card:', error);
      throw error;
    }
  },
  
  // Delete card
  deleteCard: async (id) => {
    try {
      const response = await api.delete(`/cards/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete card:', error);
      throw error;
    }
  },
  
  // Delete multiple cards
  deleteMultipleCards: async (ids) => {
    try {
      const response = await api.post('/cards/multiple/delete', { ids });
      return response.data;
    } catch (error) {
      console.error('Failed to delete multiple cards:', error);
      throw error;
    }
  },
  
  // Update card positions in bulk
  updateCardPositions: async (positions) => {
    try {
      const response = await api.post('/cards/positions', { positions });
      return response.data;
    } catch (error) {
      console.error('Failed to update card positions:', error);
      throw error;
    }
  }
};

// Connection-related API calls
export const connectionApi = {
  // Get all connections
  getAllConnections: async () => {
    try {
      const response = await api.get('/cards/connections');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      throw error;
    }
  },
  
  // Create new connection
  createConnection: async (sourceId, targetId) => {
    try {
      const response = await api.post('/cards/connections', { sourceId, targetId });
      return response.data;
    } catch (error) {
      console.error('Failed to create connection:', error);
      throw error;
    }
  },
  
  // Delete connection
  deleteConnection: async (id) => {
    try {
      const response = await api.delete(`/cards/connections/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete connection:', error);
      throw error;
    }
  }
};

// Canvas state API calls
export const canvasApi = {
  // Save canvas state
  saveCanvasState: async (zoom, pan) => {
    try {
      const response = await api.post('/cards/canvas-state', { zoom, pan });
      return response.data;
    } catch (error) {
      console.error('Failed to save canvas state:', error);
      throw error;
    }
  }
};

export default api;