import api from './api';

export const groupService = {
  // List all groups
  listGroups: async (params = {}) => {
    const response = await api.get('/groups/list', { params });
    return response.data;
  },

  // Create a new group
  createGroup: async (groupData) => {
    const response = await api.post('/groups/create', groupData);
    return response.data;
  },

  // Get group details
  getGroupDetails: async (groupId) => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },

  // Join a group
  joinGroup: async (groupId, passkey) => {
    const response = await api.post('/groups/join', { groupId, passkey });
    return response.data;
  },

  // Leave a group
  leaveGroup: async (groupId) => {
    const response = await api.post('/groups/leave', { groupId });
    return response.data;
  },

  // Invite users to group
  inviteToGroup: async (groupId, invitees) => {
    const response = await api.post('/groups/invite', { groupId, invitees });
    return response.data;
  },

  // Get group members
  getGroupMembers: async (groupId) => {
    const response = await api.get(`/groups/${groupId}/members`);
    return response.data;
  },

  // Send message to group
  sendGroupMessage: async (groupId, text) => {
    const response = await api.post('/groups/message', { groupId, message: text });
    return response.data;
  },

  // Get group messages
  getGroupMessages: async (groupId, params = {}) => {
    const response = await api.get(`/groups/messages/${groupId}`, { params });
    return response.data;
  },

  // Update group
  updateGroup: async (groupId, groupData) => {
    const response = await api.put(`/groups/${groupId}`, groupData);
    return response.data;
  },

  // Delete group
  deleteGroup: async (groupId) => {
    const response = await api.delete(`/groups/${groupId}`);
    return response.data;
  },

  // Send group invitation via chat
  sendGroupInviteViaChat: async (groupId, recipientId) => {
    const response = await api.post('/groups/invite-via-chat', { groupId, recipientId });
    return response.data;
  },

  // Get group by share code
  getGroupByShareCode: async (shareCode) => {
    const response = await api.get(`/groups/share/${shareCode}`);
    return response.data;
  },

  // Join group by share code
  joinGroupByShareCode: async (shareCode, passkey) => {
    const response = await api.post('/groups/join-by-code', { shareCode, passkey });
    return response.data;
  },

  // Accept group invitation
  acceptInvitation: async (groupId) => {
    const response = await api.post('/groups/accept-invitation', { groupId });
    return response.data;
  },

  // Reject group invitation
  rejectInvitation: async (groupId) => {
    const response = await api.post('/groups/reject-invitation', { groupId });
    return response.data;
  },
};

