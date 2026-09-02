// YMA ENERGY PWA Service Worker
const CACHE_NAME = 'yma-energy-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable.png',
  '/screenshot-mobile.png',
  '/screenshot-desktop.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Network first strategy with offline fallback
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

// SYSTEM PUSH NOTIFICATION EVENT (Background push from Server/FCM)
self.addEventListener('push', (event) => {
  let data = {
    title: '☀️ YMA ENERGY GROUP',
    body: 'Una taarifa mpya kutoka YMA Energy!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/',
    tag: 'yma-notification',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: data.tag || `yma-${Date.now()}`,
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Fungua App' },
      { action: 'close', title: 'Funga' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// NOTIFICATION CLICK EVENT (When user taps the notification in phone top bar)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it
      for (const client of windowClients) {
        if ('focus' in client) {
          return client.focus().then((focused) => {
            if (focused && 'navigate' in focused && targetUrl && targetUrl !== '/') {
              return focused.navigate(targetUrl);
            }
          });
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
