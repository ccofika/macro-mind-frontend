import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './AdminPages.css';

const AdminUserManagement = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [bulkAction, setBulkAction] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const usersPerPage = 20;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, sortBy, sortOrder, filterBy]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getUserManagement({
        page: currentPage,
        limit: usersPerPage,
        search: searchTerm,
        sortBy,
        sortOrder,
        filter: filterBy
      });
      
      if (response.success) {
        setUsers(response.data.users);
        setTotalUsers(response.data.totalCount);
      } else {
        setError(response.message || 'Failed to load users');
      }
    } catch (err) {
      console.error('User management error:', err);
      setError('Error loading user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  const handleUserAction = async (action, userId) => {
    try {
      let response;
      switch (action) {
        case 'suspend':
          response = await adminService.suspendUser(userId);
          break;
        case 'activate':
          response = await adminService.activateUser(userId);
          break;
        case 'delete':
          response = await adminService.deleteUser(userId);
          break;
        case 'resetPassword':
          response = await adminService.resetUserPassword(userId);
          break;
        default:
          return;
      }
      
      if (response.success) {
        fetchUsers();
        setSelectedUsers([]);
      } else {
        setError(response.message || `Failed to ${action} user`);
      }
    } catch (err) {
      console.error(`User ${action} error:`, err);
      setError(`Error ${action}ing user`);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;
    
    setConfirmAction(() => async () => {
      try {
        const response = await adminService.bulkUserAction(bulkAction, selectedUsers);
        if (response.success) {
          fetchUsers();
          setSelectedUsers([]);
          setBulkAction('');
        } else {
          setError(response.message || `Failed to ${bulkAction} users`);
        }
      } catch (err) {
        console.error(`Bulk ${bulkAction} error:`, err);
        setError(`Error performing bulk ${bulkAction}`);
      } finally {
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const exportUsers = (format) => {
    try {
      const filename = `users-export-${new Date().getTime()}`;
      if (format === 'csv') {
        adminService.exportToCSV(users, `${filename}.csv`);
      } else if (format === 'json') {
        adminService.exportToJSON(users, `${filename}.json`);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const getUserStatus = (user) => {
    if (user.suspended) return 'suspended';
    if (user.lastLogin && new Date() - new Date(user.lastLogin) < 30 * 24 * 60 * 60 * 1000) return 'active';
    return 'inactive';
  };

  const getUserStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'danger';
      case 'inactive': return 'warning';
      default: return 'secondary';
    }
  };

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  if (loading && users.length === 0) {
    return (
      <div className="admin-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading User Management...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-users-cog"></i>
            User Management
          </h1>
          <p>Manage user accounts, permissions, and activities</p>
        </div>
        <div className="header-actions">
          <button className="admin-btn primary" onClick={() => setShowUserModal(true)}>
            <i className="fas fa-user-plus"></i>
            Add User
          </button>
          <button className="admin-refresh-button" onClick={fetchUsers}>
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
        {/* Search and Filters */}
        <div className="admin-controls">
          <div className="admin-search-container">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search users by name, email, or ID..."
              value={searchTerm}
              onChange={handleSearch}
              className="admin-search-input"
            />
          </div>
          
          <div className="admin-filters">
            <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)} className="admin-select">
              <option value="all">All Users</option>
              <option value="active">Active Users</option>
              <option value="inactive">Inactive Users</option>
              <option value="suspended">Suspended Users</option>
              <option value="new">New Users (Last 7 days)</option>
            </select>
            
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="admin-select">
              <option value="createdAt">Sort by: Created Date</option>
              <option value="lastLogin">Sort by: Last Login</option>
              <option value="name">Sort by: Name</option>
              <option value="email">Sort by: Email</option>
              <option value="cardCount">Sort by: Card Count</option>
            </select>
            
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="admin-select">
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          
          <div className="admin-actions">
            <button className="admin-btn secondary" onClick={() => exportUsers('csv')}>
              <i className="fas fa-file-csv"></i>
              Export CSV
            </button>
            <button className="admin-btn secondary" onClick={() => exportUsers('json')}>
              <i className="fas fa-file-code"></i>
              Export JSON
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bulk-actions-bar">
            <div className="selected-count">
              <i className="fas fa-check-square"></i>
              <span>{selectedUsers.length} users selected</span>
            </div>
            <div className="bulk-actions">
              <select 
                value={bulkAction} 
                onChange={(e) => setBulkAction(e.target.value)} 
                className="admin-select"
              >
                <option value="">Choose action...</option>
                <option value="activate">Activate Users</option>
                <option value="suspend">Suspend Users</option>
                <option value="delete">Delete Users</option>
                <option value="resetPassword">Reset Passwords</option>
                <option value="sendEmail">Send Email</option>
              </select>
              <button 
                className="admin-btn primary" 
                onClick={handleBulkAction}
                disabled={!bulkAction}
              >
                <i className="fas fa-bolt"></i>
                Apply
              </button>
              <button 
                className="admin-btn secondary" 
                onClick={() => setSelectedUsers([])}
              >
                <i className="fas fa-times"></i>
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="users-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th onClick={() => handleSort('name')} className="sortable">
                  User
                  {sortBy === 'name' && (
                    <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </th>
                <th onClick={() => handleSort('email')} className="sortable">
                  Email
                  {sortBy === 'email' && (
                    <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </th>
                <th onClick={() => handleSort('cardCount')} className="sortable">
                  Cards
                  {sortBy === 'cardCount' && (
                    <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </th>
                <th onClick={() => handleSort('lastLogin')} className="sortable">
                  Last Login
                  {sortBy === 'lastLogin' && (
                    <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </th>
                <th onClick={() => handleSort('createdAt')} className="sortable">
                  Joined
                  {sortBy === 'createdAt' && (
                    <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const status = getUserStatus(user);
                return (
                  <tr key={user._id} className={selectedUsers.includes(user._id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleUserSelect(user._id)}
                      />
                    </td>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="user-details">
                          <strong>{user.name || 'Unknown User'}</strong>
                          <small>ID: {user._id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="email-cell">
                        <span>{user.email}</span>
                        {user.emailVerified && (
                          <i className="fas fa-check-circle verified-icon" title="Email Verified"></i>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge-count">{user.cardCount || 0}</span>
                    </td>
                    <td>
                      <div className="date-cell">
                        {user.lastLogin ? (
                          <>
                            <span>{new Date(user.lastLogin).toLocaleDateString()}</span>
                            <small>{new Date(user.lastLogin).toLocaleTimeString()}</small>
                          </>
                        ) : (
                          <span className="never-logged">Never</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                        <small>{new Date(user.createdAt).toLocaleTimeString()}</small>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getUserStatusColor(status)}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="admin-btn-small primary" 
                          onClick={() => viewUserDetails(user)}
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        
                        {status === 'suspended' ? (
                          <button 
                            className="admin-btn-small success" 
                            onClick={() => handleUserAction('activate', user._id)}
                            title="Activate User"
                          >
                            <i className="fas fa-user-check"></i>
                          </button>
                        ) : (
                          <button 
                            className="admin-btn-small warning" 
                            onClick={() => handleUserAction('suspend', user._id)}
                            title="Suspend User"
                          >
                            <i className="fas fa-user-slash"></i>
                          </button>
                        )}
                        
                        <button 
                          className="admin-btn-small secondary" 
                          onClick={() => handleUserAction('resetPassword', user._id)}
                          title="Reset Password"
                        >
                          <i className="fas fa-key"></i>
                        </button>
                        
                        <button 
                          className="admin-btn-small danger" 
                          onClick={() => handleUserAction('delete', user._id)}
                          title="Delete User"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
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

      {/* User Details Modal */}
      {showUserModal && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onUpdate={fetchUsers}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmModal
          title={`Confirm Bulk ${bulkAction}`}
          message={`Are you sure you want to ${bulkAction} ${selectedUsers.length} selected users?`}
          onConfirm={confirmAction}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
};

// User Details Modal Component
const UserDetailsModal = ({ user, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserDetails();
    }
  }, [user]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUserDetails(user._id);
      if (response.success) {
        setUserDetails(response.data);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container large">
        <div className="modal-header">
          <h2>
            <i className="fas fa-user"></i>
            User Details
          </h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading-container">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading user details...</p>
            </div>
          ) : (
            <div className="user-details-grid">
              <div className="detail-section">
                <h3>Basic Information</h3>
                <div className="detail-item">
                  <label>Name:</label>
                  <span>{user.name || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <label>Email:</label>
                  <span>{user.email}</span>
                </div>
                <div className="detail-item">
                  <label>User ID:</label>
                  <span>{user._id}</span>
                </div>
                <div className="detail-item">
                  <label>Joined:</label>
                  <span>{new Date(user.createdAt).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Last Login:</label>
                  <span>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Activity Statistics</h3>
                <div className="detail-item">
                  <label>Cards Created:</label>
                  <span>{userDetails?.cardCount || 0}</span>
                </div>
                <div className="detail-item">
                  <label>Active Spaces:</label>
                  <span>{userDetails?.spaceCount || 0}</span>
                </div>
                <div className="detail-item">
                  <label>Connections:</label>
                  <span>{userDetails?.connectionCount || 0}</span>
                </div>
                <div className="detail-item">
                  <label>AI Conversations:</label>
                  <span>{userDetails?.aiChatCount || 0}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Account Status</h3>
                <div className="detail-item">
                  <label>Status:</label>
                  <span className={`status-badge ${getUserStatusColor(getUserStatus(user))}`}>
                    {getUserStatus(user).charAt(0).toUpperCase() + getUserStatus(user).slice(1)}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Email Verified:</label>
                  <span className={user.emailVerified ? 'verified' : 'unverified'}>
                    <i className={`fas ${user.emailVerified ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                    {user.emailVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Failed Login Attempts:</label>
                  <span>{user.failedLoginAttempts || 0}</span>
                </div>
              </div>

              {userDetails?.recentActivity && (
                <div className="detail-section full-width">
                  <h3>Recent Activity</h3>
                  <div className="activity-list">
                    {userDetails.recentActivity.map((activity, index) => (
                      <div key={index} className="activity-item">
                        <i className={`fas ${getActivityIcon(activity.type)}`}></i>
                        <span>{activity.description}</span>
                        <small>{new Date(activity.timestamp).toLocaleString()}</small>
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
          <button className="admin-btn primary" onClick={() => {
            onUpdate();
            onClose();
          }}>
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmModal = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-container small">
        <div className="modal-header">
          <h2>
            <i className="fas fa-exclamation-triangle"></i>
            {title}
          </h2>
        </div>
        <div className="modal-content">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="admin-btn secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="admin-btn danger" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getUserStatus = (user) => {
  if (user.suspended) return 'suspended';
  if (user.lastLogin && new Date() - new Date(user.lastLogin) < 30 * 24 * 60 * 60 * 1000) return 'active';
  return 'inactive';
};

const getUserStatusColor = (status) => {
  switch (status) {
    case 'active': return 'success';
    case 'suspended': return 'danger';
    case 'inactive': return 'warning';
    default: return 'secondary';
  }
};

const getActivityIcon = (type) => {
  const iconMap = {
    'login': 'fa-sign-in-alt',
    'card_created': 'fa-id-card',
    'space_created': 'fa-project-diagram',
    'ai_chat': 'fa-brain',
    'connection': 'fa-link'
  };
  return iconMap[type] || 'fa-info-circle';
};

export default AdminUserManagement; 