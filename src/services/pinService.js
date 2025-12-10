import api from './api';

export const pinService = {
  // Pin or unpin a chat (match or group)
  pinChat: async (threadId) => {
    const response = await api.post(`/chats/${threadId}/pin`);
    return response.data;
  },

  // Get all pinned chats for current user
  getPinnedChats: async (userId) => {
    const response = await api.get(`/users/${userId}/pins`);
    return response.data;
  },
};















