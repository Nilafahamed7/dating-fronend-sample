import api from './api';

export const preferenceService = {
  // Get my preferences
  getMyPreferences: async () => {
    const response = await api.get('/preferences/me');
    return response.data;
  },

  // Update preferences
  updatePreferences: async (preferences) => {
    const response = await api.put('/preferences/update', preferences);
    return response.data;
  },
};

