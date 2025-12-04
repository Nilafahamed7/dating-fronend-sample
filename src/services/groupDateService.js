import api from './api';

export const groupDateService = {
  // List all group dates
  listGroupDates: async (params = {}) => {
    const response = await api.get('/group-date/list', { params });
    return response.data;
  },

  // Create a new group date
  createGroupDate: async (dateData) => {
    const response = await api.post('/group-date/create', dateData);
    return response.data;
  },

  // Get group date details
  getGroupDateDetails: async (dateId) => {
    const response = await api.get(`/group-date/details/${dateId}`);
    return response.data;
  },

  // Join a group date
  joinGroupDate: async (groupDateId) => {
    const response = await api.post('/group-date/join', { groupDateId });
    return response.data;
  },

  // Invite users to group date
  inviteToGroupDate: async (groupDateId, invitees) => {
    const response = await api.post('/group-date/invite', { groupDateId, invitees });
    return response.data;
  },

  // Approve group date request
  approveGroupDateRequest: async (groupDateId, userId, action = 'approve') => {
    const response = await api.post('/group-date/approve', { groupDateId, userId, action });
    return response.data;
  },

  // Cancel group date
  cancelGroupDate: async (groupDateId, reason) => {
    const response = await api.post('/group-date/cancel', { groupDateId, reason });
    return response.data;
  },

  // Get group date history
  getGroupDateHistory: async (params = {}) => {
    const response = await api.get('/group-date/history', { params });
    return response.data;
  },
};

