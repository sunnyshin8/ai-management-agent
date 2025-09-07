import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Email API endpoints
export const emailAPI = {
  // Get all emails with filtering options
  getEmails: (params = {}) => api.get('/emails', { params }),
  
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
  getStats: () => api.get('/dashboard/stats'),
  
  // Get recent emails for preview
  getRecentEmails: (limit = 10) => 
    api.get('/dashboard/recent-emails', { params: { limit } }),
  
  // Get category statistics
  getCategoryStats: () => api.get('/dashboard/category-stats'),
  
  // Get response statistics
  getResponseStats: () => api.get('/dashboard/response-stats'),
  
  // Get performance metrics
  getPerformanceMetrics: (days = 7) => 
    api.get('/dashboard/performance-metrics', { params: { days } }),
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
