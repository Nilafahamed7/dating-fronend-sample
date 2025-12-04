import api from './api';

export const authService = {
  login: async (identifier, password) => {
    const response = await api.post('/auth/login', { identifier, password });
    return response.data;
  },

  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  verifyOTP: async (identifier, code, method) => {
    const response = await api.post('/auth/verify-otp', { identifier, code, method });
    return response.data;
  },

  resendOTP: async (identifier, method) => {
    const response = await api.post('/auth/resend-otp', { identifier, method });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  socialLogin: async (provider, accessToken) => {
    const response = await api.post('/auth/social-login', { provider, accessToken });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

