import api from './api';

export const matchService = {
  getSuggestions: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.online !== undefined) {
      queryParams.append('online', params.online);
    }
    const queryString = queryParams.toString();
    const url = `/match/suggestions${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  likeUser: async (userId) => {
    const response = await api.post('/match/like', { targetUserId: userId });
    return response.data;
  },

  dislikeUser: async (userId) => {
    const response = await api.post('/match/dislike', { targetUserId: userId });
    return response.data;
  },

  superlikeUser: async (userId) => {
    const response = await api.post('/match/superlike', { targetUserId: userId });
    return response.data;
  },

  getMatchList: async () => {
    const response = await api.get('/match/list');
    return response.data;
  },

  getMatchStatus: async (userId) => {
    const response = await api.get(`/match/status/${userId}`);
    return response.data;
  },

  blockUser: async (blockedUserId, reason) => {
    const response = await api.post('/match/block', { blockedUserId, reason });
    return response.data;
  },

  getBlockedList: async () => {
    const response = await api.get('/match/blocked-list');
    return response.data;
  },

  unblockUser: async (userId) => {
    const response = await api.delete(`/match/unblock/${userId}`);
    return response.data;
  },

  reportUser: async (reportedUserId, reason, details) => {
    const response = await api.post('/match/report', { reportedUserId, reason, details });
    return response.data;
  },

  getNotifications: async () => {
    const response = await api.get('/match/notifications');
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get('/match/stats');
    return response.data;
  },

  markNotificationsAsRead: async () => {
    const response = await api.post('/match/notifications/mark-read');
    return response.data;
  },
};

