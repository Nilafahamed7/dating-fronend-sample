import { useEffect, useRef, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FullScreenNotification from '../components/notifications/FullScreenNotification';

// Stubs for Firebase functions (Firebase removed)
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return null;
  }
  if (Notification.permission === 'granted') {
    return 'stub-token';
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return 'stub-token';
    }
  }
  return null;
};

const getFCMToken = async () => {
  return 'stub-token';
};

const onForegroundMessage = async (callback) => {
  // Return a no-op unsubscribe function
  return () => {};
};

/**
 * Custom hook to handle FCM notifications
 */
export const useFCMNotifications = () => {
  // Safely get auth context - may be null if not within AuthProvider
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;

  const navigate = useNavigate();
  const tokenRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const [fullScreenNotification, setFullScreenNotification] = useState(null);

  // Get device info
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    let platform = 'web';

    if (/Android/i.test(userAgent)) {
      platform = 'android';
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
      platform = 'ios';
    }

    return {
      platform,
      deviceId: localStorage.getItem('deviceId') || `device-${Date.now()}`,
      appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    };
  };

  // Register FCM token
  const registerToken = async () => {
    if (!user?._id) return;

    try {
      // Request permission and get token
      const token = await requestNotificationPermission();

      if (!token) {
        return;
      }

      tokenRef.current = token;

      // Register token with backend
      const deviceInfo = getDeviceInfo();
      await notificationService.registerToken(token, deviceInfo);
    } catch (error) {
      // Error handling for token registration
    }
  };

  // Handle foreground messages
  useEffect(() => {
    if (!user?._id) return;

    // Set up foreground message handler (async)
    let mounted = true;
    onForegroundMessage((payload) => {
      if (!mounted) return;
      // Show custom notification
      const notification = payload.notification || {};
      const data = payload.data || {};

      // Determine if this is a broadcast notification
      const isBroadcast = data.type === 'broadcast';
      const notificationTitle = notification.title || payload.notification?.title || 'New Notification';
      const notificationBody = notification.body || payload.notification?.body || '';
      const notificationImage = notification.image || payload.notification?.image || data.imageUrl;

      // Send delivered receipt for broadcast notifications
      if (isBroadcast && data.broadcastId && user?._id) {
        const deviceId = localStorage.getItem('deviceId') || `device-${user._id}-${Date.now()}`;
        if (!localStorage.getItem('deviceId')) {
          localStorage.setItem('deviceId', deviceId);
        }

        // Send delivered receipt
        notificationService.sendDeliveryReceipt(data.broadcastId, deviceId, 'delivered')
          .catch(err => {
            // Error handling for delivery receipt
          });
      }

      // For broadcast notifications, show full-screen modal
      if (isBroadcast) {
        setFullScreenNotification({
          type: 'broadcast',
          title: notificationTitle.replace('📢 ', ''), // Remove emoji from title
          body: notificationBody,
          imageUrl: notificationImage,
          deepLink: data.deepLink || data.url || '/',
          broadcastId: data.broadcastId,
        });
      }

      // Create beautiful custom notification
      if (Notification.permission === 'granted') {
        const notificationOptions = {
          body: isBroadcast ? `📢 ${notificationBody}` : notificationBody,
          icon: notificationImage || '/icon-192x192.png',
          badge: '/badge-72x72.png',
          image: notificationImage, // Large image for rich notifications
          tag: isBroadcast ? `broadcast-${data.broadcastId || Date.now()}` : (data.type || 'notification'),
          requireInteraction: isBroadcast, // Broadcast notifications require interaction
          vibrate: isBroadcast ? [200, 100, 200, 100, 200] : [200, 100, 200], // Longer vibration for broadcasts
          timestamp: Date.now(),
          silent: false,
          renotify: true,
          data: {
            url: data.deepLink || data.url || '/',
            type: data.type,
            broadcastId: data.broadcastId,
            ...data,
          },
          // Additional styling
          dir: 'ltr',
          lang: 'en',
        };

        const notificationInstance = new Notification(notificationTitle, notificationOptions);

        // Handle click with beautiful animation
        notificationInstance.onclick = (event) => {
          event.preventDefault();
          window.focus();

          // Navigate to deep link
          const deepLink = data.deepLink || data.url || '/';
          if (deepLink && deepLink !== '/') {
            navigate(deepLink);
          }

          notificationInstance.close();
        };

        // Auto-close after 8 seconds for non-broadcast, 15 seconds for broadcast
        setTimeout(() => {
          notificationInstance.close();
        }, isBroadcast ? 15000 : 8000);
      } else {
        // Beautiful fallback toast notification
        const toastMessage = `${notificationTitle}\n${notificationBody}`;
        const toastOptions = {
          icon: isBroadcast ? '📢' : '🔔',
          duration: isBroadcast ? 8000 : 5000,
          style: {
            borderRadius: '12px',
            background: isBroadcast ? '#FF6B6B' : '#333',
            color: '#fff',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
            whiteSpace: 'pre-line',
            lineHeight: '1.5',
          },
        };

        // Create custom icon if image is available
        if (notificationImage) {
          const img = document.createElement('img');
          img.src = notificationImage;
          img.alt = '';
          img.style.width = '24px';
          img.style.height = '24px';
          img.style.borderRadius = '4px';
          img.style.marginRight = '8px';
          toastOptions.icon = img;
        }

        toast(toastMessage, toastOptions);
      }
    }).then((unsubscribe) => {
      if (mounted) {
        unsubscribeRef.current = unsubscribe;
      }
    }).catch(() => {});

    return () => {
      mounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user, navigate]);

  // Register token on mount and when user changes
  useEffect(() => {
    if (user?._id) {
      registerToken();
    }

    // Re-register token on visibility change (app reopen)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?._id) {
        registerToken();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?._id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tokenRef.current) {
        notificationService.removeToken(tokenRef.current).catch(() => {});
      }
    };
  }, []);

  // Return state and handlers for the provider to use
  return {
    fullScreenNotification,
    setFullScreenNotification,
  };
};

