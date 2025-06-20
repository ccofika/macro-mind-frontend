import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth header
const createAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get user navigation preferences
export const getUserNavPreferences = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/nav-preferences`, {
      headers: createAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error getting user nav preferences:', error);
    throw error;
  }
};

// Update navigation categories
export const updateNavCategories = async (categories) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/users/nav-categories`, 
      { categories },
      { headers: createAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating nav categories:', error);
    throw error;
  }
};

// Add navigation link
export const addNavLink = async (linkData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/nav-links`, 
      linkData,
      { headers: createAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding nav link:', error);
    throw error;
  }
};

// Update navigation link
export const updateNavLink = async (linkId, linkData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/users/nav-links/${linkId}`, 
      linkData,
      { headers: createAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating nav link:', error);
    throw error;
  }
};

// Delete navigation link
export const deleteNavLink = async (linkId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/users/nav-links/${linkId}`, {
      headers: createAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting nav link:', error);
    throw error;
  }
}; 