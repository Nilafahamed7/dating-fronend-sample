import api from './api';

export const walletService = {
  // Get coin balance
  getBalance: async () => {
    const response = await api.get('/wallet/balance');
    return response.data;
  },

  // Get all coin packages
  getPackages: async () => {
    const response = await api.get('/wallet/packages');
    return response.data;
  },

  // Calculate custom purchase
  calculatePurchase: async (coins) => {
    const response = await api.post('/wallet/purchase/calculate', { coins });
    return response.data;
  },

  // Get transaction history
  getTransactions: async (params = {}) => {
    const response = await api.get('/wallet/transactions', { params });
    return response.data;
  },

  // Get single transaction
  getTransaction: async (txnId) => {
    const response = await api.get(`/wallet/transaction/${txnId}`);
    return response.data;
  },

  // Create Razorpay order for coin purchase
  createOrder: async (coins, amount, packageId = null) => {
    const response = await api.post('/payment/create-order', {
      amount,
      currency: 'INR',
      purpose: 'coins',
      metadata: {
        coinsPurchased: coins,
        packageId,
      },
    });
    return response.data;
  },

  // Verify payment after Razorpay success
  verifyPayment: async (paymentData) => {
    const response = await api.post('/payment/verify', paymentData);
    return response.data;
  },

  // Withdrawal requests
  createWithdrawalRequest: async (amountCoins, payoutMethod, payoutDetails, conversionRate = 0.10, platformFee = 0, amountInINR = null, clientInputMode = 'coins', clientInputValue = null) => {
    // Ensure coins is an integer
    const coins = Math.floor(amountCoins);

    // Calculate INR if not provided, or use provided value
    let calculatedINR;
    if (amountInINR !== null && amountInINR !== undefined) {
      calculatedINR = parseFloat(amountInINR.toFixed(2));
    } else {
      // Calculate from coins using conversion rate
      calculatedINR = parseFloat((coins * conversionRate).toFixed(2));
    }

    // Generate idempotency key to prevent duplicate requests
    const idempotencyKey = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientRequestId = idempotencyKey;

    const payload = {
      requestedCoins: coins,
      requestedAmountInINR: calculatedINR,
      payoutMethod,
      payoutDetails,
      conversionRate,
      platformFee,
      currency: 'INR',
      clientInputMode,
      clientInputValue: clientInputValue !== null && clientInputValue !== undefined ? clientInputValue : coins,
      idempotencyKey,
      clientRequestId,
    };

    const response = await api.post('/wallet/withdrawal/request', payload);
    return response.data;
  },

  getWithdrawalRequests: async (params = {}) => {
    const response = await api.get('/wallet/withdrawal/requests', { params });
    return response.data;
  },

  getWithdrawalRequest: async (id) => {
    const response = await api.get(`/wallet/withdrawal/request/${id}`);
    return response.data;
  },
};

