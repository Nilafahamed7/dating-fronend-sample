import api from './api';

export const callService = {
  // Initiate a call
  async initiateCall(calleeId, callType, confirmReturnCall = false) {
    try {
      const response = await api.post('/calls/initiate', {
        calleeId,
        callType, // 'voice' or 'video'
        confirmReturnCall, // true if user confirmed return call
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Accept an incoming call
  async acceptCall(callId) {
    try {
      const response = await api.post('/calls/accept', { callId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Decline an incoming call
  async declineCall(callId) {
    try {
      const response = await api.post('/calls/decline', { callId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Start call (when both participants join after accept)
  async startCall(callId) {
    try {
      const response = await api.post('/calls/start', { callId });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Convert call (audio to video or vice versa)
  async convertCall(callId, newCallType) {
    try {
      const response = await api.post('/calls/convert', { callId, newCallType });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // End call
  async endCall(callId) {
    const response = await api.post('/calls/end', { callId });
    return response.data;
  },

  // Get call details
  async getCall(callId) {
    const response = await api.get(`/calls/${callId}`);
    return response.data;
  },

  // Get call history
  async getCallHistory(page = 1, limit = 20, status = null) {
    const params = { page, limit };
    if (status) params.status = status;
    const response = await api.get('/calls', { params });
    return response.data;
  },

  // Get call transactions
  async getCallTransactions(page = 1, limit = 20, otherUserId = null, since = null) {
    const params = { page, limit };
    if (otherUserId) {
      params.otherUserId = otherUserId;
    }
    if (since) {
      params.since = since;
    }
    const response = await api.get('/calls/transactions', { params });
    return response.data;
  },

  // Accept callback request
  async acceptCallback(callbackId) {
    const response = await api.post('/calls/callback/accept', { callbackId });
    return response.data;
  },

  // Reject callback request
  async rejectCallback(callbackId) {
    const response = await api.post('/calls/callback/reject', { callbackId });
    return response.data;
  },

  // Request video upgrade
  async requestVideoUpgrade(callId) {
    const response = await api.post('/calls/upgrade-video-request', { callId });
    return response.data;
  },

  // Respond to video upgrade request
  async respondVideoUpgrade(callId, accepted, allowOneWay = false) {
    const response = await api.post('/calls/upgrade-video-response', {
      callId,
      accepted,
      allowOneWay
    });
    return response.data;
  },

  // Get active call (for rejoin)
  async getActiveCall() {
    try {
      const response = await api.get('/calls/active');
      return response.data;
    } catch (error) {
      // If 401, user is not authenticated - return empty response instead of throwing
      if (error.response?.status === 401) {
        return { success: false, call: null };
      }
      throw error;
    }
  },

  // Rejoin call
  async rejoinCall(callId, deviceId = null) {
    const response = await api.post('/calls/rejoin', { callId, deviceId });
    return response.data;
  },
};

