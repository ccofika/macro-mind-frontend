import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './AdminPages.css';

const AdminDatabaseManagement = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [activeTab, setActiveTab] = useState('collections');
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState(null);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [backups, setBackups] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const fetchDatabaseInfo = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getDatabaseInfo();
      if (response.success) {
        setData(response.data);
        setSystemInfo(response.data.systemInfo);
      } else {
        setError(response.message || 'Failed to load database information');
      }
    } catch (err) {
      console.error('Database management error:', err);
      setError('Error loading database information');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionData = async (collectionName) => {
    try {
      setIsQueryLoading(true);
      const response = await adminService.getCollectionData(collectionName, { limit: 50 });
      if (response.success) {
        setQueryResults(response.data);
      } else {
        setError(response.message || 'Failed to load collection data');
      }
    } catch (err) {
      console.error('Collection data error:', err);
      setError('Error loading collection data');
    } finally {
      setIsQueryLoading(false);
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) return;
    
    try {
      setIsQueryLoading(true);
      setError('');
      const response = await adminService.executeQuery(query, selectedCollection);
      if (response.success) {
        setQueryResults(response.data);
      } else {
        setError(response.message || 'Query execution failed');
      }
    } catch (err) {
      console.error('Query execution error:', err);
      setError('Error executing query');
    } finally {
      setIsQueryLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setError('');
      const response = await adminService.createBackup();
      if (response.success) {
        fetchBackups();
      } else {
        setError(response.message || 'Backup creation failed');
      }
    } catch (err) {
      console.error('Backup creation error:', err);
      setError('Error creating backup');
    }
  };

  const fetchBackups = async () => {
    try {
      const response = await adminService.getBackups();
      if (response.success) {
        setBackups(response.data.backups || []);
      }
    } catch (err) {
      console.error('Fetch backups error:', err);
    }
  };

  const restoreBackup = async (backupId) => {
    try {
      setError('');
      const response = await adminService.restoreBackup(backupId);
      if (response.success) {
        alert('Backup restored successfully');
        fetchDatabaseInfo();
      } else {
        setError(response.message || 'Backup restoration failed');
      }
    } catch (err) {
      console.error('Backup restoration error:', err);
      setError('Error restoring backup');
    }
  };

  const deleteBackup = async (backupId) => {
    try {
      const response = await adminService.deleteBackup(backupId);
      if (response.success) {
        fetchBackups();
      } else {
        setError(response.message || 'Backup deletion failed');
      }
    } catch (err) {
      console.error('Backup deletion error:', err);
      setError('Error deleting backup');
    }
  };

  const optimizeDatabase = async () => {
    try {
      setError('');
      const response = await adminService.optimizeDatabase();
      if (response.success) {
        alert('Database optimization completed');
        fetchDatabaseInfo();
      } else {
        setError(response.message || 'Database optimization failed');
      }
    } catch (err) {
      console.error('Database optimization error:', err);
      setError('Error optimizing database');
    }
  };

  const exportCollection = async (collectionName, format) => {
    try {
      const response = await adminService.exportCollection(collectionName, format);
      if (response.success) {
        // Trigger download
        const blob = new Blob([response.data], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${collectionName}_export.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        setError(response.message || 'Export failed');
      }
    } catch (err) {
      console.error('Export error:', err);
      setError('Error exporting collection');
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading Database Management...</p>
      </div>
    );
  }

  const { collections, statistics } = data || {};

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-database"></i>
            Database Management
          </h1>
          <p>Comprehensive database administration and monitoring</p>
        </div>
        <div className="header-actions">
          <button className="admin-btn primary" onClick={createBackup}>
            <i className="fas fa-save"></i>
            Create Backup
          </button>
          <button className="admin-btn secondary" onClick={optimizeDatabase}>
            <i className="fas fa-tools"></i>
            Optimize
          </button>
          <button className="admin-refresh-button" onClick={fetchDatabaseInfo}>
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
        {/* Database Management Tabs */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'collections' ? 'active' : ''}`}
            onClick={() => setActiveTab('collections')}
          >
            <i className="fas fa-table"></i>
            Collections
          </button>
          <button 
            className={`admin-tab ${activeTab === 'query' ? 'active' : ''}`}
            onClick={() => setActiveTab('query')}
          >
            <i className="fas fa-search"></i>
            Query Interface
          </button>
          <button 
            className={`admin-tab ${activeTab === 'backups' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('backups');
              fetchBackups();
            }}
          >
            <i className="fas fa-archive"></i>
            Backups
          </button>
          <button 
            className={`admin-tab ${activeTab === 'maintenance' ? 'active' : ''}`}
            onClick={() => setActiveTab('maintenance')}
          >
            <i className="fas fa-tools"></i>
            Maintenance
          </button>
        </div>

        {/* Collections Tab */}
        {activeTab === 'collections' && (
          <div className="tab-content">
            {/* Database Statistics */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card primary">
                <div className="admin-stat-icon">
                  <i className="fas fa-database"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Database Size</h3>
                  <p className="admin-stat-value">{formatBytes(statistics?.totalSize || 0)}</p>
                  <span className="admin-stat-change">
                    {statistics?.collections || 0} collections
                  </span>
                </div>
              </div>

              <div className="admin-stat-card success">
                <div className="admin-stat-icon">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Total Documents</h3>
                  <p className="admin-stat-value">{adminService.formatNumber(statistics?.totalDocuments || 0)}</p>
                  <span className="admin-stat-change">
                    Across all collections
                  </span>
                </div>
              </div>

              <div className="admin-stat-card warning">
                <div className="admin-stat-icon">
                  <i className="fas fa-chart-pie"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Index Size</h3>
                  <p className="admin-stat-value">{formatBytes(statistics?.indexSize || 0)}</p>
                  <span className="admin-stat-change">
                    {Math.round((statistics?.indexSize / statistics?.totalSize) * 100 || 0)}% of total
                  </span>
                </div>
              </div>

              <div className="admin-stat-card info">
                <div className="admin-stat-icon">
                  <i className="fas fa-server"></i>
                </div>
                <div className="admin-stat-info">
                  <h3>Memory Usage</h3>
                  <p className="admin-stat-value">{formatBytes(systemInfo?.memoryUsage || 0)}</p>
                  <span className="admin-stat-change">
                    {systemInfo?.memoryPercentage || 0}% used
                  </span>
                </div>
              </div>
            </div>

            {/* Collections Grid */}
            <div className="admin-analytics-section">
              <h3>Database Collections</h3>
              <div className="collections-grid">
                {collections?.map((collection, index) => (
                  <div key={index} className="collection-card">
                    <div className="collection-header">
                      <div className="collection-icon">
                        <i className={getCollectionIcon(collection.name)}></i>
                      </div>
                      <div className="collection-info">
                        <h4>{collection.name}</h4>
                        <span>{adminService.formatNumber(collection.documentCount)} documents</span>
                      </div>
                    </div>
                    <div className="collection-stats">
                      <div className="stat-item">
                        <label>Size:</label>
                        <span>{formatBytes(collection.size)}</span>
                      </div>
                      <div className="stat-item">
                        <label>Indexes:</label>
                        <span>{collection.indexCount}</span>
                      </div>
                      <div className="stat-item">
                        <label>Avg Doc Size:</label>
                        <span>{formatBytes(collection.avgDocSize)}</span>
                      </div>
                    </div>
                    <div className="collection-actions">
                      <button 
                        className="admin-btn-small primary" 
                        onClick={() => {
                          setSelectedCollection(collection.name);
                          fetchCollectionData(collection.name);
                        }}
                        title="Browse Collection"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button 
                        className="admin-btn-small secondary" 
                        onClick={() => exportCollection(collection.name, 'json')}
                        title="Export as JSON"
                      >
                        <i className="fas fa-file-code"></i>
                      </button>
                      <button 
                        className="admin-btn-small secondary" 
                        onClick={() => exportCollection(collection.name, 'csv')}
                        title="Export as CSV"
                      >
                        <i className="fas fa-file-csv"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Collection Data View */}
            {selectedCollection && queryResults && (
              <div className="admin-analytics-section">
                <h3>Collection Data: {selectedCollection}</h3>
                <div className="query-results">
                  <div className="results-header">
                    <span>{queryResults.documents?.length || 0} documents shown</span>
                    <div className="results-actions">
                      <button className="admin-btn-small secondary" onClick={() => exportCollection(selectedCollection, 'json')}>
                        <i className="fas fa-download"></i>
                        Export All
                      </button>
                    </div>
                  </div>
                  <div className="results-table-container">
                    <table className="admin-table compact">
                      <thead>
                        <tr>
                          {queryResults.schema?.map((field, index) => (
                            <th key={index}>{field}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResults.documents?.slice(0, 20).map((doc, index) => (
                          <tr key={index}>
                            {queryResults.schema?.map((field, fieldIndex) => (
                              <td key={fieldIndex}>
                                <span className="field-value">
                                  {formatFieldValue(doc[field])}
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Query Interface Tab */}
        {activeTab === 'query' && (
          <div className="tab-content">
            <div className="query-interface">
              <div className="query-controls">
                <div className="collection-selector">
                  <label htmlFor="collection-select">Target Collection:</label>
                  <select
                    id="collection-select"
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    className="admin-select"
                  >
                    <option value="">Select collection...</option>
                    {collections?.map((collection, index) => (
                      <option key={index} value={collection.name}>
                        {collection.name} ({adminService.formatNumber(collection.documentCount)} docs)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="query-actions">
                  <button 
                    className="admin-btn primary" 
                    onClick={executeQuery}
                    disabled={!query.trim() || isQueryLoading}
                  >
                    <i className={`fas ${isQueryLoading ? 'fa-spinner fa-spin' : 'fa-play'}`}></i>
                    Execute Query
                  </button>
                  <button 
                    className="admin-btn secondary" 
                    onClick={() => {
                      setQuery('');
                      setQueryResults(null);
                    }}
                  >
                    <i className="fas fa-trash"></i>
                    Clear
                  </button>
                </div>
              </div>

              <div className="query-editor">
                <label htmlFor="query-input">MongoDB Query (JSON format):</label>
                <textarea
                  id="query-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="query-textarea"
                  placeholder='Enter MongoDB query in JSON format, e.g.:
{
  "find": { "status": "active" },
  "sort": { "createdAt": -1 },
  "limit": 10
}'
                  rows={10}
                />
              </div>

              <div className="query-examples">
                <h4>Query Examples:</h4>
                <div className="example-buttons">
                  <button 
                    className="example-btn" 
                    onClick={() => setQuery('{"find": {}, "limit": 10}')}
                  >
                    Find First 10 Documents
                  </button>
                  <button 
                    className="example-btn" 
                    onClick={() => setQuery('{"find": {"createdAt": {"$gte": "2024-01-01"}}, "sort": {"createdAt": -1}}')}
                  >
                    Recent Documents
                  </button>
                  <button 
                    className="example-btn" 
                    onClick={() => setQuery('{"aggregate": [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]}')}
                  >
                    Group by Status
                  </button>
                </div>
              </div>

              {/* Query Results */}
              {queryResults && (
                <div className="query-results">
                  <div className="results-header">
                    <h4>Query Results</h4>
                    <span>{queryResults.documents?.length || 0} documents returned</span>
                  </div>
                  <div className="results-content">
                    <pre className="results-json">
                      {JSON.stringify(queryResults.documents, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Backups Tab */}
        {activeTab === 'backups' && (
          <div className="tab-content">
            <div className="backups-section">
              <div className="backup-actions">
                <button className="admin-btn primary" onClick={createBackup}>
                  <i className="fas fa-plus"></i>
                  Create New Backup
                </button>
              </div>

              <div className="backups-list">
                {backups.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-archive"></i>
                    <h3>No Backups Found</h3>
                    <p>Create your first backup to secure your data</p>
                  </div>
                ) : (
                  <div className="backup-items">
                    {backups.map((backup, index) => (
                      <div key={index} className="backup-item">
                        <div className="backup-info">
                          <div className="backup-icon">
                            <i className="fas fa-archive"></i>
                          </div>
                          <div className="backup-details">
                            <h4>{backup.name}</h4>
                            <p>Created: {new Date(backup.createdAt).toLocaleString()}</p>
                            <span>Size: {formatBytes(backup.size)}</span>
                          </div>
                        </div>
                        <div className="backup-status">
                          <span className={`status-badge ${backup.status}`}>
                            {backup.status}
                          </span>
                        </div>
                        <div className="backup-actions">
                          <button 
                            className="admin-btn-small primary" 
                            onClick={() => restoreBackup(backup.id)}
                            title="Restore Backup"
                          >
                            <i className="fas fa-undo"></i>
                          </button>
                          <button 
                            className="admin-btn-small secondary" 
                            onClick={() => {
                              const url = adminService.getBackupDownloadUrl(backup.id);
                              window.open(url, '_blank');
                            }}
                            title="Download Backup"
                          >
                            <i className="fas fa-download"></i>
                          </button>
                          <button 
                            className="admin-btn-small danger" 
                            onClick={() => deleteBackup(backup.id)}
                            title="Delete Backup"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div className="tab-content">
            <div className="maintenance-section">
              <div className="system-info">
                <h3>System Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Database Version:</label>
                    <span>{systemInfo?.version || 'Unknown'}</span>
                  </div>
                  <div className="info-item">
                    <label>Uptime:</label>
                    <span>{formatUptime(systemInfo?.uptime || 0)}</span>
                  </div>
                  <div className="info-item">
                    <label>Storage Engine:</label>
                    <span>{systemInfo?.storageEngine || 'Unknown'}</span>
                  </div>
                  <div className="info-item">
                    <label>Connection Count:</label>
                    <span>{systemInfo?.connections || 0}</span>
                  </div>
                </div>
              </div>

              <div className="maintenance-tools">
                <h3>Maintenance Tools</h3>
                <div className="tools-grid">
                  <div className="tool-card">
                    <div className="tool-icon">
                      <i className="fas fa-tools"></i>
                    </div>
                    <div className="tool-info">
                      <h4>Database Optimization</h4>
                      <p>Optimize database performance and rebuild indexes</p>
                      <button className="admin-btn primary" onClick={optimizeDatabase}>
                        <i className="fas fa-play"></i>
                        Run Optimization
                      </button>
                    </div>
                  </div>

                  <div className="tool-card">
                    <div className="tool-icon">
                      <i className="fas fa-broom"></i>
                    </div>
                    <div className="tool-info">
                      <h4>Cleanup Old Data</h4>
                      <p>Remove old logs and temporary data</p>
                      <button className="admin-btn secondary">
                        <i className="fas fa-play"></i>
                        Run Cleanup
                      </button>
                    </div>
                  </div>

                  <div className="tool-card">
                    <div className="tool-icon">
                      <i className="fas fa-chart-line"></i>
                    </div>
                    <div className="tool-info">
                      <h4>Analyze Performance</h4>
                      <p>Generate database performance report</p>
                      <button className="admin-btn info">
                        <i className="fas fa-play"></i>
                        Generate Report
                      </button>
                    </div>
                  </div>

                  <div className="tool-card">
                    <div className="tool-icon">
                      <i className="fas fa-shield-alt"></i>
                    </div>
                    <div className="tool-info">
                      <h4>Security Audit</h4>
                      <p>Check database security and permissions</p>
                      <button className="admin-btn warning">
                        <i className="fas fa-play"></i>
                        Run Audit
                      </button>
                    </div>
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

// Helper functions
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

const getCollectionIcon = (collectionName) => {
  const iconMap = {
    'users': 'fas fa-users',
    'cards': 'fas fa-id-card',
    'spaces': 'fas fa-project-diagram',
    'connections': 'fas fa-link',
    'aichatconversations': 'fas fa-brain',
    'invitations': 'fas fa-envelope',
    'adminauditlogs': 'fas fa-clipboard-list'
  };
  return iconMap[collectionName.toLowerCase()] || 'fas fa-table';
};

const formatFieldValue = (value) => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'object') return JSON.stringify(value).substring(0, 50) + '...';
  if (typeof value === 'string' && value.length > 50) return value.substring(0, 50) + '...';
  return String(value);
};

export default AdminDatabaseManagement; 