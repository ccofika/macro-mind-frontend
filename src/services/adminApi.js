import axios from 'axios';

// Base API URL - adjust for production/development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create separate axios instance for admin operations
const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add admin token to requests if available
adminApi.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Admin-specific error handling interceptor
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors for admin (token expired or invalid)
    if (error.response && error.response.status === 401) {
      // Remove admin tokens
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      delete adminApi.defaults.headers.common['Authorization'];
      
      // Redirect to admin login page if not already there
      if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    
    console.error('Admin API Error:', error.response);
    return Promise.reject(error);
  }
);

export default adminApi; 