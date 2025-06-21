import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const AuthContext = createContext();

// Custom hook to use AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch current user info
          const response = await api.get('/auth/me');
          setCurrentUser(response.data.user);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        // Check if error is due to suspended account
        if (error.response?.data?.suspended) {
          setIsSuspended(true);
          setError('Account suspended. Please contact administrator.');
        }
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login with email and password
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Save token and set in headers
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(user);
      navigate('/');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      // Check if error is due to suspended account
      if (error.response?.data?.suspended) {
        setIsSuspended(true);
        setError('Account suspended. Please contact administrator.');
      } else {
        setError(error.response?.data?.message || 'Login failed');
      }
      return false;
    }
  };

  // Login with Google
  const googleLogin = async (tokenId) => {
    try {
      setError(null);
      const response = await api.post('/auth/google', { token: tokenId });
      const { token, user } = response.data;
      
      // Save token and set in headers
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(user);
      navigate('/');
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      // Check if error is due to suspended account
      if (error.response?.data?.suspended) {
        setIsSuspended(true);
        setError('Account suspended. Please contact administrator.');
      } else {
        setError(error.response?.data?.message || 'Google login failed');
      }
      return false;
    }
  };

  // Register new user
  const register = async (name, email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', { name, email, password });
      const { token, user } = response.data;
      
      // Save token and set in headers
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(user);
      navigate('/');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setIsSuspended(false);
    setError(null);
    navigate('/login');
  };

  const value = {
    currentUser,
    loading,
    error,
    isSuspended,
    login,
    googleLogin,
    register,
    logout,
    setError,
    setIsSuspended
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 