import api from './api';

export const safetyService = {
  // Share date plan
  shareDatePlan: async (planData) => {
    const response = await api.post('/safety/share-date-plan', planData);
    return response.data;
  },

  // Check in during a date
  checkIn: async (checkInData) => {
    const response = await api.post('/safety/check-in', checkInData);
    return response.data;
  },

  // Get trusted contacts
  getTrustedContacts: async () => {
    const response = await api.get('/safety/trusted-contacts');
    return response.data;
  },

  // Add trusted contact
  addTrustedContact: async (contactData) => {
    const response = await api.post('/safety/add-trusted-contact', contactData);
    return response.data;
  },

  // Send emergency alert
  sendEmergencyAlert: async (alertData) => {
    const response = await api.post('/safety/emergency-alert', alertData);
    return response.data;
  },

  // Get date history
  getDateHistory: async () => {
    const response = await api.get('/safety/date-history');
    return response.data;
  },
};

