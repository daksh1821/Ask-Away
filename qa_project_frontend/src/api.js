// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Direct backend URL for testing
  timeout: 10000, // 10 second timeout
});

// Set or remove token in axios + localStorage
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('qa_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('qa_token');
  }
};

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('qa_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          setAuthToken(null);
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          console.error('Access denied:', data.detail || 'Forbidden');
          break;
        case 404:
          console.error('Resource not found:', data.detail || 'Not found');
          break;
        case 422:
          console.error('Validation error:', data.detail || 'Invalid data');
          break;
        case 500:
          console.error('Server error:', data.detail || 'Internal server error');
          break;
        default:
          console.error('API Error:', data.detail || error.message);
      }
    } else if (error.request) {
      console.error('Network error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Load token on app start
const savedToken = localStorage.getItem('qa_token');
if (savedToken) {
  setAuthToken(savedToken);
}

// Helper functions for common API calls
export const apiHelpers = {
  auth: {
    // Use the JSON login endpoint that matches your backend
    login: (credentials) => api.post('/auth/login-json', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/me', data),
    deleteAccount: () => api.delete('/auth/me'),
    getUserStats: () => api.get('/auth/me/stats'),
  },

  questions: {
    list: (params = {}) => api.get('/questions', { params }),
    search: (query, params = {}) => api.get('/questions/search', { params: { q: query, ...params } }),
    feed: (params = {}) => api.get('/questions/feed', { params }),
    trending: (params = {}) => api.get('/questions/trending', { params }),
    getById: (id, includeAnswers = true) => api.get(`/questions/${id}`, { params: { include_answers: includeAnswers } }),
    create: (questionData) => api.post('/questions', questionData),
    update: (id, updateData) => api.put(`/questions/${id}`, updateData),
    delete: (id) => api.delete(`/questions/${id}`),
    getUserQuestions: (userId, params = {}) => api.get(`/questions`, { params: { user_id: userId, ...params } }),
    getMyQuestions: (params = {}) => api.get('/questions/my', { params }),
    // Add view tracking
    incrementView: (id) => api.post(`/questions/${id}/view`),
  },

  answers: {
    getForQuestion: (questionId, params = {}) => api.get(`/answers/question/${questionId}`, { params }),
    create: (questionId, answerData) => api.post(`/answers/${questionId}`, answerData),
    update: (answerId, updateData) => api.put(`/answers/${answerId}`, updateData),
    delete: (answerId) => api.delete(`/answers/${answerId}`),
    star: (answerId) => api.post(`/answers/${answerId}/star`),
    unstar: (answerId) => api.delete(`/answers/${answerId}/star`),
    getStarredAnswers: () => api.get('/answers/starred'),
    getMyAnswers: (params = {}) => api.get('/answers/my', { params }),
  },

  // Add platform stats
  stats: {
    getPlatformStats: () => api.get('/stats/platform'),
    getUserStats: (userId) => api.get(`/stats/user/${userId}`),
  },

  // Add file upload support (for future profile pictures)
  upload: {
    profilePicture: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/upload/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  },

  // AI Services
  ai: {
    generateSummary: (questionId) => api.post(`/ai/summarize/${questionId}`),
    suggestTags: (title, content) => api.post('/ai/suggest-tags', null, { params: { title, content } }),
    getQualityScore: (answerId) => api.get(`/ai/quality-score/${answerId}`),
    getAnalytics: () => api.get('/ai/analytics/platform'),
  },

  // Integrations
  integrations: {
    getStatus: () => api.get('/integrations/status'),
    sendSlackNotification: (channel, message) => api.post('/integrations/slack/notify', { channel, message }),
    sendDailySummary: () => api.post('/integrations/slack/daily-summary'),
    backupData: () => api.post('/integrations/aws/backup'),
    sendMetrics: () => api.post('/integrations/aws/metrics'),
  },

  // OAuth
  oauth: {
    googleLogin: () => window.location.href = `${api.defaults.baseURL}/auth/google/login`,
  },
};

export default api;