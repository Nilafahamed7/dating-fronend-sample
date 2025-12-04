import { useState } from 'react';
import { initRazorpayCheckout } from '../../utils/razorpay';
import { paymentService } from '../../services/paymentService';
import toast from 'react-hot-toast';

/**
 * Hook for Razorpay payment checkout
 */
export const useRazorpayCheckout = () => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async ({
    amount,
    currency = 'INR',
    purpose,
    metadata = {},
    onSuccess,
    onError,
    onCancel,
    description,
    prefill = {},
  }) => {
    try {
      setLoading(true);

      // Create order
      const orderResponse = await paymentService.createOrder(amount, currency, purpose, metadata);

      if (!orderResponse || !orderResponse.success) {
        // Check if Razorpay is not configured
        const errorMessage = orderResponse?.message || 'Failed to create payment order';
        if (errorMessage.includes('not configured') ||
            errorMessage.includes('PAYMENT_GATEWAY_NOT_CONFIGURED') ||
            orderResponse?.code === 'PAYMENT_GATEWAY_NOT_CONFIGURED') {
          throw new Error('Payment gateway is not configured. Please configure Razorpay keys in the backend .env file.');
        }
        throw new Error(errorMessage);
      }

      const { order, transactionId, key } = orderResponse;

      // Initialize Razorpay checkout
      const razorpay = await initRazorpayCheckout({
        key,
        amount: order.amount,
        currency: order.currency,
        orderId: order.id,
        name: 'Dating App',
        description: description || `Payment for ${purpose}`,
        prefill: {
          name: prefill.name || '',
          email: prefill.email || '',
          contact: prefill.contact || '',
        },
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await paymentService.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              transactionId
            );

            if (verifyResponse.success) {
              toast.success('Payment successful!');
              if (onSuccess) {
                onSuccess(verifyResponse.transaction);
              }
            } else {
              throw new Error(verifyResponse.message || 'Payment verification failed');
            }
          } catch (error) {
            toast.error(error.message || 'Payment verification failed');
            if (onError) {
              onError(error);
            }
          } finally {
            setLoading(false);
          }
        },
        onDismiss: () => {
          setLoading(false);
          if (onCancel) {
            onCancel();
          }
        },
      });

      // Open Razorpay checkout
      razorpay.open();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to initialize payment';

      // Show user-friendly error message
      if (errorMessage.includes('not configured') || error.response?.status === 503) {
        toast.error('Payment gateway is not available. Please contact support or try again later.');
      } else {
        toast.error(errorMessage);
      }

      setLoading(false);
      if (onError) {
        onError(error);
      }
    }
  };

  return {
    handlePayment,
    loading,
  };
};

export default useRazorpayCheckout;

