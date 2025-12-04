import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase config is available
const isFirebaseConfigured = firebaseConfig.projectId && firebaseConfig.apiKey;

// Initialize Firebase
let app;
let auth = null;
let messaging = null;
let messagingInitialized = false;

// Initialize messaging asynchronously
const initializeMessaging = async () => {
  if (messagingInitialized || !isFirebaseConfigured || typeof window === 'undefined') {
    return messaging;
  }

  try {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
      messagingInitialized = true;

      // Register service worker for background notifications
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
          .then((registration) => {
            })
          .catch((error) => {
            });
      }
      return messaging;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

try {
  if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    // Initialize Auth
    if (typeof window !== 'undefined') {
      auth = getAuth(app);
      }

    // Initialize messaging asynchronously
    if (typeof window !== 'undefined') {
      initializeMessaging().catch(() => {});
    }
  } else {
    }
} catch (error) {
  }

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async () => {
  if (!isFirebaseConfigured) {
    return null;
  }

  // Ensure messaging is initialized
  if (!messaging) {
    await initializeMessaging();
  }

  if (!messaging) {
    return null;
  }

  if (!('Notification' in window)) {
    return null;
  }

  if (Notification.permission === 'granted') {
    return await getFCMToken();
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return await getFCMToken();
    }
  }

  return null;
};

/**
 * Get FCM token
 */
export const getFCMToken = async () => {
  if (!isFirebaseConfigured) {
    return null;
  }

  // Ensure messaging is initialized
  if (!messaging) {
    await initializeMessaging();
  }

  if (!messaging) {
    return null;
  }

  try {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      return null;
    }
    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (error) {
    return null;
  }
};

/**
 * Set up foreground message handler
 */
export const onForegroundMessage = async (callback) => {
  if (!isFirebaseConfigured) {
    return () => {};
  }

  // Ensure messaging is initialized
  if (!messaging) {
    await initializeMessaging();
  }

  if (!messaging) {
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

/**
 * Check if notifications are supported
 */
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Get notification permission status
 */
export const getNotificationPermission = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

export { messaging, app, auth };
export default app;

