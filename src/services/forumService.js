import api from './api';

export const forumService = {
  createForum: async (forumData) => {
    const response = await api.post('/forums/create', forumData);
    return response.data;
  },

  listForums: async (params = {}) => {
    const response = await api.get('/forums/list', { params });
    return response.data;
  },

  getForumDetails: async (forumId) => {
    const response = await api.get(`/forums/${forumId}`);
    return response.data;
  },

  addForumPost: async (forumId, content) => {
    const response = await api.post('/forums/post', { forumId, content });
    return response.data;
  },

  replyToPost: async (postId, reply) => {
    const response = await api.post('/forums/reply', { postId, reply });
    return response.data;
  },

  reactToPost: async (postId, reaction) => {
    const response = await api.post('/forums/react', { postId, reaction });
    return response.data;
  },

  deletePost: async (postId) => {
    const response = await api.delete(`/forums/post/${postId}`);
    return response.data;
  },

  deleteForum: async (forumId) => {
    const response = await api.delete(`/forums/${forumId}`);
    return response.data;
  },
};

