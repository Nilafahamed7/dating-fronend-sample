import { loadScript } from './helpers';

let razorpayLoaded = false;

/**
 * Load Razorpay script dynamically
 */
export const loadRazorpay = async () => {
  if (razorpayLoaded) {
    return window.Razorpay;
  }

  try {
    await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    razorpayLoaded = true;
    return window.Razorpay;
  } catch (error) {
    throw new Error('Failed to load payment gateway');
  }
};

/**
 * Initialize Razorpay checkout
 */
export const initRazorpayCheckout = async (options) => {
  const Razorpay = await loadRazorpay();

  return new Razorpay({
    key: options.key,
    amount: options.amount,
    currency: options.currency || 'INR',
    name: options.name || 'Dating App',
    description: options.description || 'Payment',
    order_id: options.orderId,
    handler: options.handler,
    prefill: {
      name: options.prefill?.name || '',
      email: options.prefill?.email || '',
      contact: options.prefill?.contact || '',
    },
    theme: {
      color: '#FF6B9D',
    },
    modal: {
      ondismiss: options.onDismiss || (() => {}),
    },
  });
};

