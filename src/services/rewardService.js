import api from './api';

export const rewardService = {
  // Get my points
  getMyPoints: async () => {
    const response = await api.get('/rewards/points');
    return response.data;
  },

  // Get leaderboard
  getLeaderboard: async (params = {}) => {
    const response = await api.get('/rewards/leaderboard', { params });
    return response.data;
  },

  // Get redeemable items
  getRedeemableItems: async () => {
    const response = await api.get('/rewards/redeem');
    return response.data;
  },

  // Redeem points
  redeemPoints: async (itemId) => {
    const response = await api.post('/rewards/redeem', { itemId });
    return response.data;
  },

  // Get redemption history
  getRedemptionHistory: async () => {
    const response = await api.get('/rewards/history');
    return response.data;
  },
};

