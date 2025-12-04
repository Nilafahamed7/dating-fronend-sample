import api from './api';

export const communityService = {
  // List all communities
  listCommunities: async (params = {}) => {
    const response = await api.get('/communities', { params });
    return response.data;
  },

  // Create a new community
  createCommunity: async (communityData) => {
    const response = await api.post('/communities/create', communityData);
    return response.data;
  },

  // Get community details (using feed endpoint which includes community info)
  getCommunityDetails: async (communityId) => {
    const response = await api.get(`/communities/feed/${communityId}`);
    return response.data;
  },

  // Join a community
  joinCommunity: async (communityId) => {
    const response = await api.post('/communities/join', { communityId });
    return response.data;
  },

  // Leave a community
  leaveCommunity: async (communityId) => {
    const response = await api.delete(`/communities/leave/${communityId}`);
    return response.data;
  },

  // Get my communities
  getMyCommunities: async () => {
    const response = await api.get('/communities/my');
    return response.data;
  },

  // Create a post in community
  createPost: async (communityId, postData) => {
    const response = await api.post('/communities/post', {
      communityId,
      content: postData.content || postData
    });
    return response.data;
  },

  // Get community posts (feed)
  getCommunityPosts: async (communityId, params = {}) => {
    const response = await api.get(`/communities/feed/${communityId}`, { params });
    return response.data;
  },

  // Match within community
  matchWithinCommunity: async (communityId, filters = {}) => {
    const response = await api.post('/communities/match', { communityId, filters });
    return response.data;
  },

  // Report community content
  reportContent: async (communityId, postId, reason, details) => {
    const response = await api.post('/communities/report', {
      communityId,
      postId,
      reason,
      details
    });
    return response.data;
  },

  // Delete community
  deleteCommunity: async (communityId) => {
    const response = await api.delete(`/communities/${communityId}`);
    return response.data;
  },
};

