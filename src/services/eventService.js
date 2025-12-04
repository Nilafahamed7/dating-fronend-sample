import api from './api';

export const eventService = {
  createEvent: async (eventData) => {
    const response = await api.post('/events/create', eventData);
    return response.data;
  },

  listEvents: async (params = {}) => {
    const response = await api.get('/events/list', { params });
    return response.data;
  },

  getNearbyEvents: async (params = {}) => {
    const response = await api.get('/events/nearby', { params });
    return response.data;
  },

  getInterestEvents: async () => {
    const response = await api.get('/events/interests');
    return response.data;
  },

  getMyEvents: async () => {
    const response = await api.get('/events/my-events');
    return response.data;
  },

  getEventHistory: async () => {
    const response = await api.get('/events/history');
    return response.data;
  },

  getEventDetails: async (eventId) => {
    const response = await api.get(`/events/details/${eventId}`);
    return response.data;
  },

  joinEvent: async (eventId) => {
    const response = await api.post('/events/join', { eventId });
    return response.data;
  },

  leaveEvent: async (eventId) => {
    const response = await api.post('/events/leave', { eventId });
    return response.data;
  },

  inviteToEvent: async (eventId, invitees, message) => {
    const response = await api.post('/events/invite', { eventId, invitees, message });
    return response.data;
  },

  checkInToEvent: async (eventId, latitude, longitude) => {
    const response = await api.post('/events/check-in', { eventId, latitude, longitude });
    return response.data;
  },

  reportEvent: async (eventId, reason, details) => {
    const response = await api.post('/events/report', { eventId, reason, details });
    return response.data;
  },

  deleteEvent: async (eventId) => {
    const response = await api.delete(`/events/delete/${eventId}`);
    return response.data;
  },
};

