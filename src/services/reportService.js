import api from './api';

export const reportService = {
  // Report a user
  reportUser: async (userId, reason, description) => {
    const response = await api.post('/report/user', { userId, reason, description });
    return response.data;
  },

  // Report content
  reportContent: async (contentType, contentId, reason, description) => {
    const response = await api.post('/report/content', { contentType, contentId, reason, description });
    return response.data;
  },

  // Get my reports
  getMyReports: async () => {
    const response = await api.get('/report/my-reports');
    return response.data;
  },
};

