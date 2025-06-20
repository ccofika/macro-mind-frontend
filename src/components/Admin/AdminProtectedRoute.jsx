import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import adminService from '../../services/adminService';

const AdminProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        
        if (!token) {
          setLoading(false);
          return;
        }

        // Verify token with backend
        const response = await adminService.verifyToken();
        
        if (response.success) {
          setIsAuthenticated(true);
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      } catch (error) {
        console.error('Admin auth check failed:', error);
        // Remove invalid tokens
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAuth();
  }, []);

  if (loading) {
    return (
      <div className="admin-loading-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default AdminProtectedRoute; 