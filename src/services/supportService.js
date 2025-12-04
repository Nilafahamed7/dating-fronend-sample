import api from './api';

export const supportService = {
  // Create a support ticket
  createTicket: async (ticketData) => {
    const response = await api.post('/support/tickets', ticketData);
    return response.data;
  },

  // Get my tickets
  getMyTickets: async (params = {}) => {
    const response = await api.get('/support/tickets', { params });
    return response.data;
  },

  // Get ticket details
  getTicketDetails: async (ticketId) => {
    const response = await api.get(`/support/tickets/${ticketId}`);
    return response.data;
  },

  // Add response to ticket
  addResponse: async (ticketId, message) => {
    const response = await api.post(`/support/tickets/${ticketId}/response`, { message });
    return response.data;
  },

  // Close ticket
  closeTicket: async (ticketId) => {
    const response = await api.post(`/support/tickets/${ticketId}/close`);
    return response.data;
  },
};

