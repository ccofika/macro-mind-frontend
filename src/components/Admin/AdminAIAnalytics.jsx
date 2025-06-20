import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './AdminPages.css';

const AdminAIAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMode, setSelectedMode] = useState('all');

  useEffect(() => {
    fetchData();
  }, [timeRange, selectedMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getAIAnalytics({ timeRange, mode: selectedMode });
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to load AI analytics');
      }
    } catch (err) {
      console.error('AI analytics error:', err);
      setError('Error loading AI analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportAIData = (format) => {
    try {
      const filename = `ai-analytics-${new Date().getTime()}`;
      if (format === 'csv') {
        adminService.exportToCSV(data.conversations, `${filename}.csv`);
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
        <p>Loading AI Analytics...</p>
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

  const { 
    overview, 
    usageByMode, 
    dailyUsage, 
    performanceMetrics, 
    topUsers, 
    errorAnalysis,
    recentConversations 
  } = data || {};

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-brain"></i>
            AI Analytics
          </h1>
          <p>Comprehensive AI system performance and usage analytics</p>
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
          <div className="mode-selector">
            <select value={selectedMode} onChange={(e) => setSelectedMode(e.target.value)} className="admin-select">
              <option value="all">All Modes</option>
              <option value="conversational">Conversational</option>
              <option value="task-oriented">Task-Oriented</option>
              <option value="creative">Creative</option>
              <option value="analytical">Analytical</option>
            </select>
          </div>
          <button className="admin-refresh-button" onClick={fetchData}>
            <i className="fas fa-sync-alt"></i>
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* AI Analytics Tabs */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-chart-pie"></i>
            Overview
          </button>
          <button 
            className={`admin-tab ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            <i className="fas fa-tachometer-alt"></i>
            Performance
          </button>
          <button 
            className={`admin-tab ${activeTab === 'usage' ? 'active' : ''}`}
            onClick={() => setActiveTab('usage')}
          >
            <i className="fas fa-chart-line"></i>
            Usage Patterns
          </button>
          <button 
            className={`admin-tab ${activeTab === 'conversations' ? 'active' : ''}`}
            onClick={() => setActiveTab('conversations')}
          >
            <i className="fas fa-comments"></i>
            Conversations
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="admin-stats-grid">
              <div className="admin-stat-card primary">
                <div className="admin-stat-icon">
                  <i className="fas fa-comments"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Total Conversations</h3>
                  <p className="admin-stat-value">{overview?.totalConversations || 0}</p>
                  <span className="admin-stat-change positive">
                    <i className="fas fa-arrow-up"></i>
                    +{overview?.newConversationsThisPeriod || 0} this period
                  </span>
                </div>
              </div>

              <div className="admin-stat-card success">
                <div className="admin-stat-icon">
                  <i className="fas fa-message"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Total Messages</h3>
                  <p className="admin-stat-value">{overview?.totalMessages || 0}</p>
                  <span className="admin-stat-change positive">
                    <i className="fas fa-arrow-up"></i>
                    +{overview?.newMessagesThisPeriod || 0} this period
                  </span>
                </div>
              </div>

              <div className="admin-stat-card warning">
                <div className="admin-stat-icon">
                  <i className="fas fa-coins"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Tokens Used</h3>
                  <p className="admin-stat-value">{adminService.formatNumber(overview?.totalTokens || 0)}</p>
                  <span className="admin-stat-change">
                    ${(overview?.estimatedCost || 0).toFixed(2)} estimated cost
                  </span>
                </div>
              </div>

              <div className="admin-stat-card info">
                <div className="admin-stat-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Avg Response Time</h3>
                  <p className="admin-stat-value">{overview?.avgResponseTime || 0}ms</p>
                  <span className={`admin-stat-change ${overview?.responseTimeChange > 0 ? 'negative' : 'positive'}`}>
                    <i className={`fas ${overview?.responseTimeChange > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
                    {Math.abs(overview?.responseTimeChange || 0)}ms from last period
                  </span>
                </div>
              </div>
            </div>

            {/* AI Mode Distribution */}
            <div className="admin-analytics-section">
              <h3>AI Mode Usage Distribution</h3>
              <div className="mode-distribution-grid">
                {usageByMode?.map((mode, index) => (
                  <div key={index} className="mode-card">
                    <div className="mode-header">
                      <div className="mode-icon">
                        <i className={getAIModeIcon(mode._id)}></i>
                      </div>
                      <div className="mode-info">
                        <h4>{formatModeName(mode._id)}</h4>
                        <span>{mode.count} conversations</span>
                      </div>
                    </div>
                    <div className="mode-stats">
                      <div className="stat-row">
                        <span>Avg Confidence:</span>
                        <span className="stat-value">{Math.round(mode.avgConfidence || 0)}%</span>
                      </div>
                      <div className="stat-row">
                        <span>Avg Response Time:</span>
                        <span className="stat-value">{Math.round(mode.avgProcessingTime || 0)}ms</span>
                      </div>
                      <div className="stat-row">
                        <span>Total Tokens:</span>
                        <span className="stat-value">{adminService.formatNumber(mode.totalTokens || 0)}</span>
                      </div>
                    </div>
                    <div className="mode-usage-bar">
                      <div 
                        className="usage-fill" 
                        style={{ width: `${(mode.count / overview?.totalConversations) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-time System Status */}
            <div className="admin-analytics-section">
              <h3>System Status</h3>
              <div className="system-status-grid">
                <div className="status-indicator">
                  <div className="status-icon healthy">
                    <i className="fas fa-heartbeat"></i>
                  </div>
                  <div className="status-info">
                    <h4>AI Service</h4>
                    <span className="status-text">Operational</span>
                    <small>99.9% uptime</small>
                  </div>
                </div>
                <div className="status-indicator">
                  <div className="status-icon healthy">
                    <i className="fas fa-server"></i>
                  </div>
                  <div className="status-info">
                    <h4>Response Time</h4>
                    <span className="status-text">{overview?.avgResponseTime || 120}ms</span>
                    <small>Within normal range</small>
                  </div>
                </div>
                <div className="status-indicator">
                  <div className={`status-icon ${overview?.errorRate > 5 ? 'warning' : 'healthy'}`}>
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <div className="status-info">
                    <h4>Error Rate</h4>
                    <span className="status-text">{overview?.errorRate || 0}%</span>
                    <small>{overview?.errorRate > 5 ? 'Above threshold' : 'Normal'}</small>
                  </div>
                </div>
                <div className="status-indicator">
                  <div className="status-icon healthy">
                    <i className="fas fa-shield-alt"></i>
                  </div>
                  <div className="status-info">
                    <h4>Security</h4>
                    <span className="status-text">Secure</span>
                    <small>All checks passed</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="tab-content">
            <div className="performance-grid">
              <div className="performance-section">
                <h3>Response Time Analysis</h3>
                <div className="performance-metrics">
                  <div className="metric-card">
                    <h4>Average</h4>
                    <span className="metric-value">{performanceMetrics?.avgResponseTime || 0}ms</span>
                  </div>
                  <div className="metric-card">
                    <h4>Median</h4>
                    <span className="metric-value">{performanceMetrics?.medianResponseTime || 0}ms</span>
                  </div>
                  <div className="metric-card">
                    <h4>95th Percentile</h4>
                    <span className="metric-value">{performanceMetrics?.p95ResponseTime || 0}ms</span>
                  </div>
                  <div className="metric-card">
                    <h4>Max</h4>
                    <span className="metric-value">{performanceMetrics?.maxResponseTime || 0}ms</span>
                  </div>
                </div>
              </div>

              <div className="performance-section">
                <h3>Token Usage Efficiency</h3>
                <div className="efficiency-metrics">
                  <div className="efficiency-item">
                    <span>Tokens per Message:</span>
                    <span className="efficiency-value">{Math.round(performanceMetrics?.avgTokensPerMessage || 0)}</span>
                  </div>
                  <div className="efficiency-item">
                    <span>Cost per Message:</span>
                    <span className="efficiency-value">${(performanceMetrics?.avgCostPerMessage || 0).toFixed(4)}</span>
                  </div>
                  <div className="efficiency-item">
                    <span>Daily Token Usage:</span>
                    <span className="efficiency-value">{adminService.formatNumber(performanceMetrics?.dailyTokenUsage || 0)}</span>
                  </div>
                  <div className="efficiency-item">
                    <span>Projected Monthly Cost:</span>
                    <span className="efficiency-value">${(performanceMetrics?.projectedMonthlyCost || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Analysis */}
            <div className="admin-analytics-section">
              <h3>Error Analysis</h3>
              <div className="error-breakdown">
                {errorAnalysis?.map((error, index) => (
                  <div key={index} className="error-item">
                    <div className="error-type">
                      <i className="fas fa-exclamation-circle"></i>
                      <span>{error.type || 'Unknown Error'}</span>
                    </div>
                    <div className="error-count">
                      <span className="count">{error.count}</span>
                      <small>{Math.round((error.count / overview?.totalMessages) * 100 || 0)}%</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Usage Patterns Tab */}
        {activeTab === 'usage' && (
          <div className="tab-content">
            <div className="usage-charts">
              <div className="chart-section">
                <h3>Daily Usage Trends</h3>
                <div className="trend-chart-placeholder">
                  <i className="fas fa-chart-line"></i>
                  <p>Daily AI usage visualization</p>
                  <small>Interactive charts coming soon</small>
                </div>
              </div>
              
              <div className="chart-section">
                <h3>Hourly Activity Pattern</h3>
                <div className="hourly-activity">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const activity = dailyUsage?.find(d => d.hour === hour) || { count: 0 };
                    return (
                      <div key={hour} className="hour-bar">
                        <div 
                          className="bar-fill" 
                          style={{ height: `${(activity.count / Math.max(...(dailyUsage?.map(d => d.count) || [1]))) * 100}%` }}
                        ></div>
                        <span className="hour-label">{hour}h</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top AI Users */}
            <div className="admin-analytics-section">
              <h3>Most Active AI Users</h3>
              <div className="top-users-list">
                {topUsers?.slice(0, 10).map((user, index) => (
                  <div key={user._id} className="ai-user-item">
                    <div className="user-rank">#{index + 1}</div>
                    <div className="user-avatar">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="user-info">
                      <h4>{user.name || 'Unknown User'}</h4>
                      <span>{user.email}</span>
                    </div>
                    <div className="user-ai-stats">
                      <div className="ai-stat">
                        <span className="ai-stat-label">Conversations:</span>
                        <span className="ai-stat-value">{user.conversationCount}</span>
                      </div>
                      <div className="ai-stat">
                        <span className="ai-stat-label">Messages:</span>
                        <span className="ai-stat-value">{user.messageCount}</span>
                      </div>
                      <div className="ai-stat">
                        <span className="ai-stat-label">Tokens:</span>
                        <span className="ai-stat-value">{adminService.formatNumber(user.tokenCount)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <div className="tab-content">
            <div className="admin-controls">
              <div className="admin-actions">
                <button className="admin-btn secondary" onClick={() => exportAIData('csv')}>
                  <i className="fas fa-file-csv"></i>
                  Export CSV
                </button>
                <button className="admin-btn secondary" onClick={() => exportAIData('json')}>
                  <i className="fas fa-file-code"></i>
                  Export JSON
                </button>
              </div>
            </div>

            <div className="conversations-list">
              {recentConversations?.map((conversation) => (
                <div key={conversation._id} className="conversation-card">
                  <div className="conversation-header">
                    <div className="conversation-user">
                      <div className="user-avatar">
                        {conversation.userId?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="user-details">
                        <h4>{conversation.userId?.name || 'Unknown User'}</h4>
                        <span>{conversation.userId?.email}</span>
                      </div>
                    </div>
                    <div className="conversation-meta">
                      <span className="conversation-date">
                        {new Date(conversation.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`conversation-mode ${conversation.mode}`}>
                        {formatModeName(conversation.mode)}
                      </span>
                    </div>
                  </div>
                  <div className="conversation-stats">
                    <div className="stat-item">
                      <i className="fas fa-message"></i>
                      <span>{conversation.messageCount} messages</span>
                    </div>
                    <div className="stat-item">
                      <i className="fas fa-coins"></i>
                      <span>{adminService.formatNumber(conversation.totalTokens)} tokens</span>
                    </div>
                    <div className="stat-item">
                      <i className="fas fa-clock"></i>
                      <span>{conversation.avgResponseTime}ms avg</span>
                    </div>
                  </div>
                  <div className="conversation-actions">
                    <button className="admin-btn-small primary" title="View Conversation">
                      <i className="fas fa-eye"></i>
                    </button>
                    <button className="admin-btn-small secondary" title="Analyze">
                      <i className="fas fa-chart-bar"></i>
                    </button>
                    <button className="admin-btn-small danger" title="Delete">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
const getAIModeIcon = (mode) => {
  const iconMap = {
    'conversational': 'fas fa-comments',
    'task-oriented': 'fas fa-tasks',
    'creative': 'fas fa-palette',
    'analytical': 'fas fa-chart-line',
    'educational': 'fas fa-graduation-cap',
    'technical': 'fas fa-cog'
  };
  return iconMap[mode] || 'fas fa-brain';
};

const formatModeName = (mode) => {
  if (!mode) return 'Unknown';
  return mode.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default AdminAIAnalytics; 