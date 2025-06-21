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
  const [refreshing, setRefreshing] = useState(false);

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
        setTotalUsers(response.data.pagination.totalCount);
      } else {
        setError(response.message || 'Failed to load users');
      }
    } catch (err) {
      console.error('User management error:', err);
      setError('Error loading user data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = () => {
    setCurrentPage(1);
    fetchUsers();
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
          if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
          }
          response = await adminService.deleteUser(userId);
          break;
        case 'resetPassword':
          response = await adminService.resetUserPassword(userId);
          if (response.success) {
            alert(`Password reset successfully. Temporary password: ${response.data.temporaryPassword}`);
          }
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
    
    const actionText = bulkAction === 'delete' ? 'delete' : bulkAction;
    if (!window.confirm(`Are you sure you want to ${actionText} ${selectedUsers.length} selected users?`)) {
      return;
    }
    
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
    }
  };

  const viewUserDetails = async (user) => {
    try {
      const response = await adminService.getUserDetails(user._id);
      if (response.success) {
        setSelectedUser(response.data);
        setShowUserModal(true);
      }
    } catch (error) {
      setError('Failed to load user details');
    }
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

  const UsersIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );

  const UserPlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
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
      <path d="m18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>
    </svg>
  );

  const ShieldIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );

  const XIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );

  const KeyIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8" cy="8" r="6"/>
      <path d="m13 13 5 5"/>
      <path d="m17 17 3 3"/>
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

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  if (loading && users.length === 0) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1><UsersIcon /> User Management</h1>
          <p>Loading user management...</p>
        </div>
        <div className="admin-loading">
          <SpinnerIcon />
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1><UsersIcon /> User Management</h1>
          <p>Manage user accounts and permissions</p>
        </div>
        <div className="admin-error">
          <WarningIcon />
          <h3>Error Loading User Management</h3>
          <p>{error}</p>
          <button className="admin-retry-btn" onClick={fetchUsers}>
            <RefreshIcon />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="header-content">
          <h1>
            <UsersIcon />
            User Management
          </h1>
          <p>Manage user accounts, permissions, and activities</p>
        </div>
        <div className="header-actions">
          <button 
            className="admin-refresh-button" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshIcon />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-danger">
          <WarningIcon />
          <span>{error}</span>
          <button 
            className="admin-alert-close"
            onClick={() => setError('')}
          >
            <XIcon />
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="admin-controls glass-bg">
        <div className="admin-search-section">
          <div className="admin-search-group">
            <div className="admin-search-input-wrapper">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={handleSearch}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                className="admin-search-input"
              />
            </div>
            <button 
              className="admin-search-btn"
              onClick={handleSearchSubmit}
            >
              Search
            </button>
          </div>

          <div className="admin-filters">
            <div className="admin-filter-group">
              <FilterIcon />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="admin-filter-select"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>

            <div className="admin-sort-group">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="admin-sort-select"
              >
                <option value="createdAt">Join Date</option>
                <option value="lastLogin">Last Activity</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
              </select>
              <button
                className={`admin-sort-order ${sortOrder === 'desc' ? 'desc' : 'asc'}`}
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>
        </div>

        <div className="admin-actions-section">
          <div className="admin-export-actions">
            <button 
              className="admin-export-btn"
              onClick={() => exportUsers('csv')}
            >
              <DownloadIcon />
              Export CSV
            </button>
            <button 
              className="admin-export-btn"
              onClick={() => exportUsers('json')}
            >
              <DownloadIcon />
              Export JSON
            </button>
          </div>

          {selectedUsers.length > 0 && (
            <div className="admin-bulk-actions">
              <span className="admin-selected-count">
                {selectedUsers.length} selected
              </span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="admin-bulk-select"
              >
                <option value="">Select Action</option>
                <option value="activate">Activate</option>
                <option value="suspend">Suspend</option>
                <option value="verify">Verify</option>
                <option value="delete">Delete</option>
              </select>
              <button
                className="admin-bulk-btn"
                onClick={handleBulkAction}
                disabled={!bulkAction}
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-table-container glass-bg">
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
                Name {sortBy === 'name' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th onClick={() => handleSort('email')} className="sortable">
                Email {sortBy === 'email' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th>Status</th>
              <th onClick={() => handleSort('createdAt')} className="sortable">
                Joined {sortBy === 'createdAt' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th onClick={() => handleSort('lastLogin')} className="sortable">
                Last Activity {sortBy === 'lastLogin' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th>Cards</th>
              <th>Spaces</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleUserSelect(user._id)}
                  />
                </td>
                <td>
                  <div className="admin-user-name">
                    {user.name || 'Unnamed User'}
                  </div>
                </td>
                <td>
                  <div className="admin-user-email">
                    {user.email}
                  </div>
                </td>
                <td>
                  <span className={`admin-status admin-status-${getUserStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <div className="admin-date">
                    {user.joinedFormatted}
                  </div>
                </td>
                <td>
                  <div className="admin-date">
                    {user.lastActivityFormatted}
                  </div>
                </td>
                <td>
                  <div className="admin-count">
                    {user.cardCount || 0}
                  </div>
                </td>
                <td>
                  <div className="admin-count">
                    {user.spaceCount || 0}
                  </div>
                </td>
                <td>
                  <div className="admin-actions">
                    <button
                      className="admin-action-btn admin-btn-view"
                      onClick={() => viewUserDetails(user)}
                      title="View Details"
                    >
                      <EyeIcon />
                    </button>
                    <button
                      className={`admin-action-btn ${user.suspended ? 'admin-btn-success' : 'admin-btn-warning'}`}
                      onClick={() => handleUserAction(user.suspended ? 'activate' : 'suspend', user._id)}
                      title={user.suspended ? 'Activate User' : 'Suspend User'}
                    >
                      <ShieldIcon />
                    </button>
                    <button
                      className="admin-action-btn admin-btn-info"
                      onClick={() => handleUserAction('resetPassword', user._id)}
                      title="Reset Password"
                    >
                      <KeyIcon />
                    </button>
                    <button
                      className="admin-action-btn admin-btn-danger"
                      onClick={() => handleUserAction('delete', user._id)}
                      title="Delete User"
                    >
                      <XIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && !loading && (
          <div className="admin-empty-state">
            <UsersIcon />
            <h3>No Users Found</h3>
            <p>No users match your current search and filter criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination glass-bg">
          <div className="admin-pagination-info">
            Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {adminService.formatNumber(totalUsers)} users
          </div>
          <div className="admin-pagination-controls">
            <button
              className="admin-pagination-btn"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon />
              Previous
            </button>
            
            <div className="admin-pagination-pages">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    className={`admin-pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              className="admin-pagination-btn"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <UserDetailsModal 
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  );
};

// User Details Modal Component
const UserDetailsModal = ({ user, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user.user.name || '',
    email: user.user.email || '',
    verified: user.user.verified || false,
    suspended: user.user.suspended || false
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await adminService.updateUser(user.user._id, formData);
      if (response.success) {
        onUpdate();
        setEditMode(false);
      }
    } catch (error) {
      console.error('Update user error:', error);
    } finally {
      setLoading(false);
    }
  };

  const XIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );

  const EditIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="m18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>
    </svg>
  );

  const SaveIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal glass-bg">
        <div className="admin-modal-header">
          <h2>User Details</h2>
          <button 
            className="admin-modal-close"
            onClick={onClose}
          >
            <XIcon />
          </button>
        </div>

        <div className="admin-modal-content">
          <div className="admin-user-details">
            <div className="admin-user-basic-info">
              <h3>Basic Information</h3>
              
              {editMode ? (
                <div className="admin-form-group">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="admin-form-input"
                  />
                </div>
              ) : (
                <p><strong>Name:</strong> {user.user.name || 'Not provided'}</p>
              )}

              {editMode ? (
                <div className="admin-form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="admin-form-input"
                  />
                </div>
              ) : (
                <p><strong>Email:</strong> {user.user.email}</p>
              )}

              <p><strong>Status:</strong> <span className={`admin-status admin-status-${user.user.status}`}>{user.user.status}</span></p>
              <p><strong>Joined:</strong> {user.user.joinedFormatted}</p>
              <p><strong>Last Activity:</strong> {user.user.lastActivityFormatted}</p>

              {editMode && (
                <div className="admin-form-checkboxes">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.verified}
                      onChange={(e) => setFormData(prev => ({ ...prev, verified: e.target.checked }))}
                    />
                    Verified
                  </label>
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.suspended}
                      onChange={(e) => setFormData(prev => ({ ...prev, suspended: e.target.checked }))}
                    />
                    Suspended
                  </label>
                </div>
              )}
            </div>

            <div className="admin-user-stats">
              <h3>Activity Statistics</h3>
              <div className="admin-stats-grid">
                <div className="admin-stat-item">
                  <span className="admin-stat-value">{user.stats.totalCards}</span>
                  <span className="admin-stat-label">Total Cards</span>
                </div>
                <div className="admin-stat-item">
                  <span className="admin-stat-value">{user.stats.totalSpaces}</span>
                  <span className="admin-stat-label">Total Spaces</span>
                </div>
                <div className="admin-stat-item">
                  <span className="admin-stat-value">{user.stats.totalInvitations}</span>
                  <span className="admin-stat-label">Invitations</span>
                </div>
                <div className="admin-stat-item">
                  <span className="admin-stat-value">{user.stats.totalAIChats}</span>
                  <span className="admin-stat-label">AI Conversations</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-modal-footer">
          {editMode ? (
            <>
              <button 
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  setEditMode(false);
                  setFormData({
                    name: user.user.name || '',
                    email: user.user.email || '',
                    verified: user.user.verified || false,
                    suspended: user.user.suspended || false
                  });
                }}
              >
                Cancel
              </button>
              <button 
                className="admin-btn admin-btn-primary"
                onClick={handleSave}
                disabled={loading}
              >
                <SaveIcon />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button 
              className="admin-btn admin-btn-primary"
              onClick={() => setEditMode(true)}
            >
              <EditIcon />
              Edit User
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement; 