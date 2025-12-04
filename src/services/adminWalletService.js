import api from './api';

export const adminWalletService = {
  // Coin Packages
  getAllPackages: async () => {
    const response = await api.get('/admin/wallet/packages');
    return response.data;
  },

  createPackage: async (packageData) => {
    const response = await api.post('/admin/wallet/package', packageData);
    return response.data;
  },

  updatePackage: async (id, packageData) => {
    const response = await api.put(`/admin/wallet/package/${id}`, packageData);
    return response.data;
  },

  deletePackage: async (id) => {
    const response = await api.delete(`/admin/wallet/package/${id}`);
    return response.data;
  },

  // Transactions
  getAllTransactions: async (params = {}) => {
    const response = await api.get('/admin/wallet/transactions', { params });
    return response.data;
  },

  getWalletStats: async () => {
    const response = await api.get('/admin/wallet/stats');
    return response.data;
  },

  addCoinsToUser: async (userId, coins, reason) => {
    const response = await api.post('/admin/wallet/add-coins', {
      userId,
      coins,
      reason,
    });
    return response.data;
  },
};

