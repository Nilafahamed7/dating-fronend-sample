import toast from 'react-hot-toast';

// Toast queue manager - ensures only one toast is visible at a time
class ToastQueue {
  constructor() {
    this.queue = [];
    this.currentToastId = null;
    this.currentMessage = null;
    this.isProcessing = false;
  }

  // Add toast to queue
  add(message, options = {}) {
    const toastConfig = {
      message,
      type: options.type || 'default', // 'success', 'error', 'default'
      duration: options.duration || 3000,
      ...options,
    };

    // Check if same message is already showing (dedupe)
    if (this.currentMessage === message) {
      // Duplicate - drop it
      return;
    }

    // Add to queue
    this.queue.push(toastConfig);

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // Check if message is same as current toast
  isSameMessage(message) {
    return this.currentMessage === message;
  }

  // Process the queue
  processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const toastConfig = this.queue.shift();

    // Show toast based on type
    let toastId;
    switch (toastConfig.type) {
      case 'success':
        toastId = toast.success(toastConfig.message, {
          duration: toastConfig.duration,
          ariaLive: 'polite',
        });
        break;
      case 'error':
        toastId = toast.error(toastConfig.message, {
          duration: toastConfig.duration,
          ariaLive: 'assertive',
        });
        break;
      default:
        toastId = toast(toastConfig.message, {
          duration: toastConfig.duration,
          ariaLive: 'polite',
          ...toastConfig,
        });
    }

    this.currentToastId = toastId;
    this.currentMessage = toastConfig.message;

    // Wait for toast to dismiss, then process next
    setTimeout(() => {
      this.currentToastId = null;
      this.currentMessage = null;
      this.processQueue();
    }, toastConfig.duration);
  }

  // Clear all toasts and queue
  clear() {
    this.queue = [];
    if (this.currentToastId) {
      toast.dismiss(this.currentToastId);
      this.currentToastId = null;
    }
    this.currentMessage = null;
    this.isProcessing = false;
  }
}

// Singleton instance
const toastQueue = new ToastQueue();

// Export convenience functions
export const queueToast = {
  success: (message, options = {}) => {
    toastQueue.add(message, { ...options, type: 'success' });
  },
  error: (message, options = {}) => {
    toastQueue.add(message, { ...options, type: 'error' });
  },
  default: (message, options = {}) => {
    toastQueue.add(message, { ...options, type: 'default' });
  },
  clear: () => {
    toastQueue.clear();
  },
};

export default queueToast;

