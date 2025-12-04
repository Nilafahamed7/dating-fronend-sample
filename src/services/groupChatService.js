import api from './api';

export const groupChatService = {
  // Create a new group
  createGroup: async (name, members = [], isPrivate = false, avatar = null, description = null, tags = [], passkey = null) => {
    const response = await api.post('/chats/groups', {
      name,
      members: members.length > 0 ? members : [],
      isPrivate,
      avatar,
      description,
      tags,
      passkey,
    });
    return response.data;
  },

  // Get user's groups
  getMyGroups: async () => {
    const response = await api.get('/chats/groups');
    return response.data;
  },

  // Get group invitations
  getInvitations: async () => {
    const response = await api.get('/chats/groups/invitations');
    return response.data;
  },

  // Get group info
  getGroupInfo: async (groupId) => {
    const response = await api.get(`/chats/groups/${groupId}/info`);
    return response.data;
  },

  // Accept invitation
  acceptInvitation: async (groupId) => {
    const response = await api.post(`/chats/groups/${groupId}/accept`);
    return response.data;
  },

  // Decline invitation
  declineInvitation: async (groupId) => {
    const response = await api.post(`/chats/groups/${groupId}/decline`);
    return response.data;
  },

  // Join group
  joinGroup: async (groupId, passkey = null) => {
    const response = await api.post(`/chats/groups/${groupId}/join`, { passkey });
    return response.data;
  },

  // Leave group
  leaveGroup: async (groupId) => {
    const response = await api.post(`/chats/groups/${groupId}/leave`);
    return response.data;
  },

  // Invite users to group
  inviteToGroup: async (groupId, userIds) => {
    const response = await api.post(`/chats/groups/${groupId}/invite`, { userIds });
    return response.data;
  },

  // Generate invite link
  generateInviteLink: async (groupId) => {
    const response = await api.get(`/chats/groups/${groupId}/invite-link`);
    return response.data;
  },

  // Join group by token
  joinByToken: async (groupId, token) => {
    const response = await api.post(`/chats/groups/${groupId}/join-by-token`, { token });
    return response.data;
  },

  // Get group messages
  getGroupMessages: async (groupId, page = 1, limit = 50) => {
    const response = await api.get(`/chats/groups/${groupId}/messages`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Send group message
  sendGroupMessage: async (groupId, text) => {
    const response = await api.post('/chat/send', { groupId, message: text });
    return response.data;
  },

  // Pin group
  pinGroup: async (groupId) => {
    const response = await api.post(`/chats/groups/${groupId}/pin`);
    return response.data;
  },

  // Get pinned groups
  getPinnedGroups: async (userId) => {
    const response = await api.get(`/users/${userId}/pinned-groups`);
    return response.data;
  },

  // Update group
  updateGroup: async (groupId, updates) => {
    const response = await api.put(`/chats/groups/${groupId}`, updates);
    return response.data;
  },

  // Delete group
  deleteGroup: async (groupId) => {
    const response = await api.delete(`/chats/groups/${groupId}`);
    return response.data;
  },
};

