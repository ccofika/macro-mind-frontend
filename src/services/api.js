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

// Add token to requests if available
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      // Redirect to login page if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    console.error('API Error:', error.response);
    return Promise.reject(error);
  }
);

// Auth-related API calls
export const authApi = {
  // Login with email and password
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },
  
  // Login with Google
  googleLogin: async (token) => {
    try {
      const response = await api.post('/auth/google', { token });
      return response.data;
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  },
  
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },
  
  // Get current user info
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }
};

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
      // Filter out any positions that don't have valid data
      const validPositions = positions.filter(pos => 
        pos && pos.id && pos.position && 
        typeof pos.position.x === 'number' && 
        typeof pos.position.y === 'number'
      );
      
      if (validPositions.length === 0) {
        console.warn('No valid positions to update');
        return { success: false, message: 'No valid positions to update' };
      }
      
      console.log(`Sending ${validPositions.length} valid card positions to server`);
      
      const response = await api.post('/cards/positions', { 
        positions: validPositions 
      });
      
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