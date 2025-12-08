import api from './api';

export const videoProfileService = {
  // Upload video profile
  uploadVideo: async (videoFile, duration, caption) => {
    const formData = new FormData();
    formData.append('file', videoFile); // Backend expects 'file' field
    if (duration) formData.append('duration', duration);
    if (caption) formData.append('caption', caption);

    const response = await api.post('/video-profiles/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get video profile (for current user or another user)
  getVideoProfile: async (userId = null) => {
    const params = userId ? { userId } : {};
    const response = await api.get('/video-profiles', { params });
    return response.data;
  },

  // Update video profile (caption, visibility)
  updateVideoProfile: async (videoId, updates) => {
    const response = await api.put(`/video-profiles/${videoId}`, updates);
    return response.data;
  },

  // Delete video profile
  deleteVideoProfile: async (videoId) => {
    const response = await api.delete(`/video-profiles/${videoId}`);
    return response.data;
  },

  // Unlock video profile (deduct coins)
  unlockVideo: async (videoId) => {
    const response = await api.post(`/video-profiles/${videoId}/unlock`);
    return response.data;
  },
};
