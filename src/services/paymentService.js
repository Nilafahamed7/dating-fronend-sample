import api from './api';

export const paymentService = {
  /**
   * Create a Razorpay order
   */
  createOrder: async (amount, currency, purpose, metadata = {}) => {
    try {
      const response = await api.post('/payment/create-order', {
        amount,
        currency,
        purpose,
        metadata,
      });
      return response.data;
    } catch (error) {
      // Return error response in consistent format
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  /**
   * Verify Razorpay payment
   */
  verifyPayment: async (razorpayOrderId, razorpayPaymentId, razorpaySignature, transactionId) => {
    const response = await api.post('/payment/verify', {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      transactionId,
    });
    return response.data;
  },
};

