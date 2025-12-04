import api from './api';

export const chatService = {
  getMessages: async (matchId) => {
    const response = await api.get(`/chat/messages/${matchId}`);
    return response.data;
  },

  sendMessage: async (matchId, text, groupId = null) => {
    const response = await api.post('/chat/send', {
      matchId: groupId ? null : matchId,
      groupId: groupId || null,
      message: text
    });
    return response.data;
  },

  sendImage: async (matchId, imageFile) => {
    const formData = new FormData();
    formData.append('matchId', matchId);
    formData.append('image', imageFile);
    const response = await api.post('/chat/send-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  reactToMessage: async (messageId, reaction) => {
    const response = await api.post('/chat/reaction', { messageId, reaction });
    return response.data;
  },

  sendTypingStatus: async (matchId, isTyping) => {
    const response = await api.post('/chat/typing', { matchId, isTyping });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/chat/unread-count');
    return response.data;
  },

  deleteMessage: async (messageId) => {
    const response = await api.delete(`/chat/delete/${messageId}`);
    return response.data;
  },

  sendGift: async (matchId, giftType, note) => {
    const response = await api.post('/chat/gift/send', { matchId, giftType, note: note || null });
    return response.data;
  },

  getGiftList: async () => {
    const response = await api.get('/chat/gift/list');
    return response.data;
  },
};

