import api from './api';

export const analyticsService = {
  // Get profile analytics
  getProfileAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/profile', { params });
    return response.data;
  },

  // Get views analytics
  getViewsAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/views', { params });
    return response.data;
  },

  // Get likes analytics
  getLikesAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/likes', { params });
    return response.data;
  },

  // Get matches analytics
  getMatchesAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/matches', { params });
    return response.data;
  },
};

