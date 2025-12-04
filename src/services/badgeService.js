import api from './api';

export const badgeService = {
  // Get my badges
  getMyBadges: async () => {
    const response = await api.get('/badges/me');
    return response.data;
  },

  // Get all available badges
  getAvailableBadges: async () => {
    const response = await api.get('/badges');
    return response.data;
  },

  // Get badge details
  getBadgeDetails: async (badgeId) => {
    const response = await api.get(`/badges/${badgeId}`);
    return response.data;
  },
};

