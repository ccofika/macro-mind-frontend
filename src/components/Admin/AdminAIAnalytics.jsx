import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './AdminPages.css';

const AdminAIAnalytics = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('lastActivity');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMode, setSelectedMode] = useState('all');

  useEffect(() => {
    fetchData();
  }, [timeRange, sortBy, sortOrder, filterBy, currentPage, selectedMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'trends') {
        const trendsResponse = await adminService.getAITrends({ timeRange });
        if (trendsResponse.success) {
          setTrendsData(trendsResponse.data);
        } else {
          setError(trendsResponse.message || 'Failed to load trends data');
        }
      } else {
        const response = await adminService.getAIAnalytics({
          timeRange,
          sortBy,
          sortOrder,
          filterBy,
          search: searchTerm,
          page: currentPage,
          limit: 20,
          mode: selectedMode
        });
        if (response.success) {
          setOverviewData(response.data);
        } else {
          setError(response.message || 'Failed to load AI analytics data');
        }
      }
    } catch (err) {
      console.error('AI Analytics error:', err);
      setError(err.message || 'Error loading AI analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

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
        mode: selectedMode,
        includeStats: 'true'
      };

      await adminService.exportAIData(exportParams);
      console.log(`✅ ${format.toUpperCase()} export completed successfully`);
      
    } catch (error) {
      console.error('❌ Export error:', error);
      setError(`Export failed: ${error.message}`);
    }
  };

  // Professional SVG Icons
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

  const BrainIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  );

  const MessageIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );

  const TokenIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
    </svg>
  );

  const TrendingUpIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
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

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'conversational':
        return <MessageIcon />;
      case 'task-oriented':
        return <BrainIcon />;
      case 'creative':
        return <TokenIcon />;
      case 'analytical':
        return <TrendingUpIcon />;
      default:
        return <BrainIcon />;
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value) => {
    return `${Math.round(value || 0)}%`;
  };

  const formatCurrency = (value) => {
    return `$${(value || 0).toFixed(4)}`;
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          <SpinnerIcon />
          <p>Loading AI Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-error">
          <WarningIcon />
          <p>{error}</p>
          <button onClick={handleRefresh} className="admin-retry-btn">
            <RefreshIcon />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="header-content">
          <h1>
            <BrainIcon />
            AI Analytics
          </h1>
          <p>Comprehensive AI system performance and usage analytics</p>
        </div>
        
        <div className="header-controls">
          <div className="time-range-selector">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="admin-select"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          
          <button 
            className={`admin-refresh-btn ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshIcon />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BrainIcon />
          Overview
        </button>
        <button
          className={`admin-tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <TrendingUpIcon />
          Performance
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <MessageIcon />
          User Adoption
        </button>
        <button
          className={`admin-tab ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          <TrendingUpIcon />
          Trends
        </button>
      </div>

      {/* Content */}
      <div className="admin-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && overviewData && (
          <div className="tab-content">
            {/* Key Metrics */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card primary">
                <div className="admin-stat-icon">
                  <MessageIcon />
                </div>
                <div className="admin-stat-content">
                  <h3>Total Conversations</h3>
                  <div className="admin-stat-value">{formatNumber(overviewData.overview?.totalConversations || 0)}</div>
                  <div className="admin-stat-change positive">
                    +{formatNumber(overviewData.overview?.recentConversations || 0)} this period
                  </div>
                </div>
              </div>

              <div className="admin-stat-card success">
                <div className="admin-stat-icon">
                  <BrainIcon />
                </div>
                <div className="admin-stat-content">
                  <h3>Total Messages</h3>
                  <div className="admin-stat-value">{formatNumber(overviewData.overview?.totalMessages || 0)}</div>
                  <div className="admin-stat-change positive">
                    +{formatNumber(overviewData.overview?.recentMessages || 0)} this period
                  </div>
                </div>
              </div>

              <div className="admin-stat-card warning">
                <div className="admin-stat-icon">
                  <TokenIcon />
                </div>
                <div className="admin-stat-content">
                  <h3>Tokens Used</h3>
                  <div className="admin-stat-value">{formatNumber(overviewData.overview?.totalTokens || 0)}</div>
                  <div className="admin-stat-change">
                    {formatCurrency(overviewData.overview?.estimatedCost || 0)} estimated cost
                  </div>
                </div>
              </div>

              <div className="admin-stat-card info">
                <div className="admin-stat-icon">
                  <TrendingUpIcon />
                </div>
                <div className="admin-stat-content">
                  <h3>Success Rate</h3>
                  <div className="admin-stat-value">{formatPercentage(overviewData.overview?.successRate || 0)}</div>
                  <div className="admin-stat-change positive">
                    {Math.round(overviewData.overview?.avgResponseTime || 0)}ms avg time
                  </div>
                </div>
              </div>
            </div>

            {/* Usage by Mode */}
            {overviewData.usageByMode && overviewData.usageByMode.length > 0 && (
              <div className="admin-section">
                <h3>AI Mode Usage</h3>
                <div className="admin-cards-grid">
                  {overviewData.usageByMode.map((mode, index) => (
                    <div key={index} className="admin-info-card">
                      <div className="card-header">
                        <div className="card-icon">
                          {getModeIcon(mode._id)}
                        </div>
                        <div className="card-title">
                          <h4>{mode._id || 'Unknown Mode'}</h4>
                          <p>{formatNumber(mode.count)} messages</p>
                        </div>
                      </div>
                      <div className="card-content">
                        <div className="stat-row">
                          <span>Confidence:</span>
                          <span>{formatPercentage(mode.avgConfidence)}</span>
                        </div>
                        <div className="stat-row">
                          <span>Tokens:</span>
                          <span>{formatNumber(mode.totalTokens)}</span>
                        </div>
                        <div className="stat-row">
                          <span>Users:</span>
                          <span>{formatNumber(mode.uniqueUserCount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {overviewData.recentActivity && overviewData.recentActivity.length > 0 && (
              <div className="admin-section">
                <h3>Recent Activity</h3>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Conversation</th>
                        <th>User</th>
                        <th>Messages</th>
                        <th>Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overviewData.recentActivity.map((activity, index) => (
                        <tr key={index}>
                          <td>
                            <div className="table-cell-main">
                              {activity.title || 'Untitled Conversation'}
                            </div>
                          </td>
                          <td>
                            <div className="table-cell-main">
                              {activity.userId?.name || 'Unknown User'}
                            </div>
                            <div className="table-cell-sub">
                              {activity.userId?.email || 'unknown@email.com'}
                            </div>
                          </td>
                          <td>{activity.stats?.messageCount || 0}</td>
                          <td>{new Date(activity.updatedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && overviewData && (
          <div className="tab-content">
            <div className="admin-section">
              <h3>Performance Metrics</h3>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <h4>Average Response Time</h4>
                  <div className="admin-stat-value">
                    {Math.round(overviewData.performanceMetrics?.avgResponseTime || 0)}ms
                  </div>
                </div>
                <div className="admin-stat-card">
                  <h4>Success Rate</h4>
                  <div className="admin-stat-value">
                    {formatPercentage(overviewData.performanceMetrics?.successRate)}
                  </div>
                </div>
                <div className="admin-stat-card">
                  <h4>Avg Tokens per Message</h4>
                  <div className="admin-stat-value">
                    {Math.round(overviewData.performanceMetrics?.avgTokensPerMessage || 0)}
                  </div>
                </div>
                <div className="admin-stat-card">
                  <h4>Avg Confidence</h4>
                  <div className="admin-stat-value">
                    {formatPercentage(overviewData.performanceMetrics?.avgConfidence)}
                  </div>
                </div>
              </div>
            </div>

            {/* Error Patterns */}
            {overviewData.errorPatterns && overviewData.errorPatterns.length > 0 && (
              <div className="admin-section">
                <h3>Error Patterns</h3>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Error Message</th>
                        <th>Occurrences</th>
                        <th>Affected Users</th>
                        <th>Latest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overviewData.errorPatterns.map((error, index) => (
                        <tr key={index}>
                          <td>
                            <div className="table-cell-main">
                              {error._id || 'Unknown Error'}
                            </div>
                          </td>
                          <td>{error.count}</td>
                          <td>{error.affectedUserCount || 0}</td>
                          <td>{new Date(error.latestOccurrence).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Adoption Tab */}
        {activeTab === 'users' && overviewData && (
          <div className="tab-content">
            {/* Controls */}
            <div className="admin-controls">
              <div className="admin-search-bar">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={handleSearch}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                />
                <button onClick={handleSearchSubmit} className="search-btn">
                  Search
                </button>
              </div>

              <div className="admin-filters">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="admin-select"
                >
                  <option value="lastActivity">Last Activity</option>
                  <option value="messageCount">Message Count</option>
                  <option value="conversationCount">Conversations</option>
                  <option value="totalTokens">Tokens Used</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="admin-select"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>

              <div className="admin-actions">
                <button onClick={() => exportData('csv')} className="export-btn">
                  <DownloadIcon />
                  Export CSV
                </button>
                <button onClick={() => exportData('json')} className="export-btn">
                  <DownloadIcon />
                  Export JSON
                </button>
              </div>
            </div>

            {/* User Adoption Table */}
            {overviewData.userAdoption && overviewData.userAdoption.data && (
              <div className="admin-section">
                <h3>User Adoption ({overviewData.userAdoption.totalCount} users)</h3>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Conversations</th>
                        <th>Messages</th>
                        <th>Tokens Used</th>
                        <th>Avg Response Time</th>
                        <th>Last Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overviewData.userAdoption.data.map((user, index) => (
                        <tr key={index}>
                          <td>
                            <div className="table-cell-main">
                              {user.userName || 'Unknown User'}
                            </div>
                            <div className="table-cell-sub">
                              {user.userEmail || 'unknown@email.com'}
                            </div>
                          </td>
                          <td>{user.conversationCount || 0}</td>
                          <td>{user.messageCount || 0}</td>
                          <td>{formatNumber(user.totalTokens || 0)}</td>
                          <td>{Math.round(user.avgResponseTime || 0)}ms</td>
                          <td>{new Date(user.lastActivity).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {overviewData.userAdoption.totalPages > 1 && (
                  <div className="admin-pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="page-btn"
                    >
                      <ChevronLeftIcon />
                      Previous
                    </button>
                    
                    <span className="page-info">
                      Page {currentPage} of {overviewData.userAdoption.totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(overviewData.userAdoption.totalPages, currentPage + 1))}
                      disabled={currentPage === overviewData.userAdoption.totalPages}
                      className="page-btn"
                    >
                      Next
                      <ChevronRightIcon />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && trendsData && (
          <div className="tab-content">
            <div className="admin-section">
              <h3>AI Usage Trends</h3>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <h4>Conversation Growth</h4>
                  <div className="admin-stat-value">
                    {trendsData.insights?.conversationGrowthRate || 0}%
                  </div>
                </div>
                <div className="admin-stat-card">
                  <h4>Message Growth</h4>
                  <div className="admin-stat-value">
                    {trendsData.insights?.messageGrowthRate || 0}%
                  </div>
                </div>
                <div className="admin-stat-card">
                  <h4>Top Mode</h4>
                  <div className="admin-stat-value">
                    {trendsData.insights?.topMode || 'N/A'}
                  </div>
                </div>
                <div className="admin-stat-card">
                  <h4>Analysis Quality</h4>
                  <div className="admin-stat-value">
                    {trendsData.summary?.analysisQuality || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Trends Charts Placeholder */}
            <div className="admin-section">
              <h3>Time Series Data</h3>
              <div className="trends-summary">
                <p>Conversation data points: {trendsData.series?.conversations?.length || 0}</p>
                <p>Message data points: {trendsData.series?.messages?.length || 0}</p>
                <p>Token data points: {trendsData.series?.tokens?.length || 0}</p>
                <p>Time range: {trendsData.dateRange?.start} to {trendsData.dateRange?.end}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAIAnalytics; 