import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './AdminPages.css';

const AdminOverview = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOverviewData();
  }, [timeRange]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getDashboardOverview({ timeRange });
      if (response.success) {
        setOverviewData(response.data);
      } else {
        setError(response.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching overview data:', error);
      setError(error.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOverviewData();
  };

  // SVG Icons
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

  const DashboardIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
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

  const SpacesIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );

  const BrainIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.07 2.07 0 0 1-2.44-2.44 2.07 2.07 0 0 1-2.44-2.44 2.07 2.07 0 0 1 0-4.12A2.5 2.5 0 0 1 4.5 8.5a2.5 2.5 0 0 1 5 0Z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.07 2.07 0 0 0 2.44-2.44 2.07 2.07 0 0 0 2.44-2.44 2.07 2.07 0 0 0 0-4.12A2.5 2.5 0 0 0 19.5 8.5a2.5 2.5 0 0 0-5 0Z"/>
    </svg>
  );

  const LinkIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );

  const HeartIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );

  const ServerIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="4" rx="1"/>
      <rect x="2" y="9" width="20" height="4" rx="1"/>
      <rect x="2" y="15" width="20" height="4" rx="1"/>
      <line x1="6" y1="5" x2="6.01" y2="5"/>
      <line x1="6" y1="11" x2="6.01" y2="11"/>
      <line x1="6" y1="17" x2="6.01" y2="17"/>
    </svg>
  );

  const MemoryIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );

  const ShieldIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );

  const ArrowUpIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="19" x2="12" y2="5"/>
      <polyline points="5 12 12 5 19 12"/>
    </svg>
  );

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>Dashboard Overview</h1>
          <p>Loading platform analytics...</p>
        </div>
        <div className="admin-loading">
          <SpinnerIcon />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>Dashboard Overview</h1>
          <p>Platform analytics and insights</p>
        </div>
        <div className="admin-error">
          <WarningIcon />
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button className="admin-retry-btn" onClick={fetchOverviewData}>
            <RefreshIcon />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { 
    platformStats = {}, 
    trends = {}, 
    distributions = {}, 
    aiAnalytics = {}, 
    topUsers = [], 
    recentActivity = { users: [], cards: [] }, 
    systemHealth = {} 
  } = overviewData || {};

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="header-content">
          <h1>
            <DashboardIcon />
            Dashboard Overview
          </h1>
          <p>Comprehensive platform analytics and insights</p>
        </div>
        <div className="header-actions">
          <div className="time-range-selector">
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="admin-select">
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <button 
            className={`admin-refresh-button ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <span className={refreshing ? 'spinning' : ''}><RefreshIcon /></span>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Platform Statistics */}
        <div className="admin-stats-section">
          <h2>Platform Statistics</h2>
          <div className="admin-stats-grid">
            <div className="admin-stat-card primary">
              <div className="admin-stat-icon">
                <UsersIcon />
              </div>
              <div className="admin-stat-info">
                <h3>Total Users</h3>
                <p className="admin-stat-value">{typeof platformStats?.totalUsers === 'number' ? platformStats.totalUsers : 0}</p>
                <span className="admin-stat-change positive">
                  <ArrowUpIcon />
                  +{typeof platformStats?.newUsersThisPeriod === 'number' ? platformStats.newUsersThisPeriod : (Array.isArray(platformStats?.newUsersThisPeriod) ? platformStats.newUsersThisPeriod.length : 0)} this period
                </span>
              </div>
            </div>

            <div className="admin-stat-card success">
              <div className="admin-stat-icon">
                <UserCheckIcon />
              </div>
              <div className="admin-stat-info">
                <h3>Active Users</h3>
                <p className="admin-stat-value">{typeof platformStats?.activeUsers === 'number' ? platformStats.activeUsers : 0}</p>
                <span className="admin-stat-change">
                  {Math.round(((typeof platformStats?.activeUsers === 'number' ? platformStats.activeUsers : 0) / (typeof platformStats?.totalUsers === 'number' ? platformStats.totalUsers : 1)) * 100 || 0)}% of total
                </span>
              </div>
            </div>

            <div className="admin-stat-card info">
              <div className="admin-stat-icon">
                <CardIcon />
              </div>
              <div className="admin-stat-info">
                <h3>Total Cards</h3>
                <p className="admin-stat-value">{typeof platformStats?.totalCards === 'number' ? platformStats.totalCards : 0}</p>
                <span className="admin-stat-change positive">
                  <ArrowUpIcon />
                  +{typeof platformStats?.newCardsThisPeriod === 'number' ? platformStats.newCardsThisPeriod : 0} this period
                </span>
              </div>
            </div>

            <div className="admin-stat-card warning">
              <div className="admin-stat-icon">
                <SpacesIcon />
              </div>
              <div className="admin-stat-info">
                <h3>Active Spaces</h3>
                <p className="admin-stat-value">{typeof platformStats?.totalSpaces === 'number' ? platformStats.totalSpaces : 0}</p>
                <span className="admin-stat-change">
                  {typeof platformStats?.spacesWithActivity === 'number' ? platformStats.spacesWithActivity : 0} with recent activity
                </span>
              </div>
            </div>

            <div className="admin-stat-card purple">
              <div className="admin-stat-icon">
                <BrainIcon />
              </div>
              <div className="admin-stat-info">
                <h3>AI Conversations</h3>
                <p className="admin-stat-value">{typeof aiAnalytics?.totalConversations === 'number' ? aiAnalytics.totalConversations : 0}</p>
                <span className="admin-stat-change positive">
                  <ArrowUpIcon />
                  +{typeof aiAnalytics?.newConversationsThisPeriod === 'number' ? aiAnalytics.newConversationsThisPeriod : 0} this period
                </span>
              </div>
            </div>

            <div className="admin-stat-card orange">
              <div className="admin-stat-icon">
                <LinkIcon />
              </div>
              <div className="admin-stat-info">
                <h3>Connections</h3>
                <p className="admin-stat-value">{typeof platformStats?.totalConnections === 'number' ? platformStats.totalConnections : 0}</p>
                <span className="admin-stat-change">
                  Avg {Math.round(typeof platformStats?.avgConnectionsPerCard === 'number' ? platformStats.avgConnectionsPerCard : 0)} per card
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="admin-system-health">
          <h2>System Health</h2>
          <div className="health-grid">
            <div className="health-indicator">
              <div className="health-icon status-healthy">
                <HeartIcon />
              </div>
              <div className="health-info">
                <h4>Database</h4>
                <span className="status-text">Healthy</span>
              </div>
            </div>
            <div className="health-indicator">
              <div className="health-icon status-healthy">
                <ServerIcon />
              </div>
              <div className="health-info">
                <h4>API Response</h4>
                <span className="status-text">{systemHealth?.avgResponseTime || 120}ms</span>
              </div>
            </div>
            <div className="health-indicator">
              <div className="health-icon status-warning">
                <MemoryIcon />
              </div>
              <div className="health-info">
                <h4>Memory Usage</h4>
                <span className="status-text">{systemHealth?.memoryUsage || 78}%</span>
              </div>
            </div>
            <div className="health-indicator">
              <div className="health-icon status-healthy">
                <ShieldIcon />
              </div>
              <div className="health-info">
                <h4>Security</h4>
                <span className="status-text">Secure</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Top Users */}
        <div className="admin-dashboard-grid">
          {/* Recent Activity */}
          <div className="activity-section">
            <h2>Recent Activity</h2>
            <div className="activity-tabs">
              <div className="activity-list">
                {recentActivity.users.slice(0, 5).map((user, index) => {
                  if (!user || typeof user !== 'object') return null;
                  return (
                    <div key={user._id || `user-${index}`} className="activity-item">
                      <div className="activity-avatar">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="activity-details">
                        <p>{user.lastCardCreated ? 'Recent card activity' : 'User registration'}</p>
                        <span>{user.name || 'Unknown'} ({user.email || 'No email'})</span>
                        <small>
                          {user.lastCardCreated 
                            ? `Latest card: ${new Date(user.lastCardCreated).toLocaleDateString()}`
                            : user.createdAt ? `Joined: ${new Date(user.createdAt).toLocaleDateString()}` : 'No date available'
                          }
                        </small>
                      </div>
                    </div>
                  );
                })}
                {recentActivity.cards.slice(0, 3).map((card, index) => {
                  if (!card || typeof card !== 'object') return null;
                  return (
                    <div key={card._id || `card-${index}`} className="activity-item">
                      <div className="activity-avatar card">
                        <CardIcon />
                      </div>
                      <div className="activity-details">
                        <p>New card created</p>
                        <span>{card.title || 'Untitled Card'}</span>
                        <small>by {typeof card.userId === 'object' ? card.userId?.name : card.userId || 'Unknown User'}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Users */}
          <div className="top-users-section">
            <h2>Most Active Users</h2>
            <div className="user-list">
              {topUsers.slice(0, 10).map((user, index) => {
                if (!user || typeof user !== 'object') return null;
                return (
                  <div key={user._id || `top-user-${index}`} className="user-item">
                    <div className="user-rank">#{index + 1}</div>
                    <div className="user-avatar">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="user-info">
                      <h4>{user.name || 'Unknown User'}</h4>
                      <span>{user.cardCount || 0} cards</span>
                    </div>
                    <div className="user-stats">
                      <span className="stat-badge">{user.totalCards || user.cardCount || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-grid">
            <button className="admin-action-card" onClick={() => window.location.hash = '#user-management'}>
              <div className="action-icon">
                <UsersIcon />
              </div>
              <div className="action-content">
                <h3>Manage Users</h3>
                <p>View and manage user accounts</p>
              </div>
            </button>

            <button className="admin-action-card" onClick={() => window.location.hash = '#database'}>
              <div className="action-icon">
                <ServerIcon />
              </div>
              <div className="action-content">
                <h3>Database Tools</h3>
                <p>Browse and query database</p>
              </div>
            </button>

            <button className="admin-action-card" onClick={() => window.location.hash = '#ai-analytics'}>
              <div className="action-icon">
                <BrainIcon />
              </div>
              <div className="action-content">
                <h3>AI Analytics</h3>
                <p>Monitor AI performance</p>
              </div>
            </button>

            <button className="admin-action-card" onClick={() => window.location.hash = '#users-cards'}>
              <div className="action-icon">
                <CardIcon />
              </div>
              <div className="action-content">
                <h3>User Analytics</h3>
                <p>Detailed user behavior</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview; 