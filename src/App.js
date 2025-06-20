import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';

// Components
import Canvas from './components/Canvas/Canvas';
import NavBar from './components/NavBar/NavBar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AIChatWindow from './components/AIChat/AIChatWindow';

// Admin Components
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminProtectedRoute from './components/Admin/AdminProtectedRoute';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CanvasProvider } from './context/CanvasContext';
import { CardProvider } from './context/CardContext';
import { AIProvider } from './context/AIContext';
import { CollaborationProvider } from './context/CollaborationContext';
import { AIChatProvider } from './context/AIChatContext';

function App() {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  return (
    <Router>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route element={<AdminProtectedRoute />}>
                <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
              </Route>
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route
                  path="/"
                  element={
                    <CanvasProvider>
                      <CardProvider>
                        <AIProvider>
                          <CollaborationProvider>
                            <AIChatProvider>
                              <>
                                <NavBar />
                                <Canvas />
                                <AIChatWindow />
                              </>
                            </AIChatProvider>
                          </CollaborationProvider>
                        </AIProvider>
                      </CardProvider>
                    </CanvasProvider>
                  }
                />
              </Route>
              
              {/* Redirect any unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </GoogleOAuthProvider>
    </Router>
  );
}

export default App;