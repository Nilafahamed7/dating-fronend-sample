import api from './api';

export const notificationService = {
  /**
   * Register FCM token
   */
  registerToken: async (token, deviceInfo = {}) => {
    const response = await api.post('/notifications/register-token', {
      token,
      ...deviceInfo,
    });
    return response.data;
  },

  /**
   * Remove FCM token
   */
  removeToken: async (token) => {
    const response = await api.delete('/notifications/remove-token', {
      data: { token },
    });
    return response.data;
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async () => {
    try {
      const response = await api.get('/match/notifications');
      if (response.data && response.data.success && response.data.data) {
        const notifications = response.data.data.notifications || response.data.data || [];
        const unreadCount = notifications.filter(n => !n.isRead).length;
        return unreadCount;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  },

  sendDeliveryReceipt: async (notificationId, deviceId, status) => {
    try {
      const deviceIdToUse = deviceId || localStorage.getItem('deviceId') || `device-${Date.now()}`;
      if (!localStorage.getItem('deviceId')) {
        localStorage.setItem('deviceId', deviceIdToUse);
      }

      const response = await api.post(`/notifications/${notificationId}/receipt`, {
        deviceId: deviceIdToUse,
        status,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      // Don't throw - receipt sending is best effort
      return { success: false };
    }
  },
};
