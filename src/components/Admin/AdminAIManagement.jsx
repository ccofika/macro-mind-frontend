import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './AdminPages.css';

const AdminAIManagement = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState('all');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [aiSettings, setAiSettings] = useState({});
  const [activeTab, setActiveTab] = useState('conversations');

  const conversationsPerPage = 20;

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, selectedMode, filterBy]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getAIManagement({
        page: currentPage,
        limit: conversationsPerPage,
        search: searchTerm,
        mode: selectedMode,
        filter: filterBy
      });
      
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to load AI management data');
      }
    } catch (err) {
      console.error('AI management error:', err);
      setError('Error loading AI management data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleConversationAction = async (action, conversationId) => {
    try {
      let response;
      switch (action) {
        case 'delete':
          response = await adminService.deleteConversation(conversationId);
          break;
        case 'flag':
          response = await adminService.flagConversation(conversationId);
          break;
        case 'archive':
          response = await adminService.archiveConversation(conversationId);
          break;
        default:
          return;
      }
      
      if (response.success) {
        fetchData();
      } else {
        setError(response.message || `Failed to ${action} conversation`);
      }
    } catch (err) {
      console.error(`Conversation ${action} error:`, err);
      setError(`Error ${action}ing conversation`);
    }
  };

  const viewConversationDetails = (conversation) => {
    setSelectedConversation(conversation);
    setShowConversationModal(true);
  };

  const exportAIData = (format) => {
    try {
      const filename = `ai-conversations-${new Date().getTime()}`;
      if (format === 'csv') {
        adminService.exportToCSV(data.conversations, `${filename}.csv`);
      } else if (format === 'json') {
        adminService.exportToJSON(data.conversations, `${filename}.json`);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const updateAISettings = async (newSettings) => {
    try {
      const response = await adminService.updateAISettings(newSettings);
      if (response.success) {
        setAiSettings(newSettings);
        setShowSettingsModal(false);
      } else {
        setError(response.message || 'Failed to update AI settings');
      }
    } catch (err) {
      console.error('AI settings update error:', err);
      setError('Error updating AI settings');
    }
  };

  if (loading && !data) {
    return (
      <div className="admin-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading AI Management...</p>
      </div>
    );
  }

  const { conversations, statistics, activeUsers, systemStatus, recentErrors } = data || {};
  const totalPages = Math.ceil((statistics?.totalConversations || 0) / conversationsPerPage);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-robot"></i>
            AI Management
          </h1>
          <p>Monitor and manage AI conversations and system performance</p>
        </div>
        <div className="header-actions">
          <button className="admin-btn primary" onClick={() => setShowSettingsModal(true)}>
            <i className="fas fa-cog"></i>
            AI Settings
          </button>
          <button className="admin-refresh-button" onClick={fetchData}>
            <i className="fas fa-sync-alt"></i>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
          <button onClick={() => setError('')} className="close-error">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="admin-content">
        {/* AI Management Tabs */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'conversations' ? 'active' : ''}`}
            onClick={() => setActiveTab('conversations')}
          >
            <i className="fas fa-comments"></i>
            Conversations
          </button>
          <button 
            className={`admin-tab ${activeTab === 'monitoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitoring')}
          >
            <i className="fas fa-chart-line"></i>
            Monitoring
          </button>
          <button 
            className={`admin-tab ${activeTab === 'moderation' ? 'active' : ''}`}
            onClick={() => setActiveTab('moderation')}
          >
            <i className="fas fa-shield-alt"></i>
            Moderation
          </button>
          <button 
            className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <i className="fas fa-sliders-h"></i>
            Configuration
          </button>
        </div>

        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <div className="tab-content">
            {/* Controls */}
            <div className="admin-controls">
              <div className="admin-search-container">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search conversations by user, content, or ID..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="admin-search-input"
                />
              </div>
              
              <div className="admin-filters">
                <select value={selectedMode} onChange={(e) => setSelectedMode(e.target.value)} className="admin-select">
                  <option value="all">All Modes</option>
                  <option value="conversational">Conversational</option>
                  <option value="task-oriented">Task-Oriented</option>
                  <option value="creative">Creative</option>
                  <option value="analytical">Analytical</option>
                </select>
                
                <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)} className="admin-select">
                  <option value="all">All Conversations</option>
                  <option value="active">Active Sessions</option>
                  <option value="flagged">Flagged</option>
                  <option value="errors">With Errors</option>
                  <option value="today">Today</option>
                </select>
              </div>
              
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

            {/* Conversations List */}
            <div className="conversations-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Mode</th>
                    <th>Messages</th>
                    <th>Tokens</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Last Activity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations?.map((conversation) => (
                    <tr key={conversation._id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {conversation.userId?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="user-details">
                            <strong>{conversation.userId?.name || 'Unknown User'}</strong>
                            <small>{conversation.userId?.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`mode-badge ${conversation.mode}`}>
                          {formatModeName(conversation.mode)}
                        </span>
                      </td>
                      <td>
                        <span className="badge-count">{conversation.messageCount || 0}</span>
                      </td>
                      <td>
                        <span className="token-count">{adminService.formatNumber(conversation.totalTokens || 0)}</span>
                      </td>
                      <td>
                        <span>{formatDuration(conversation.duration)}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${getConversationStatus(conversation)}`}>
                          {getConversationStatusText(conversation)}
                        </span>
                      </td>
                      <td>
                        <div className="date-cell">
                          <span>{new Date(conversation.lastActivity).toLocaleDateString()}</span>
                          <small>{new Date(conversation.lastActivity).toLocaleTimeString()}</small>
                        </div>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button 
                            className="admin-btn-small primary" 
                            onClick={() => viewConversationDetails(conversation)}
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="admin-btn-small warning" 
                            onClick={() => handleConversationAction('flag', conversation._id)}
                            title="Flag Conversation"
                          >
                            <i className="fas fa-flag"></i>
                          </button>
                          <button 
                            className="admin-btn-small secondary" 
                            onClick={() => handleConversationAction('archive', conversation._id)}
                            title="Archive"
                          >
                            <i className="fas fa-archive"></i>
                          </button>
                          <button 
                            className="admin-btn-small danger" 
                            onClick={() => handleConversationAction('delete', conversation._id)}
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {((currentPage - 1) * conversationsPerPage) + 1} to {Math.min(currentPage * conversationsPerPage, statistics?.totalConversations || 0)} of {statistics?.totalConversations || 0} conversations
              </div>
              <div className="pagination">
                <button 
                  className="admin-btn secondary" 
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <i className="fas fa-chevron-left"></i>
                  Previous
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, currentPage - 2) + i;
                    if (page > totalPages) return null;
                    return (
                      <button
                        key={page}
                        className={`page-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  className="admin-btn secondary" 
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="tab-content">
            <div className="admin-stats-grid">
              <div className="admin-stat-card primary">
                <div className="admin-stat-icon">
                  <i className="fas fa-comments"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Active Conversations</h3>
                  <p className="admin-stat-value">{statistics?.activeConversations || 0}</p>
                  <span className="admin-stat-change">
                    {statistics?.activeUsers || 0} active users
                  </span>
                </div>
              </div>

              <div className="admin-stat-card success">
                <div className="admin-stat-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Avg Response Time</h3>
                  <p className="admin-stat-value">{statistics?.avgResponseTime || 0}ms</p>
                  <span className={`admin-stat-change ${statistics?.responseTimeChange > 0 ? 'negative' : 'positive'}`}>
                    <i className={`fas ${statistics?.responseTimeChange > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
                    {Math.abs(statistics?.responseTimeChange || 0)}ms from yesterday
                  </span>
                </div>
              </div>

              <div className="admin-stat-card warning">
                <div className="admin-stat-icon">
                  <i className="fas fa-coins"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Tokens Used Today</h3>
                  <p className="admin-stat-value">{adminService.formatNumber(statistics?.tokensToday || 0)}</p>
                  <span className="admin-stat-change">
                    ${(statistics?.costToday || 0).toFixed(2)} cost
                  </span>
                </div>
              </div>

              <div className="admin-stat-card danger">
                <div className="admin-stat-icon">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Error Rate</h3>
                  <p className="admin-stat-value">{statistics?.errorRate || 0}%</p>
                  <span className={`admin-stat-change ${statistics?.errorRate > 5 ? 'negative' : 'positive'}`}>
                    {statistics?.errorRate > 5 ? 'Above threshold' : 'Normal'}
                  </span>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="admin-analytics-section">
              <h3>System Status</h3>
              <div className="system-status-grid">
                <div className="status-indicator">
                  <div className={`status-icon ${systemStatus?.aiService === 'operational' ? 'healthy' : 'warning'}`}>
                    <i className="fas fa-brain"></i>
                  </div>
                  <div className="status-info">
                    <h4>AI Service</h4>
                    <span className="status-text">{systemStatus?.aiService || 'Operational'}</span>
                    <small>{systemStatus?.uptime || '99.9%'} uptime</small>
                  </div>
                </div>
                <div className="status-indicator">
                  <div className={`status-icon ${systemStatus?.apiHealth === 'healthy' ? 'healthy' : 'warning'}`}>
                    <i className="fas fa-server"></i>
                  </div>
                  <div className="status-info">
                    <h4>API Health</h4>
                    <span className="status-text">{systemStatus?.apiHealth || 'Healthy'}</span>
                    <small>{systemStatus?.apiResponseTime || 120}ms avg</small>
                  </div>
                </div>
                <div className="status-indicator">
                  <div className={`status-icon ${systemStatus?.queueStatus === 'normal' ? 'healthy' : 'warning'}`}>
                    <i className="fas fa-list"></i>
                  </div>
                  <div className="status-info">
                    <h4>Queue Status</h4>
                    <span className="status-text">{systemStatus?.queueStatus || 'Normal'}</span>
                    <small>{systemStatus?.queueLength || 0} in queue</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Errors */}
            {recentErrors && recentErrors.length > 0 && (
              <div className="admin-analytics-section">
                <h3>Recent Errors</h3>
                <div className="error-list">
                  {recentErrors.slice(0, 10).map((error, index) => (
                    <div key={index} className="error-item">
                      <div className="error-icon">
                        <i className="fas fa-exclamation-circle"></i>
                      </div>
                      <div className="error-details">
                        <h4>{error.type || 'Unknown Error'}</h4>
                        <p>{error.message}</p>
                        <small>{new Date(error.timestamp).toLocaleString()}</small>
                      </div>
                      <div className="error-count">
                        <span>{error.count} times</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Moderation Tab */}
        {activeTab === 'moderation' && (
          <div className="tab-content">
            <div className="moderation-placeholder">
              <i className="fas fa-shield-alt"></i>
              <h3>Content Moderation</h3>
              <p>AI content moderation tools coming soon...</p>
              <div className="moderation-features">
                <div className="feature-item">
                  <i className="fas fa-filter"></i>
                  <span>Automatic Content Filtering</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-flag"></i>
                  <span>Manual Review Queue</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-ban"></i>
                  <span>Content Blocking Rules</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-chart-bar"></i>
                  <span>Moderation Analytics</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="tab-content">
            <div className="settings-placeholder">
              <i className="fas fa-sliders-h"></i>
              <h3>AI Configuration</h3>
              <p>AI system configuration coming soon...</p>
              <div className="settings-features">
                <div className="feature-item">
                  <i className="fas fa-brain"></i>
                  <span>Model Configuration</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-tachometer-alt"></i>
                  <span>Performance Tuning</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-shield-alt"></i>
                  <span>Safety Settings</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-coins"></i>
                  <span>Cost Management</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conversation Details Modal */}
      {showConversationModal && selectedConversation && (
        <ConversationDetailsModal
          conversation={selectedConversation}
          onClose={() => {
            setShowConversationModal(false);
            setSelectedConversation(null);
          }}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
};

// Conversation Details Modal Component
const ConversationDetailsModal = ({ conversation, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [conversationDetails, setConversationDetails] = useState(null);

  useEffect(() => {
    fetchConversationDetails();
  }, [conversation]);

  const fetchConversationDetails = async () => {
    try {
      setLoading(true);
      const response = await adminService.getConversationDetails(conversation._id);
      if (response.success) {
        setConversationDetails(response.data);
      }
    } catch (error) {
      console.error('Error fetching conversation details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container large">
        <div className="modal-header">
          <h2>
            <i className="fas fa-comments"></i>
            Conversation Details
          </h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading-container">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading conversation details...</p>
            </div>
          ) : (
            <div className="conversation-details">
              <div className="detail-section">
                <h3>Conversation Info</h3>
                <div className="detail-item">
                  <label>User:</label>
                  <span>{conversation.userId?.name} ({conversation.userId?.email})</span>
                </div>
                <div className="detail-item">
                  <label>Mode:</label>
                  <span>{formatModeName(conversation.mode)}</span>
                </div>
                <div className="detail-item">
                  <label>Started:</label>
                  <span>{new Date(conversation.createdAt).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Last Activity:</label>
                  <span>{new Date(conversation.lastActivity).toLocaleString()}</span>
                </div>
              </div>

              {conversationDetails?.messages && (
                <div className="detail-section full-width">
                  <h3>Messages ({conversationDetails.messages.length})</h3>
                  <div className="messages-list">
                    {conversationDetails.messages.map((message, index) => (
                      <div key={index} className={`message-item ${message.role}`}>
                        <div className="message-header">
                          <span className="message-role">{message.role}</span>
                          <span className="message-time">{new Date(message.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="message-content">
                          {message.content}
                        </div>
                        {message.metadata && (
                          <div className="message-metadata">
                            <span>Tokens: {message.metadata.tokensUsed}</span>
                            <span>Time: {message.metadata.processingTime}ms</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="admin-btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const formatModeName = (mode) => {
  if (!mode) return 'Unknown';
  return mode.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const formatDuration = (duration) => {
  if (!duration) return '0m';
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

const getConversationStatus = (conversation) => {
  if (conversation.flagged) return 'flagged';
  if (conversation.archived) return 'archived';
  if (conversation.active) return 'active';
  return 'completed';
};

const getConversationStatusText = (conversation) => {
  const status = getConversationStatus(conversation);
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default AdminAIManagement; 