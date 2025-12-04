import api from './api';

export const subscriptionService = {
  getPublicPlans: async () => {
    const response = await api.get('/subscription/plans');
    return response.data?.plans || [];
  },

  subscribe: async (planId, paymentMethod = 'manual') => {
    const response = await api.post('/subscription/subscribe', { planId, paymentMethod });
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get('/subscription/status');
    return response.data;
  },

  getPremiumStatus: async () => {
    const response = await api.get('/subscription/status');
    return response.data;
  },

  cancel: async () => {
    const response = await api.post('/subscription/cancel');
    return response.data;
  },

  activate: async () => {
    const response = await api.post('/subscription/activate');
    return response.data;
  },

  // Admin endpoints
  getAdminPlans: async () => {
    const response = await api.get('/admin/subscription/plans');
    return response.data?.plans || [];
  },

  createAdminPlan: async (payload) => {
    const response = await api.post('/admin/subscription/plans', payload);
    return response.data;
  },

  updateAdminPlan: async (id, payload) => {
    const response = await api.put(`/admin/subscription/plans/${id}`, payload);
    return response.data;
  },

  deleteAdminPlan: async (id) => {
    const response = await api.delete(`/admin/subscription/plans/${id}`);
    return response.data;
  },
};

