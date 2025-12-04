import api from './api';

export const coinService = {
  getBalance: async () => {
    const response = await api.get('/credits/balance');
    return response.data;
  },

  purchaseCoins: async (coins, paymentMethod = 'razorpay') => {
    const response = await api.post('/credits/purchase', {
      coins,
      paymentMethod,
    });
    return response.data;
  },

  useCoins: async (action, coinsUsed) => {
    const response = await api.post('/credits/use', {
      action,
      coinsUsed,
    });
    return response.data;
  },
};

