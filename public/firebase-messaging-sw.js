// Service Worker for Firebase Cloud Messaging
// This file must be in the public directory

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in service worker
const firebaseConfig = {
  apiKey: "AIzaSyDivrY3jA10HgNnfuHKXz38vIE9wcdTh5E",
  authDomain: "dating-app-ae584.firebaseapp.com",
  projectId: "dating-app-ae584",
  storageBucket: "dating-app-ae584.firebasestorage.app",
  messagingSenderId: "673691363622",
  appId: "1:673691363622:web:73be650c2718416b8439e7",
  measurementId: "G-GCLW21KTX0"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationBody = payload.notification?.body || '';
  const notificationImage = payload.notification?.image || payload.data?.imageUrl;
  const notificationType = payload.data?.type || 'notification';
  const isBroadcast = notificationType === 'broadcast';
  const broadcastId = payload.data?.broadcastId;
  
  // Send delivered receipt for broadcast notifications
  if (isBroadcast && broadcastId) {
    // Store receipt to send when client is available
    const receiptData = {
      notificationId: broadcastId,
      status: 'delivered',
      timestamp: new Date().toISOString(),
    };
    
    // Try to send receipt via client message
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'NOTIFICATION_DELIVERED',
          data: receiptData,
        });
      });
    }).catch(err => {
      console.error('Error sending delivered receipt:', err);
    });
  }
  
  // Enhanced notification options with beautiful styling
  const notificationOptions = {
    body: notificationBody,
    icon: notificationImage || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    image: notificationImage, // Large image for rich notifications
    tag: notificationType === 'broadcast' ? `broadcast-${broadcastId || Date.now()}` : 'notification',
    requireInteraction: isBroadcast, // Broadcast notifications require interaction
    vibrate: isBroadcast ? [200, 100, 200, 100, 200] : [200, 100, 200], // Longer vibration for broadcasts
    timestamp: Date.now(),
    silent: false,
    renotify: true,
    data: {
      url: payload.data?.deepLink || payload.data?.url || '/',
      type: notificationType,
      broadcastId: broadcastId,
      ...payload.data,
    },
    actions: [
      {
        action: 'open',
        title: 'View',
        icon: '/icon-192x192.png',
      },
      {
        action: 'close',
        title: 'Dismiss',
      },
    ],
    // Additional styling for better appearance
    dir: 'ltr',
    lang: 'en',
  };

  // Add custom styling for broadcast notifications
  if (isBroadcast) {
    notificationOptions.body = `📢 ${notificationBody}`;
  }

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = data.url || data.deepLink || '/';
  const action = event.action;

  // Handle action buttons
  if (action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // Focus any open window
        if ('focus' in client) {
          // Send message to client to navigate
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: urlToOpen,
            data: data,
          });
          return client.focus();
        }
      }
      // Open new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

