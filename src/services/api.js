import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and incognito header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add X-Incognito header if incognito mode is active (stored in window for global access)
    if (window.__incognitoMode === true) {
      config.headers['X-Incognito'] = 'true';
    }
    // Don't set Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/signup') ||
        requestUrl.includes('/auth/verify-otp');
      const isPublicEndpoint = requestUrl.includes('/public/');

      // Don't redirect for group join/accept endpoints - let components handle it
      const isGroupJoinEndpoint =
        requestUrl.includes('/groups/join') ||
        requestUrl.includes('/chats/groups') && (requestUrl.includes('/join') || requestUrl.includes('/accept'));

      // Only redirect if it's not an auth endpoint, not a public endpoint, and not a group join endpoint
      // Let components handle group join errors themselves
      const token = localStorage.getItem('token');
      if (!isAuthEndpoint && !isPublicEndpoint && !isGroupJoinEndpoint && token) {
        // Check if error message indicates token is invalid/expired
        const errorMessage = error.response?.data?.message || '';
        const isTokenError =
          errorMessage.includes('token') ||
          errorMessage.includes('authorized') ||
          errorMessage.includes('session') ||
          errorMessage.includes('Not authorized');

        if (isTokenError) {
          // Token exists but is invalid/expired - clear it and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Use setTimeout to allow error to be caught by component first
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

