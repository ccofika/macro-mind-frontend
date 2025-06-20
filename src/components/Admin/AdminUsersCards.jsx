import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './AdminPages.css';

const AdminUsersCards = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    fetchData();
  }, [timeRange, sortBy, sortOrder, filterBy]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getUsersAndCardsAnalytics({
        timeRange,
        sortBy,
        sortOrder,
        filterBy,
        search: searchTerm
      });
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to load data');
      }
    } catch (err) {
      console.error('Users & Cards analytics error:', err);
      setError('Error loading analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = () => {
    fetchData();
  };

  const exportData = (format) => {
    try {
      const filename = `users-cards-analytics-${new Date().getTime()}`;
      if (format === 'csv') {
        adminService.exportToCSV(data.users.data, `${filename}.csv`);
      } else if (format === 'json') {
        adminService.exportToJSON(data, `${filename}.json`);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading Users & Cards Analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
        <button onClick={fetchData} className="admin-retry-btn">
          <i className="fas fa-redo"></i>
          Retry
        </button>
      </div>
    );
  }

  const { users, cardAnalytics, collaborationPatterns, connectionPatterns } = data || {};

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-users"></i>
            Users & Cards Analytics
          </h1>
          <p>Comprehensive analytics for user activity and card creation</p>
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
          <button className="admin-refresh-button" onClick={fetchData}>
            <i className="fas fa-sync-alt"></i>
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Analytics Tabs */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-chart-pie"></i>
            Overview
          </button>
          <button 
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="fas fa-users"></i>
            Users Detail
          </button>
          <button 
            className={`admin-tab ${activeTab === 'cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('cards')}
          >
            <i className="fas fa-id-card"></i>
            Cards Analysis
          </button>
          <button 
            className={`admin-tab ${activeTab === 'trends' ? 'active' : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            <i className="fas fa-chart-line"></i>
            Trends
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="admin-stats-grid">
              <div className="admin-stat-card primary">
                <div className="admin-stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Total Users</h3>
                  <p className="admin-stat-value">{users?.totalCount || 0}</p>
                  <span className="admin-stat-change positive">
                    <i className="fas fa-arrow-up"></i>
                    +{cardAnalytics?.newUsersThisPeriod || 0} this period
                  </span>
                </div>
              </div>

              <div className="admin-stat-card success">
                <div className="admin-stat-icon">
                  <i className="fas fa-user-check"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Active Users</h3>
                  <p className="admin-stat-value">{cardAnalytics?.activeUsers || 0}</p>
                  <span className="admin-stat-change">
                    {Math.round((cardAnalytics?.activeUsers / users?.totalCount) * 100 || 0)}% of total
                  </span>
                </div>
              </div>

              <div className="admin-stat-card info">
                <div className="admin-stat-icon">
                  <i className="fas fa-id-card"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Total Cards</h3>
                  <p className="admin-stat-value">{cardAnalytics?.totalCards || 0}</p>
                  <span className="admin-stat-change positive">
                    <i className="fas fa-arrow-up"></i>
                    +{cardAnalytics?.newCardsThisPeriod || 0} this period
                  </span>
                </div>
              </div>

              <div className="admin-stat-card warning">
                <div className="admin-stat-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Cards per User</h3>
                  <p className="admin-stat-value">{Math.round(cardAnalytics?.avgCardsPerUser || 0)}</p>
                  <span className="admin-stat-change">
                    Average across all users
                  </span>
                </div>
              </div>
            </div>

            {/* Card Types Distribution */}
            <div className="admin-analytics-section">
              <h3>Card Types Distribution</h3>
              <div className="distribution-grid">
                {cardAnalytics?.cardTypeDistribution?.map((type, index) => (
                  <div key={index} className="distribution-item">
                    <div className="distribution-icon">
                      <i className={getCardTypeIcon(type._id)}></i>
                    </div>
                    <div className="distribution-info">
                      <h4>{type._id || 'Unknown'}</h4>
                      <p>{type.count} cards</p>
                      <span>{Math.round((type.count / cardAnalytics?.totalCards) * 100 || 0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Heatmap */}
            <div className="admin-analytics-section">
              <h3>User Activity Patterns</h3>
              <div className="activity-heatmap">
                <div className="heatmap-grid">
                  {collaborationPatterns?.hourlyActivity?.map((hour, index) => (
                    <div 
                      key={index} 
                      className={`heatmap-cell ${getActivityIntensity(hour.count)}`}
                      title={`${hour._id}:00 - ${hour.count} activities`}
                    >
                      <span>{hour._id}</span>
                    </div>
                  ))}
                </div>
                <div className="heatmap-legend">
                  <span>Less</span>
                  <div className="legend-cells">
                    <div className="legend-cell low"></div>
                    <div className="legend-cell medium"></div>
                    <div className="legend-cell high"></div>
                    <div className="legend-cell intense"></div>
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Detail Tab */}
        {activeTab === 'users' && (
          <div className="tab-content">
            <div className="admin-controls">
              <div className="admin-search-container">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={handleSearch}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                  className="admin-search-input"
                />
                <button className="admin-btn primary" onClick={handleSearchSubmit}>
                  <i className="fas fa-search"></i>
                </button>
              </div>
              
              <div className="admin-filters">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="admin-select">
                  <option value="createdAt">Sort by: Created Date</option>
                  <option value="lastLogin">Sort by: Last Login</option>
                  <option value="cardCount">Sort by: Card Count</option>
                  <option value="name">Sort by: Name</option>
                </select>
                
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="admin-select">
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
                
                <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)} className="admin-select">
                  <option value="all">All Users</option>
                  <option value="active">Active Users</option>
                  <option value="inactive">Inactive Users</option>
                  <option value="new">New Users</option>
                </select>
              </div>
              
              <div className="admin-actions">
                <button className="admin-btn secondary" onClick={() => exportData('csv')}>
                  <i className="fas fa-file-csv"></i>
                  Export CSV
                </button>
                <button className="admin-btn secondary" onClick={() => exportData('json')}>
                  <i className="fas fa-file-code"></i>
                  Export JSON
                </button>
              </div>
            </div>

            <div className="users-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Cards Created</th>
                    <th>Last Login</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.data?.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <strong>{user.name || 'Unknown User'}</strong>
                            <small>ID: {user._id}</small>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className="badge-count">{user.cardCount || 0}</span>
                      </td>
                      <td>
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td>
                        <span className={`status-badge ${getUserStatus(user)}`}>
                          {getUserStatusText(user)}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="admin-btn-small primary" title="View Details">
                            <i className="fas fa-eye"></i>
                          </button>
                          <button className="admin-btn-small secondary" title="Edit User">
                            <i className="fas fa-edit"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button className="admin-btn secondary" disabled={users?.currentPage <= 1}>
                <i className="fas fa-chevron-left"></i>
                Previous
              </button>
              <span className="page-info">
                Page {users?.currentPage || 1} of {users?.totalPages || 1}
              </span>
              <button className="admin-btn secondary" disabled={users?.currentPage >= users?.totalPages}>
                Next
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}

        {/* Cards Analysis Tab */}
        {activeTab === 'cards' && (
          <div className="tab-content">
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <i className="fas fa-id-card"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Total Cards</h3>
                  <p className="admin-stat-value">{cardAnalytics?.totalCards || 0}</p>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <i className="fas fa-link"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Total Connections</h3>
                  <p className="admin-stat-value">{connectionPatterns?.totalConnections || 0}</p>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <i className="fas fa-project-diagram"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Connected Cards</h3>
                  <p className="admin-stat-value">{connectionPatterns?.connectedCards || 0}</p>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Avg Connections</h3>
                  <p className="admin-stat-value">{Math.round(connectionPatterns?.avgConnectionsPerCard || 0)}</p>
                </div>
              </div>
            </div>

            {/* Most Connected Cards */}
            <div className="admin-analytics-section">
              <h3>Most Connected Cards</h3>
              <div className="top-cards-list">
                {connectionPatterns?.topConnectedCards?.slice(0, 10).map((card, index) => (
                  <div key={card._id} className="card-item">
                    <div className="card-rank">#{index + 1}</div>
                    <div className="card-info">
                      <h4>{card.title || 'Untitled Card'}</h4>
                      <span>{card.type || 'Unknown Type'}</span>
                    </div>
                    <div className="card-stats">
                      <span className="connection-count">{card.connectionCount} connections</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="tab-content">
            <div className="trends-grid">
              <div className="trend-section">
                <h3>User Registration Trends</h3>
                <div className="trend-chart-placeholder">
                  <i className="fas fa-chart-line"></i>
                  <p>Registration trend visualization</p>
                  <small>Chart implementation coming soon</small>
                </div>
              </div>
              
              <div className="trend-section">
                <h3>Card Creation Trends</h3>
                <div className="trend-chart-placeholder">
                  <i className="fas fa-chart-bar"></i>
                  <p>Card creation trend analysis</p>
                  <small>Chart implementation coming soon</small>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
const getCardTypeIcon = (type) => {
  const iconMap = {
    'text': 'fas fa-font',
    'image': 'fas fa-image',
    'video': 'fas fa-video',
    'audio': 'fas fa-volume-up',
    'link': 'fas fa-link',
    'file': 'fas fa-file',
    'note': 'fas fa-sticky-note'
  };
  return iconMap[type] || 'fas fa-id-card';
};

const getActivityIntensity = (count) => {
  if (count === 0) return 'none';
  if (count < 5) return 'low';
  if (count < 15) return 'medium';
  if (count < 30) return 'high';
  return 'intense';
};

const getUserStatus = (user) => {
  if (user.suspended) return 'suspended';
  if (user.lastLogin && new Date() - new Date(user.lastLogin) < 30 * 24 * 60 * 60 * 1000) return 'active';
  return 'inactive';
};

const getUserStatusText = (user) => {
  const status = getUserStatus(user);
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default AdminUsersCards; 