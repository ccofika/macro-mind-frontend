import adminApi from './adminApi';

const adminService = {
  // ===============================
  // AUTHENTICATION
  // ===============================
  
  generateCredentials: async () => {
    try {
      const response = await adminApi.post('/admin/generate-credentials');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  adminLogin: async (email, password) => {
    try {
      const response = await adminApi.post('/admin/login', { email, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  login: async (credentials) => {
    try {
      const response = await adminApi.post('/admin/login', credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  verifyToken: async () => {
    try {
      const response = await adminApi.get('/admin/auth/verify');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===============================
  // DASHBOARD OVERVIEW
  // ===============================
  
  getDashboardOverview: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await adminApi.get(`/admin/dashboard/overview?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===============================
  // USERS & CARDS ANALYTICS
  // ===============================
  
  getUsersAndCardsAnalytics: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await adminApi.get(`/admin/analytics/users-cards?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUsersCardsTrends: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await adminApi.get(`/admin/analytics/users-cards/trends?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===============================
  // AI ANALYTICS
  // ===============================
  
  getAIAnalytics: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await adminApi.get(`/admin/analytics/ai?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAITrends: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await adminApi.get(`/admin/analytics/ai/trends?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  exportAIData: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await adminApi.get(`/admin/export/ai-analytics?${queryParams}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-analytics-export-${Date.now()}.${params.format || 'json'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  // ===============================
  // USER MANAGEMENT
  // ===============================
  
  getUserManagement: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await adminApi.get(`/admin/users?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAllUsers: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await adminApi.get(`/admin/users?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUserDetails: async (userId) => {
    try {
      const response = await adminApi.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await adminApi.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  toggleUserStatus: async (userId, suspend) => {
    try {
      const response = await adminApi.post(`/admin/users/${userId}/toggle-status`, { suspend });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await adminApi.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  exportUserData: async (userId) => {
    try {
      const response = await adminApi.get(`/admin/users/${userId}/export`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  bulkUserAction: async (action, userIds) => {
    try {
      const response = await adminApi.post('/admin/users/bulk-action', { action, userIds });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  suspendUser: async (userId) => {
    try {
      const response = await adminApi.post(`/admin/users/${userId}/toggle-status`, { suspend: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  activateUser: async (userId) => {
    try {
      const response = await adminApi.post(`/admin/users/${userId}/toggle-status`, { suspend: false });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resetUserPassword: async (userId) => {
    try {
      const response = await adminApi.post(`/admin/users/${userId}/reset-password`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===============================
  // AI MANAGEMENT
  // ===============================
  
  getAllAIConversations: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await adminApi.get(`/admin/ai/conversations?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getConversationDetails: async (conversationId) => {
    try {
      const response = await adminApi.get(`/admin/ai/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteAIConversation: async (conversationId) => {
    try {
      const response = await adminApi.delete(`/admin/ai/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===============================
  // DATABASE MANAGEMENT
  // ===============================
  
  getDatabaseOverview: async () => {
    try {
      const response = await adminApi.get('/admin/database/overview');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getCollectionData: async (collection, params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await adminApi.get(`/admin/database/${collection}?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  executeQuery: async (queryData) => {
    try {
      const response = await adminApi.post('/admin/database/query', queryData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===============================
  // AUDIT LOGS
  // ===============================
  
  getAuditLogs: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await adminApi.get(`/admin/audit/logs?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===============================
  // EXPORT FUNCTIONALITY
  // ===============================
  
  exportUsersCardsData: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await adminApi.get(`/admin/export/users-cards?${queryParams}`, {
        responseType: 'blob'
      });
      
      // Create download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = `users-cards-export-${Date.now()}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Export completed successfully' };
    } catch (error) {
      throw error;
    }
  },

  // ===============================
  // UTILITY FUNCTIONS
  // ===============================
  
  exportToCSV: (data, filename) => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  exportToJSON: (data, filename) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  formatBytes: (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  formatDate: (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },

  formatNumber: (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  },

  generateChartColors: (count) => {
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#F97316', // Orange
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#EC4899', // Pink
      '#6B7280'  // Gray
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  }
};

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      let value = row[header];
      
      // Handle nested objects and arrays
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      
      // Escape commas and quotes
      if (typeof value === 'string') {
        value = value.replace(/"/g, '""');
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value}"`;
        }
      }
      
      return value || '';
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
};

export default adminService; 