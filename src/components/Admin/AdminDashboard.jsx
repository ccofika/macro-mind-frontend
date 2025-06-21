import React, { useState, useEffect, useContext } from 'react';
import './AdminDashboard.css';
import AuthContext from '../../context/AuthContext';
import AdminOverview from './AdminOverview';
import AdminUsersCards from './AdminUsersCards';
import AdminAIAnalytics from './AdminAIAnalytics';
import AdminUserManagement from './AdminUserManagement';
import AdminAIManagement from './AdminAIManagement';
import AdminDatabaseManagement from './AdminDatabaseManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const { currentUser, logout } = useContext(AuthContext);

  useEffect(() => {
    // Check if user has admin privileges
    if (!currentUser || currentUser.role !== 'super_admin') {
      window.location.href = '/';
      return;
    }
    setAdminData(currentUser);
  }, [currentUser]);

  const navigationItems = [
    {
      id: 'overview',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="9" x2="9" y2="15"/>
          <line x1="15" y1="9" x2="15" y2="15"/>
          <line x1="9" y1="12" x2="15" y2="12"/>
        </svg>
      ),
      title: 'Overview Dashboard',
      description: 'Platform analytics & insights'
    },
    {
      id: 'users-cards',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      title: 'Users & Cards',
      description: 'User behavior analytics'
    },
    {
      id: 'ai-analytics',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
          <path d="m8.5 8.5l7 7m0-7l-7 7"/>
        </svg>
      ),
      title: 'AI Analytics',
      description: 'AI usage & performance'
    },
    {
      id: 'user-management',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
      ),
      title: 'User Management',
      description: 'Manage user accounts'
    },
    {
      id: 'ai-management',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      ),
      title: 'AI Management',
      description: 'AI system control'
    },
    {
      id: 'database',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>
      ),
      title: 'Database',
      description: 'Database management'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview setActiveTab={setActiveTab} />;
      case 'users-cards':
        return <AdminUsersCards />;
      case 'ai-analytics':
        return <AdminAIAnalytics />;
      case 'user-management':
        return <AdminUserManagement />;
      case 'ai-management':
        return <AdminAIManagement />;
      case 'database':
        return <AdminDatabaseManagement />;
      default:
        return <AdminOverview setActiveTab={setActiveTab} />;
    }
  };

  if (!adminData) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner">
          <svg className="animate-spin" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
              <animate attributeName="stroke-array" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
              <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="admin-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            {sidebarExpanded && (
              <div className="logo-text">
                <h2>Admin Panel</h2>
                <p>MacroMebit Control Center</p>
              </div>
            )}
          </div>
          
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={sidebarExpanded ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}/>
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="nav-icon">{item.icon}</div>
              {sidebarExpanded && (
                <div className="nav-content">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Admin Info & Logout */}
        <div className="sidebar-footer">
          {sidebarExpanded && (
            <div className="admin-info">
              <div className="admin-avatar">
                {adminData.picture ? (
                  <img src={adminData.picture} alt="Admin" />
                ) : (
                  <div className="avatar-placeholder">
                    {adminData.name?.charAt(0) || 'A'}
                  </div>
                )}
              </div>
              <div className="admin-details">
                <h4>{adminData.name}</h4>
                <p>{adminData.email}</p>
                <span className="admin-badge">Super Admin</span>
              </div>
            </div>
          )}
          
          <button className="logout-button" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {sidebarExpanded && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <div className="admin-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 