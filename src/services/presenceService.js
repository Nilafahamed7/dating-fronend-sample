import api from './api';

export const presenceService = {
  /**
   * Update user presence (online/offline)
   * @param {boolean} isOnline - Online status (boolean)
   * @returns {Promise<Object>} Response data
   */
  updatePresence: async (isOnline) => {
    const onlineStatus = isOnline ? 'online' : 'offline';
    const response = await api.post('/auth/presence', { isOnline, onlineStatus });
    return response.data;
  },

  /**
   * Get user presence status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Presence data
   */
  getPresence: async (userId) => {
    const response = await api.get(`/auth/presence/${userId}`);
    return response.data;
  },
};

