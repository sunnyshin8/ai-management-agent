import axios from 'axios';

const api = axios.create({
  baseURL: "/api-v1",
  headers: {
    'Content-Type': 'application/json',
  },
});

// Email API endpoints
export const emailAPI = {
  // Get all emails with filtering options
  getEmails: (params = {}) => api.get('/emails/', { params }),

  // Get specific email by ID
  getEmail: (id) => api.get(`/emails/${id}`),

  // Get urgent emails
  getUrgentEmails: () => api.get('/emails/urgent'),

  // Get unprocessed emails
  getUnprocessedEmails: () => api.get('/emails/unprocessed'),

  // Fetch new emails from server
  fetchNewEmails: (daysBack = 1) => api.post('/emails/fetch', { days_back: daysBack }),

  // Generate AI response for email
  generateResponse: (emailId, customContext = null) => 
    api.post(`/emails/${emailId}/generate-response`, { 
      email_id: emailId, 
      custom_context: customContext 
    }),
  
  // Send response email
  sendResponse: (emailId, customResponse = null) => 
    api.post(`/emails/${emailId}/send-response`, { custom_response: customResponse }),

  // Update email
  updateEmail: (emailId, updateData) => 
    api.put(`/emails/${emailId}`, updateData),

  // Mark email as processed
  markProcessed: (emailId) => 
    api.post(`/emails/${emailId}/mark-processed`),

  // Delete email
  deleteEmail: (emailId) => 
    api.delete(`/emails/${emailId}`),
};

// Dashboard API endpoints
export const dashboardAPI = {
  // Get dashboard statistics
  getStats: async () => {
    try {
      return await api.get('/dashboard/stats');
    } catch (error) {
      console.error('Dashboard stats API error:', error);
      return { 
        data: null, 
        error: error.response?.data || error.message || 'Failed to load stats',
        status: error.response?.status || 0
      };
    }
  },
  
  // Get recent emails for preview
  getRecentEmails: async (limit = 10) => {
    try {
      return await api.get('/dashboard/recent-emails', { params: { limit } });
    } catch (error) {
      console.error('Recent emails API error:', error);
      return { 
        data: [], 
        error: error.response?.data || error.message || 'Failed to load recent emails',
        status: error.response?.status || 0
      };
    }
  },
  
  // Get category statistics
  getCategoryStats: async () => {
    try {
      return await api.get('/dashboard/category-stats');
    } catch (error) {
      console.error('Category stats API error:', error);
      return { 
        data: null, 
        error: error.response?.data || error.message || 'Failed to load category stats',
        status: error.response?.status || 0
      };
    }
  },
  
  // Get response statistics
  getResponseStats: async () => {
    try {
      return await api.get('/dashboard/response-stats');
    } catch (error) {
      console.error('Response stats API error:', error);
      return { 
        data: null, 
        error: error.response?.data || error.message || 'Failed to load response stats',
        status: error.response?.status || 0
      };
    }
  },
  
  // Get performance metrics
  getPerformanceMetrics: async (days = 7) => {
    try {
      return await api.get('/dashboard/performance-metrics', { params: { days } });
    } catch (error) {
      console.error('Performance metrics API error:', error);
      return { 
        data: null, 
        error: error.response?.data || error.message || 'Failed to load performance metrics',
        status: error.response?.status || 0
      };
    }
  },
};

// Utility functions
export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else {
    return `${diffDays} days ago`;
  }
};

export const getSentimentColor = (sentiment) => {
  switch (sentiment) {
    case 'positive':
      return '#4caf50';
    case 'negative':
      return '#f44336';
    case 'neutral':
      return '#ff9800';
    default:
      return '#757575';
  }
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent':
      return '#f44336';
    case 'not_urgent':
      return '#4caf50';
    default:
      return '#757575';
  }
};

export default api;
