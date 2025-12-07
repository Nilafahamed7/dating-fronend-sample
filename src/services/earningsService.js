import api from './api';

export const earningsService = {
  // Get top earners leaderboard
  getTopEarners: async (limit = 5, period = 'weekly') => {
    const response = await api.get('/earnings/leaderboard', {
      params: { limit, period },
    });
    return response.data;
  },

  // Get user's daily earnings for current week
  getDailyEarnings: async (weekStart = null) => {
    const params = weekStart ? { weekStart } : {};
    const response = await api.get('/earnings/daily', { params });
    return response.data;
  },
};













