import api from './api';

export const adminService = {
  // Users
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUserStatus: async (userId, payload) => {
    const response = await api.patch(`/admin/user/${userId}/status`, payload);
    return response.data;
  },

  generateFakeUsers: async (count = 10) => {
    const response = await api.post('/admin/users/generate-fake', { count });
    return response.data;
  },

  getFakeUserCount: async () => {
    const response = await api.get('/admin/users/fake-count');
    return response.data;
  },

  deleteFakeUsers: async (count) => {
    const response = await api.delete('/admin/users/delete-fake', { data: { count } });
    return response.data;
  },

  // Fake Users Management (CRUD)
  getFakeUsers: async (params = {}) => {
    const response = await api.get('/admin/fake-users', { params });
    return response.data;
  },

  getFakeUser: async (id) => {
    const response = await api.get(`/admin/fake-users/${id}`);
    return response.data;
  },

  createFakeUser: async (formData) => {
    const response = await api.post('/admin/fake-users', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateFakeUser: async (id, formData) => {
    const response = await api.put(`/admin/fake-users/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteFakeUser: async (id) => {
    const response = await api.delete(`/admin/fake-users/${id}`);
    return response.data;
  },

  // Profiles
  getProfiles: async (params = {}) => {
    const response = await api.get('/admin/profiles', { params });
    return response.data;
  },

  verifyProfile: async (userId, verified) => {
    const response = await api.put(`/admin/profile/${userId}/verify`, { verified });
    return response.data;
  },

  // Analytics
  getDashboardOverview: async () => {
    const response = await api.get('/admin/dashboard/overview');
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get('/admin/users/stats');
    return response.data;
  },

  getEngagementMetrics: async () => {
    const response = await api.get('/admin/engagement/metrics');
    return response.data;
  },

  getRevenueSummary: async () => {
    const response = await api.get('/admin/revenue/summary');
    return response.data;
  },

  getActivityLogs: async (params = {}) => {
    const response = await api.get('/admin/activity/logs', { params });
    return response.data;
  },

  // Moderation
  getModerationUsers: async () => {
    const response = await api.get('/admin/moderation/users');
    return response.data;
  },

  updateModerationStatus: async (userId, status) => {
    const response = await api.put(`/admin/moderation/users/${userId}/status`, { status });
    return response.data;
  },

  getReportsSummary: async () => {
    const response = await api.get('/admin/reports/summary');
    return response.data;
  },

  // System
  getSystemHealth: async () => {
    const response = await api.get('/admin/system/health');
    return response.data;
  },

  getFeedbackAnalysis: async () => {
    const response = await api.get('/admin/feedback/analysis');
    return response.data;
  },

  sendNotification: async (notificationData) => {
    const response = await api.post('/admin/notifications/send', notificationData);
    return response.data;
  },

  exportData: async (params = {}) => {
    const response = await api.get('/admin/export/data', { params, responseType: 'blob' });
    return response.data;
  },

  // Master data (Interest, Language, etc.)
  getMasterDataSummary: async () => {
    const response = await api.get('/admin/master-data/summary');
    return response.data;
  },

  getMasterDataItems: async (type, params = {}) => {
    const response = await api.get(`/admin/master-data/${type}`, { params });
    return response.data;
  },

  createMasterDataItem: async (payload) => {
    // Handle FormData for file uploads
    const config = payload instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const response = await api.post('/admin/master-data', payload, config);
    return response.data;
  },

  updateMasterDataItem: async (id, payload) => {
    // Handle FormData for file uploads
    const config = payload instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const response = await api.put(`/admin/master-data/${id}`, payload, config);
    return response.data;
  },

  deleteMasterDataItem: async (id) => {
    const response = await api.delete(`/admin/master-data/${id}`);
    return response.data;
  },

  // Events
  getAllEvents: async (params = {}) => {
    const response = await api.get('/admin/events', { params });
    return response.data;
  },

  getEventStats: async () => {
    const response = await api.get('/admin/events/stats');
    return response.data;
  },

  getEventDetails: async (eventId) => {
    const response = await api.get(`/admin/events/${eventId}`);
    return response.data;
  },

  updateEventStatus: async (eventId, status) => {
    const response = await api.patch(`/admin/events/${eventId}/status`, { status });
    return response.data;
  },

  deleteEvent: async (eventId) => {
    const response = await api.delete(`/admin/events/${eventId}`);
    return response.data;
  },

  // Forums
  getAllForums: async (params = {}) => {
    const response = await api.get('/admin/forums', { params });
    return response.data;
  },

  getForumStats: async () => {
    const response = await api.get('/admin/forums/stats');
    return response.data;
  },

  getForumDetails: async (forumId) => {
    const response = await api.get(`/admin/forums/${forumId}`);
    return response.data;
  },

  deleteForum: async (forumId) => {
    const response = await api.delete(`/admin/forums/${forumId}`);
    return response.data;
  },

  // Payments
  getPayments: async (params = {}) => {
    const response = await api.get('/admin/payments', { params });
    return response.data;
  },

  getPaymentStats: async () => {
    const response = await api.get('/admin/payments/stats');
    return response.data;
  },

  // Chats
  getAllChats: async (params = {}) => {
    const response = await api.get('/admin/chats', { params });
    return response.data;
  },

  getChatStats: async () => {
    const response = await api.get('/admin/chats/stats');
    return response.data;
  },

  getChatDetails: async (matchId) => {
    const response = await api.get(`/admin/chats/${matchId}`);
    return response.data;
  },

  deleteChatMessage: async (messageId) => {
    const response = await api.delete(`/admin/chats/message/${messageId}`);
    return response.data;
  },

  // Gifts
  getAllGifts: async (params = {}) => {
    const response = await api.get('/admin/gifts', { params });
    return response.data;
  },

  getGiftStats: async () => {
    const response = await api.get('/admin/gifts/stats');
    return response.data;
  },

  getGiftDetails: async (giftId) => {
    const response = await api.get(`/admin/gifts/${giftId}`);
    return response.data;
  },

  // Wallet & Transactions
  getWalletTransactions: async (params = {}) => {
    const response = await api.get('/admin/wallet/transactions', { params });
    return response.data;
  },

  getWalletStats: async () => {
    const response = await api.get('/admin/wallet/stats');
    return response.data;
  },

  // Admin Coins
  getAdminCoinTransactions: async (params = {}) => {
    const response = await api.get('/admin/coins/transactions', { params });
    return response.data;
  },

  getAdminCoinsSummary: async (params = {}) => {
    const response = await api.get('/admin/coins/summary', { params });
    return response.data;
  },

  // Ice-Breakers
  getIcebreakers: async () => {
    const response = await api.get('/admin/icebreakers');
    return response.data;
  },

  createIcebreaker: async (data) => {
    const response = await api.post('/admin/icebreakers', data);
    return response.data;
  },

  updateIcebreaker: async (id, data) => {
    const response = await api.patch(`/admin/icebreakers/${id}`, data);
    return response.data;
  },

  deleteIcebreaker: async (id) => {
    const response = await api.delete(`/admin/icebreakers/${id}`);
    return response.data;
  },

  // Broadcast Notifications
  sendBroadcast: async (broadcastData) => {
    // Handle FormData for file uploads
    const config = broadcastData instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const response = await api.post('/admin/notifications/broadcast', broadcastData, config);
    return response.data;
  },

  getBroadcasts: async (params = {}) => {
    const response = await api.get('/admin/notifications/broadcasts', { params });
    return response.data;
  },

  getBroadcastDetails: async (id) => {
    const response = await api.get(`/admin/notifications/broadcasts/${id}`);
    return response.data;
  },

  getNotificationStatus: async (notificationId) => {
    const response = await api.get(`/admin/notifications/${notificationId}/status`);
    return response.data;
  },

  retryNotification: async (notificationId) => {
    const response = await api.post(`/admin/notifications/${notificationId}/retry`);
    return response.data;
  },

  // Page Content Management
  getPages: async () => {
    const response = await api.get('/admin/pages');
    return response.data;
  },

  getPage: async (pageType) => {
    const response = await api.get(`/admin/pages/${pageType}`);
    return response.data;
  },

  createOrUpdatePage: async (pageData) => {
    const response = await api.post('/admin/pages', pageData);
    return response.data;
  },

  deletePage: async (pageType) => {
    const response = await api.delete(`/admin/pages/${pageType}`);
    return response.data;
  },

  // Photo Verification
  getVerificationRequests: async (params = {}) => {
    const response = await api.get('/admin/verifications', { params });
    return response.data;
  },

  getVerificationRequest: async (id) => {
    const response = await api.get(`/admin/verifications/${id}`);
    return response.data;
  },

  approveVerification: async (id, data = {}) => {
    const response = await api.post(`/admin/verifications/${id}/approve`, data);
    return response.data;
  },

  rejectVerification: async (id, data = {}) => {
    const response = await api.post(`/admin/verifications/${id}/reject`, data);
    return response.data;
  },

  // Admin Notifications
  getAdminNotifications: async (params = {}) => {
    const response = await api.get('/admin/notifications/admin', { params });
    return response.data;
  },

  markAdminNotificationRead: async (id) => {
    const response = await api.patch(`/admin/notifications/admin/${id}/read`);
    return response.data;
  },
};

