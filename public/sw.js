// Service Worker for SiTQA Web Push Notifications

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker...');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker...');
  return self.clients.claim();
});

// 1. Listen for real Push Notifications from a server
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  
  let title = 'SiTQA';
  let options = {
    body: 'Ada pembaruan aktivitas setoran hafalan.',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      options = {
        ...options,
        body: payload.body || options.body,
        icon: payload.icon || options.icon,
        badge: payload.badge || options.badge,
        data: payload.data || options.data
      };
    } catch (e) {
      options.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 2. Listen for Messages from the React app (useful for mock/delayed notifications testing)
self.addEventListener('message', function(event) {
  console.log('[Service Worker] Message received in SW:', event.data);
  
  if (event.data && event.data.action === 'showNotification') {
    const title = event.data.title || 'SiTQA Uji Coba';
    const options = {
      body: event.data.body || 'Notifikasi uji coba berhasil ditampilkan!',
      icon: event.data.icon || '/logo.png',
      badge: event.data.badge || '/logo.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 'mock-test'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// 3. Handle click on Notification (navigate or focus tab)
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received.');

  event.notification.close();

  // Look for existing tab of the app and focus it, or open a new one
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Find active client tab that matches the domain
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no tab is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
