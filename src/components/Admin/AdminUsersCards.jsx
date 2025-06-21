import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './AdminPages.css';

const AdminUsersCards = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, [timeRange, sortBy, sortOrder, filterBy, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getUsersAndCardsAnalytics({
        timeRange,
        sortBy,
        sortOrder,
        filterBy,
        search: searchTerm,
        page: currentPage,
        limit: 20
      });
      if (response.success) {
        setOverviewData(response.data);
      } else {
        setError(response.message || 'Failed to load analytics data');
      }
    } catch (err) {
      console.error('Users & Cards analytics error:', err);
      setError(err.message || 'Error loading analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = () => {
    setCurrentPage(1);
    fetchData();
  };

  const exportData = async (format) => {
    try {
      console.log(`🚀 Starting ${format.toUpperCase()} export...`);
      
      const exportParams = {
        format: format,
        search: searchTerm,
        filterBy: filterBy,
        timeRange: timeRange,
        includeCards: 'true',
        includeStats: 'true'
      };

      await adminService.exportUsersCardsData(exportParams);
      console.log(`✅ ${format.toUpperCase()} export completed successfully`);
      
    } catch (error) {
      console.error('❌ Export error:', error);
      setError(`Export failed: ${error.message}`);
    }
  };

  // Action handlers for user management
  const handleViewUser = async (user) => {
    try {
      console.log('👁️ Viewing user details:', user.name, user.email);
      
      // Create a detailed user modal or redirect to user detail page
      const userDetails = {
        ...user,
        joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown',
        lastLoginFormatted: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
        statusText: getUserStatusText(user),
        cardText: `${user.cardCount || 0} cards created`,
        spaceText: `${user.spaceCount || 0} spaces owned`
      };

      // For now, show alert with user details (can be replaced with modal)
      alert(`User Details:
Name: ${userDetails.name || 'Unknown'}
Email: ${userDetails.email}
Joined: ${userDetails.joinDate}
Last Login: ${userDetails.lastLoginFormatted}
Status: ${userDetails.statusText}
${userDetails.cardText}
${userDetails.spaceText}`);
      
    } catch (error) {
      console.error('❌ Error viewing user:', error);
      setError(`Failed to view user: ${error.message}`);
    }
  };

  const handleEditUser = async (user) => {
    try {
      console.log('✏️ Editing user:', user.name, user.email);
      
      // For now, show a simple prompt (can be replaced with modal)
      const newName = prompt(`Edit user name for ${user.email}:`, user.name || '');
      if (newName !== null && newName.trim() !== '') {
        // Call API to update user
        await adminService.updateUser(user._id, { name: newName.trim() });
        console.log('✅ User updated successfully');
        
        // Refresh data
        await fetchData();
      }
      
    } catch (error) {
      console.error('❌ Error editing user:', error);
      setError(`Failed to edit user: ${error.message}`);
    }
  };

  const handleToggleUserStatus = async (user) => {
    const action = user.suspended ? 'activate' : 'suspend';
    
    try {
      console.log('🔄 Toggling user status:', user.name, user.email);
      
      const confirm = window.confirm(`Are you sure you want to ${action} user ${user.name || user.email}?`);
      
      if (confirm) {
        await adminService.toggleUserStatus(user._id, !user.suspended);
        console.log(`✅ User ${action}d successfully`);
        
        // Refresh data
        await fetchData();
      }
      
    } catch (error) {
      console.error('❌ Error toggling user status:', error);
      setError(`Failed to ${action} user: ${error.message}`);
    }
  };

  // SVG Icons - Professional white icons
  const SpinnerIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinner-icon">
      <path d="M21 12a9 9 0 11-6.219-8.56"/>
    </svg>
  );

  const WarningIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );

  const RefreshIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  );

  const UsersIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );

  const UserCheckIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <polyline points="16 11 18 13 22 9"/>
    </svg>
  );

  const CardIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );

  const LinkIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );

  const TrendingUpIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  );

  const BarChartIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="20" x2="12" y2="10"/>
      <line x1="18" y1="20" x2="18" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="16"/>
    </svg>
  );

  const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  );

  const FilterIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );

  const DownloadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );

  const EyeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );

  const ChevronLeftIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );

  const ChevronRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );

  const ArrowUpIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="19" x2="12" y2="5"/>
      <polyline points="5 12 12 5 19 12"/>
    </svg>
  );

  const ArrowDownIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <polyline points="5 12 12 19 19 12"/>
    </svg>
  );

  const getUserStatus = (user) => {
    if (user.suspended) return 'suspended';
    if (user.isActive) return 'active';
    return 'inactive';
  };

  const getUserStatusText = (user) => {
    const status = getUserStatus(user);
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getCardTypeIcon = (type) => {
    switch (type) {
      case 'text':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 7 4 4 20 4 20 7"/>
            <line x1="9" y1="20" x2="15" y2="20"/>
            <line x1="12" y1="4" x2="12" y2="20"/>
          </svg>
        );
      case 'image':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        );
      case 'link':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>
            <UsersIcon />
            Users & Cards Analytics
          </h1>
          <p>Loading comprehensive user behavior analytics...</p>
        </div>
      <div className="admin-loading">
          <SpinnerIcon />
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>
            <UsersIcon />
            Users & Cards Analytics
          </h1>
          <p>Comprehensive user behavior analytics</p>
        </div>
      <div className="admin-error">
          <WarningIcon />
          <h3>Error Loading Analytics</h3>
        <p>{error}</p>
          <button className="admin-retry-btn" onClick={fetchData}>
            <RefreshIcon />
          Retry
        </button>
        </div>
      </div>
    );
  }

  const { 
    users = { data: [], totalCount: 0, currentPage: 1, totalPages: 1 },
    cardAnalytics = {},
    collaborationPatterns = {},
    connectionPatterns = {}
  } = overviewData || {};

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="header-content">
          <h1>
            <UsersIcon />
            Users & Cards Analytics
          </h1>
          <p>Comprehensive analytics for user activity and card creation patterns</p>
        </div>
        <div className="header-actions">
          <div className="time-range-selector">
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="admin-select">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          <button 
            className={`admin-refresh-button ${refreshing ? 'refreshing' : ''}`} 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshIcon />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChartIcon />
            Overview
          </button>
          <button 
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <UsersIcon />
            Users Detail
          </button>
          <button 
            className={`admin-tab ${activeTab === 'cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('cards')}
          >
            <CardIcon />
            Cards Analysis
          </button>
          <button 
            className={`admin-tab ${activeTab === 'trends' ? 'active' : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            <TrendingUpIcon />
            Trends
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            {/* Main Stats Grid */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card primary">
                <div className="admin-stat-icon">
                  <UsersIcon />
                </div>
                <div className="admin-stat-info">
                  <h3>Total Users</h3>
                  <p className="admin-stat-value">{users.totalCount || 0}</p>
                  <span className="admin-stat-change positive">
                    <ArrowUpIcon />
                    +{cardAnalytics.newUsersThisPeriod || 0} this period
                  </span>
                </div>
              </div>

              <div className="admin-stat-card success">
                <div className="admin-stat-icon">
                  <UserCheckIcon />
                </div>
                <div className="admin-stat-info">
                  <h3>Active Users</h3>
                  <p className="admin-stat-value">{cardAnalytics.activeUsers || 0}</p>
                  <span className="admin-stat-change">
                    {Math.round((cardAnalytics.activeUsers / users.totalCount) * 100 || 0)}% of total
                  </span>
                </div>
              </div>

              <div className="admin-stat-card info">
                <div className="admin-stat-icon">
                  <CardIcon />
                </div>
                <div className="admin-stat-info">
                  <h3>Total Cards</h3>
                  <p className="admin-stat-value">{cardAnalytics.totalCards || 0}</p>
                  <span className="admin-stat-change positive">
                    <ArrowUpIcon />
                    +{cardAnalytics.newCardsThisPeriod || 0} this period
                  </span>
                </div>
              </div>

              <div className="admin-stat-card warning">
                <div className="admin-stat-icon">
                  <LinkIcon />
                </div>
                <div className="admin-stat-info">
                  <h3>Connections</h3>
                  <p className="admin-stat-value">{connectionPatterns.totalConnections || 0}</p>
                  <span className="admin-stat-change">
                    Avg {Math.round(connectionPatterns.avgConnectionsPerUser || 0)} per user
                  </span>
                </div>
              </div>
            </div>

            {/* Collaboration Insights */}
            <div className="admin-dashboard-grid">
              <div className="activity-section">
                <h2>
                  <UsersIcon />
                  User Collaboration Patterns
                </h2>
                <div className="collaboration-stats">
                  <div className="collab-stat">
                    <h4>Average Members per Space</h4>
                    <span className="stat-value">{Math.round(collaborationPatterns.avgMembersPerSpace || 0)}</span>
                  </div>
                  <div className="collab-stat">
                    <h4>Public Spaces</h4>
                    <span className="stat-value">{collaborationPatterns.publicSpaceCount || 0}</span>
                    </div>
                  <div className="collab-stat">
                    <h4>Private Spaces</h4>
                    <span className="stat-value">{collaborationPatterns.privateSpaceCount || 0}</span>
                    </div>
                  <div className="collab-stat">
                    <h4>Total Workspaces</h4>
                    <span className="stat-value">{collaborationPatterns.totalSpaces || 0}</span>
                  </div>
                </div>
              </div>

              <div className="top-users-section">
                <h2>
                  <TrendingUpIcon />
                  Most Active Card Creators
                </h2>
                <div className="user-list">
                  {cardAnalytics.slice && cardAnalytics.slice(0, 5).map((creator, index) => (
                    <div key={creator._id} className="user-item">
                      <div className="user-rank">#{index + 1}</div>
                      <div className="user-avatar">
                        {creator.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="user-info">
                        <h4>{creator.name || 'Unknown User'}</h4>
                        <span>{creator.cardCount || 0} cards created</span>
                      </div>
                      <div className="user-stats">
                        <div className="stat-badge">{creator.cardCount || 0}</div>
            </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="admin-quick-actions">
              <h2>
                <FilterIcon />
                Quick Actions
              </h2>
              <div className="action-grid">
                <div className="admin-action-card" onClick={() => setActiveTab('users')}>
                  <div className="admin-action-icon">
                    <UsersIcon />
                  </div>
                  <div className="action-content">
                    <h3>Manage Users</h3>
                    <p>View detailed user analytics and management tools</p>
                  </div>
                </div>
                <div className="admin-action-card" onClick={() => setActiveTab('cards')}>
                  <div className="action-icon">
                    <CardIcon />
                  </div>
                  <div className="action-content">
                    <h3>Card Analytics</h3>
                    <p>Analyze card creation patterns and connections</p>
                  </div>
                </div>
                <div className="admin-action-card" onClick={() => exportData('csv')}>
                  <div className="action-icon">
                    <DownloadIcon />
                  </div>
                  <div className="action-content">
                    <h3>Export Data</h3>
                    <p>Download comprehensive analytics reports</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Detail Tab */}
        {activeTab === 'users' && (
          <div className="tab-content">
            {/* Controls */}
            <div className="admin-controls">
              <div className="admin-search-container">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={handleSearch}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                  className="admin-search-input"
                />
                <button className="admin-btn primary" onClick={handleSearchSubmit}>
                  Search
                </button>
              </div>
              
              <div className="admin-filters">
                <div className="admin-filter-group">
                  <FilterIcon />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="admin-select">
                  <option value="createdAt">Sort by: Created Date</option>
                  <option value="lastLogin">Sort by: Last Login</option>
                  <option value="cardCount">Sort by: Card Count</option>
                  <option value="name">Sort by: Name</option>
                </select>
                </div>
                
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="admin-select">
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
                
                <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)} className="admin-select">
                  <option value="all">All Users</option>
                  <option value="active">Active Users</option>
                  <option value="inactive">Inactive Users</option>
                </select>
              </div>
              
              <div className="admin-actions">
                <button className="admin-btn secondary" onClick={() => exportData('csv')}>
                  <DownloadIcon />
                  Export CSV
                </button>
                <button className="admin-btn secondary" onClick={() => exportData('json')}>
                  <DownloadIcon />
                  Export JSON
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Cards Created</th>
                    <th>Spaces</th>
                    <th>Last Login</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <strong>{user.name || 'Unknown User'}</strong>
                            <small>ID: {user._id.slice(-8)}</small>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className="admin-badge info">{user.cardCount || 0}</span>
                      </td>
                      <td>
                        <span className="admin-badge primary">{user.spaceCount || 0}</span>
                      </td>
                      <td>
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'Never'
                        }
                      </td>
                      <td>
                        <span className={`status-badge ${getUserStatus(user)}`}>
                          {getUserStatusText(user)}
                        </span>
                      </td>
                      <td>
                        <div className="admin-action-buttons">
                          <button 
                            className="action-btn view" 
                            title="View Details"
                            onClick={() => handleViewUser(user)}
                          >
                            <EyeIcon />
                          </button>
                          <button 
                            className="action-btn edit" 
                            title="Edit User"
                            onClick={() => handleEditUser(user)}
                          >
                            <EditIcon />
                          </button>
                          <button 
                            className={`action-btn ${user.suspended ? 'activate' : 'suspend'}`}
                            title={user.suspended ? 'Activate User' : 'Suspend User'}
                            onClick={() => handleToggleUserStatus(user)}
                          >
                            {user.suspended ? '✓' : '✗'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="admin-pagination">
              <div className="admin-pagination-info">
                Showing {((users.currentPage - 1) * 20) + 1} to {Math.min(users.currentPage * 20, users.totalCount)} of {users.totalCount} users
              </div>
              <div className="admin-pagination-controls">
                <button 
                  className="admin-pagination-btn" 
                  disabled={users.currentPage <= 1}
                  onClick={() => {
                    setCurrentPage(users.currentPage - 1);
                  }}
                >
                  <ChevronLeftIcon />
                Previous
              </button>
                <span className="admin-pagination-pages">
                  Page {users.currentPage} of {users.totalPages}
              </span>
                <button 
                  className="admin-pagination-btn" 
                  disabled={users.currentPage >= users.totalPages}
                  onClick={() => {
                    setCurrentPage(users.currentPage + 1);
                  }}
                >
                  Next
                  <ChevronRightIcon />
              </button>
              </div>
            </div>
          </div>
        )}

        {/* Cards Analysis Tab */}
        {activeTab === 'cards' && (
          <div className="tab-content">
            {/* Card Stats */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card primary">
                <div className="admin-stat-icon">
                  <CardIcon />
                </div>
                <div className="admin-stat-info">
                  <h3>Total Cards</h3>
                  <p className="admin-stat-value">{cardAnalytics.totalCards || 0}</p>
                  <span className="admin-stat-change">
                    Across all users
                  </span>
                </div>
              </div>

              <div className="admin-stat-card success">
                <div className="admin-stat-icon">
                  <LinkIcon />
                </div>
                <div className="admin-stat-info">
                  <h3>Total Connections</h3>
                  <p className="admin-stat-value">{connectionPatterns.totalConnections || 0}</p>
                  <span className="admin-stat-change">
                    Between cards
                  </span>
                </div>
              </div>

              <div className="admin-stat-card info">
                <div className="admin-stat-icon">
                  <TrendingUpIcon />
                </div>
                <div className="admin-stat-info">
                  <h3>Cards per User</h3>
                  <p className="admin-stat-value">{Math.round((cardAnalytics.totalCards / users.totalCount) || 0)}</p>
                  <span className="admin-stat-change">
                    Average ratio
                  </span>
                </div>
              </div>

              <div className="admin-stat-card warning">
                <div className="admin-stat-icon">
                  <UsersIcon />
                </div>
                <div className="admin-stat-info">
                  <h3>Active Connectors</h3>
                  <p className="admin-stat-value">{connectionPatterns.activeConnectors || 0}</p>
                  <span className="admin-stat-change">
                    Users creating connections
                  </span>
                </div>
              </div>
            </div>

            {/* Card Creation Activity */}
            <div className="admin-dashboard-grid">
              <div className="activity-section">
                <h2>
                  <CardIcon />
                  Card Creation Patterns
                </h2>
                <div className="activity-list">
                  {cardAnalytics.slice && cardAnalytics.slice(0, 8).map((creator, index) => (
                    <div key={creator._id} className="activity-item">
                      <div className="activity-avatar card">
                        <CardIcon />
                      </div>
                      <div className="activity-details">
                        <p><strong>User {creator._id.slice(-8)}</strong> created <strong>{creator.cardCount}</strong> cards</p>
                        <small>Last card: {creator.lastCardCreated ? new Date(creator.lastCardCreated).toLocaleDateString() : 'Unknown'}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="top-users-section">
                <h2>
                  <TrendingUpIcon />
                  Connection Statistics
                </h2>
                <div className="collaboration-stats">
                  <div className="collab-stat">
                    <h4>Average Connections per User</h4>
                    <span className="stat-value">{Math.round(connectionPatterns.avgConnectionsPerUser || 0)}</span>
                  </div>
                  <div className="collab-stat">
                    <h4>Most Connected User</h4>
                    <span className="stat-value">{connectionPatterns.maxConnections || 0}</span>
                  </div>
                  <div className="collab-stat">
                    <h4>Connection Rate</h4>
                    <span className="stat-value">{Math.round((connectionPatterns.activeConnectors / users.totalCount) * 100 || 0)}%</span>
                    </div>
                  <div className="collab-stat">
                    <h4>Total Network Nodes</h4>
                    <span className="stat-value">{(cardAnalytics.totalCards || 0) + (connectionPatterns.totalConnections || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="tab-content">
            {/* Trends Overview Stats */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card primary">
                <div className="admin-stat-icon">
                  <TrendingUpIcon />
                </div>
                <div className="admin-stat-info">
                  <h3>Growth Rate</h3>
                  <p className="admin-stat-value">
                    {Math.round(((cardAnalytics.newUsersThisPeriod / Math.max(users.totalCount - cardAnalytics.newUsersThisPeriod, 1)) * 100) || 0)}%
                  </p>
                  <span className="admin-stat-change positive">
                    <ArrowUpIcon />
                    User growth this period
                  </span>
                </div>
              </div>

              <div className="admin-stat-card success">
                <div className="admin-stat-icon">
                  <CardIcon />
                </div>
                <div className="admin-stat-info">
                  <h3>Activity Score</h3>
                  <p className="admin-stat-value">
                    {Math.round(((cardAnalytics.newCardsThisPeriod / Math.max(cardAnalytics.totalCards - cardAnalytics.newCardsThisPeriod, 1)) * 100) || 0)}%
                  </p>
                  <span className="admin-stat-change positive">
                    <ArrowUpIcon />
                    Card creation trend
                  </span>
                </div>
              </div>

              <div className="admin-stat-card info">
                <div className="admin-stat-icon">
                  <UsersIcon />
                </div>
                <div className="admin-stat-info">
                  <h3>Engagement Rate</h3>
                  <p className="admin-stat-value">
                    {Math.round((cardAnalytics.activeUsers / Math.max(users.totalCount, 1)) * 100 || 0)}%
                  </p>
                  <span className="admin-stat-change">
                    Active users ratio
                  </span>
                </div>
              </div>

              <div className="admin-stat-card warning">
                <div className="admin-stat-icon">
                  <LinkIcon />
                </div>
                <div className="admin-stat-info">
                  <h3>Connection Density</h3>
                  <p className="admin-stat-value">
                    {Math.round((connectionPatterns.totalConnections / Math.max(cardAnalytics.totalCards, 1)) * 100 || 0)}%
                  </p>
                  <span className="admin-stat-change">
                    Cards with connections
                  </span>
                </div>
              </div>
            </div>

            {/* Trends Charts Section */}
            <div className="admin-dashboard-grid">
              <div className="trends-chart-section">
                <h2>
                  <BarChartIcon />
                  Platform Growth Overview
                </h2>
                <div className="trends-chart">
                  <div className="chart-header">
                    <div className="chart-stats">
                      <div className="chart-stat">
                        <span className="stat-label">Total Users</span>
                        <span className="stat-value">{users.totalCount || 0}</span>
                      </div>
                      <div className="chart-stat">
                        <span className="stat-label">Total Cards</span>
                        <span className="stat-value">{cardAnalytics.totalCards || 0}</span>
                      </div>
                      <div className="chart-stat">
                        <span className="stat-label">Total Spaces</span>
                        <span className="stat-value">{collaborationPatterns.totalSpaces || 0}</span>
                      </div>
                      <div className="chart-stat">
                        <span className="stat-label">Connections</span>
                        <span className="stat-value">{connectionPatterns.totalConnections || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="simple-chart">
                    {(users.totalCount > 0 || cardAnalytics.totalCards > 0 || collaborationPatterns.totalSpaces > 0 || connectionPatterns.totalConnections > 0) ? (
                      <div className="chart-bars">
                        <div className="chart-bar-container">
                          <div 
                            className="chart-bar users" 
                            style={{ 
                              height: `${Math.max((users.totalCount / Math.max(users.totalCount, cardAnalytics.totalCards, collaborationPatterns.totalSpaces, connectionPatterns.totalConnections)) * 100, 5)}%` 
                            }}
                          ></div>
                          <span className="chart-label">Users</span>
                        </div>
                        <div className="chart-bar-container">
                          <div 
                            className="chart-bar cards" 
                            style={{ 
                              height: `${Math.max((cardAnalytics.totalCards / Math.max(users.totalCount, cardAnalytics.totalCards, collaborationPatterns.totalSpaces, connectionPatterns.totalConnections)) * 100, 5)}%` 
                            }}
                          ></div>
                          <span className="chart-label">Cards</span>
                        </div>
                        <div className="chart-bar-container">
                          <div 
                            className="chart-bar spaces" 
                            style={{ 
                              height: `${Math.max((collaborationPatterns.totalSpaces / Math.max(users.totalCount, cardAnalytics.totalCards, collaborationPatterns.totalSpaces, connectionPatterns.totalConnections)) * 100, 5)}%` 
                            }}
                          ></div>
                          <span className="chart-label">Spaces</span>
                        </div>
                        <div className="chart-bar-container">
                          <div 
                            className="chart-bar connections" 
                            style={{ 
                              height: `${Math.max((connectionPatterns.totalConnections / Math.max(users.totalCount, cardAnalytics.totalCards, collaborationPatterns.totalSpaces, connectionPatterns.totalConnections)) * 100, 5)}%` 
                            }}
                          ></div>
                          <span className="chart-label">Connections</span>
                        </div>
                      </div>
                    ) : (
                      <div className="no-chart-data">
                        <BarChartIcon />
                        <p>No data available for visualization</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="top-users-section">
                <h2>
                  <TrendingUpIcon />
                  User Engagement Metrics
                </h2>
                <div className="engagement-stats">
                  <div className="engagement-stat success">
                    <h4>High Activity Users</h4>
                    <span className="stat-value">
                      {cardAnalytics.slice ? cardAnalytics.filter(user => user.cardCount > 5).length : 0}
                    </span>
                    <small>Created 5+ cards</small>
                  </div>
                  <div className="engagement-stat info">
                    <h4>Moderate Activity</h4>
                    <span className="stat-value">
                      {cardAnalytics.slice ? cardAnalytics.filter(user => user.cardCount >= 2 && user.cardCount <= 5).length : 0}
                    </span>
                    <small>Created 2-5 cards</small>
                  </div>
                  <div className="engagement-stat warning">
                    <h4>Low Activity</h4>
                    <span className="stat-value">
                      {cardAnalytics.slice ? cardAnalytics.filter(user => user.cardCount === 1).length : 0}
                    </span>
                    <small>Created 1 card</small>
                  </div>
                  <div className="engagement-stat">
                    <h4>No Activity</h4>
                    <span className="stat-value">
                      {Math.max((users.totalCount || 0) - (cardAnalytics.length || 0), 0)}
                    </span>
                    <small>No cards created</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Contributors */}
            <div className="admin-dashboard-grid">
              <div className="activity-section">
                <h2>
                  <UsersIcon />
                  Top Contributors This Period
                </h2>
                <div className="user-list">
                  {cardAnalytics.slice && cardAnalytics.slice(0, 10).map((creator, index) => (
                    <div key={creator._id} className="user-item">
                      <div className="user-rank">#{index + 1}</div>
                      <div className="user-avatar">
                        {creator.name?.charAt(0).toUpperCase() || creator._id.slice(-2).toUpperCase()}
                      </div>
                      <div className="user-info">
                        <h4>{creator.name || `User ${creator._id.slice(-8)}`}</h4>
                        <span>{creator.cardCount || 0} cards created</span>
                        {creator.lastCardCreated && (
                          <small>Last: {new Date(creator.lastCardCreated).toLocaleDateString()}</small>
                        )}
                      </div>
                      <div className="user-stats">
                        <div className="stat-types">
                          <div className="stat-badge">{creator.cardCount || 0}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!cardAnalytics.slice || cardAnalytics.length === 0) && (
                    <div className="no-data">
                      <p className="admin-info-text">No card creation data available</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="top-users-section">
                <h2>
                  <LinkIcon />
                  Connection Trends
                </h2>
                <div className="collaboration-stats">
                  <div className="collab-stat">
                    <h4>Total Network Size</h4>
                    <span className="stat-value">
                      {(cardAnalytics.totalCards || 0) + (connectionPatterns.totalConnections || 0)}
                    </span>
                  </div>
                  <div className="collab-stat">
                    <h4>Connection Ratio</h4>
                    <span className="stat-value">
                      {cardAnalytics.totalCards > 0 ? 
                        Math.round((connectionPatterns.totalConnections / cardAnalytics.totalCards) * 100) / 100 : 0}
                    </span>
                  </div>
                  <div className="collab-stat">
                    <h4>Active Connectors</h4>
                    <span className="stat-value">{connectionPatterns.activeConnectors || 0}</span>
                  </div>
                  <div className="collab-stat">
                    <h4>Collaboration Score</h4>
                    <span className="stat-value">
                      {Math.round((collaborationPatterns.avgMembersPerSpace || 0) * 10) / 10}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersCards; 