import api from './api';

export const profileViewersService = {
  getProfileViewers: async (page = 1, limit = 20) => {
    const response = await api.get('/profile/viewers', {
      params: { page, limit },
    });
    return response.data;
  },
};













