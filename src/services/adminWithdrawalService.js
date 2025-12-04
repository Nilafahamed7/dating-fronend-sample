import api from './api';

export const adminWithdrawalService = {
  // Get all withdrawal requests
  getAllWithdrawals: async (params = {}) => {
    const response = await api.get('/admin/withdrawals', { params });
    return response.data;
  },

  // Get withdrawal stats
  getWithdrawalStats: async () => {
    const response = await api.get('/admin/withdrawals/stats');
    return response.data;
  },

  // Get single withdrawal request
  getWithdrawalDetails: async (id) => {
    const response = await api.get(`/admin/withdrawals/${id}`);
    return response.data;
  },

  // Approve withdrawal request
  approveWithdrawal: async (id, data = {}) => {
    const response = await api.put(`/admin/withdrawals/${id}/approve`, data);
    return response.data;
  },

  // Reject withdrawal request
  rejectWithdrawal: async (id, data = {}) => {
    const response = await api.put(`/admin/withdrawals/${id}/reject`, data);
    return response.data;
  },

  // Complete withdrawal (mark as paid)
  completeWithdrawal: async (id, data = {}) => {
    const response = await api.put(`/admin/withdrawals/${id}/complete`, data);
    return response.data;
  },

  // Unlock coins for a withdrawal request
  unlockWithdrawalCoins: async (id, data = {}) => {
    const response = await api.put(`/admin/withdrawals/${id}/unlock`, data);
    return response.data;
  },
};

