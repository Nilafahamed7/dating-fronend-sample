import api from './api';

export const publicService = {
  // Get page content (privacy-policy, terms-conditions, contact-us, safety-policy)
  getPageContent: async (pageType) => {
    const response = await api.get(`/public/pages/${pageType}`);
    return response.data;
  },
  // Get available gift types
  getGifts: async () => {
    const response = await api.get('/public/gifts');
    return response.data;
  },
  // Get FAQs
  getFAQs: async () => {
    const response = await api.get('/public/faqs');
    return response.data;
  },
};
