import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Component to handle deep links from notifications and delivery receipts
 */
export default function DeepLinkHandler() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Listen for messages from service worker
    const handleMessage = async (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        const { url } = event.data;
        if (url && url !== '/') {
          navigate(url);
        }
      }

      // Handle delivery receipt from service worker
      if (event.data && event.data.type === 'NOTIFICATION_DELIVERED' && user?._id) {
        const { data } = event.data;
        if (data && data.notificationId) {
          const deviceId = localStorage.getItem('deviceId') || `device-${user._id}-${Date.now()}`;
          if (!localStorage.getItem('deviceId')) {
            localStorage.setItem('deviceId', deviceId);
          }

          // Send delivered receipt
          notificationService.sendDeliveryReceipt(data.notificationId, deviceId, 'delivered')
            .catch(err => {
              // Error handling for delivery receipt
            });
        }
      }
    };

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, [navigate, user]);

  return null;
}

