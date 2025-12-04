import api from './api';

export const securityService = {
  getBlockedUsers: async () => {
    const response = await api.get('/privacy/blocked-users');
    return response.data?.blockedUsers || response.data?.blocked || [];
  },

  unblockUser: async (userId) => {
    const response = await api.post('/privacy/unblock-user', { blockedUserId: userId });
    return response.data;
  },

  getMyReports: async () => {
    const response = await api.get('/report/my-reports');
    return response.data?.reports || [];
  },
};

