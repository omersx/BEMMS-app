// BEMMS Service Worker
// Handles: caching, push notifications, offline shell

const CACHE_NAME = 'bemms-v4';
const STATIC_ASSETS = [
  '/login',
  '/dashboard',
  '/sounds/notification.wav',
  '/sounds/urgent.wav',
  '/sounds/beep.wav',
];

// Install — pre-cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Non-critical if some assets fail to cache
        console.log('[SW] Some assets failed to cache, continuing...');
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — network-first for navigation/API, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, or localhost development
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;

  // API/data requests — network only
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')) return;

  // Static assets — cache first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/sounds/') ||
    url.pathname.endsWith('.wav') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation — network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match('/dashboard');
        });
      })
    );
    return;
  }
});

// Push — receive and show native notification
self.addEventListener('push', (event) => {
  let data = { title: 'BEMMS', body: 'You have a new notification', url: '/notifications' };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  // Determine urgency from data
  const isCritical = data.data?.priority === 'p1_critical' ||
                     data.data?.impact === 'patient_care_affected';
  const isNewTicket = data.data?.type === 'new_ticket';
  const isAccepted = data.data?.type === 'ticket_accepted';

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'bemms-notification',
    renotify: true,
    silent: false, // Ensure native device notification sound plays
    data: {
      url: data.url || '/notifications',
      ...data.data,
    },
    actions: data.actions || [],
    vibrate: data.vibrate || (isCritical ? [200, 100, 200, 100, 200] : [100, 50, 100]),
    requireInteraction: data.requireInteraction || isCritical || false,
    // On Android, set notification color based on urgency
    ...(isCritical && { badge: '/icons/icon-192.png' }),
  };

  // For new tickets, add View action if not already present
  if (isNewTicket && options.actions.length === 0) {
    options.actions = [
      { action: 'view', title: '📋 View Ticket' },
    ];
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );

  // Also notify all open app windows to refresh their notification count
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'PUSH_RECEIVED',
          notification: {
            title: data.title,
            body: data.body,
            url: data.url,
            data: data.data,
          },
        });
      });
    })
  );
});

// Notification click — open app to the right page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action; // 'view', 'accept', or empty (body click)
  let url = notificationData.url || '/notifications';

  // If they clicked the View action or the body, go to the ticket
  if (action === 'view' || !action) {
    url = notificationData.url || '/notifications';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Try to focus an existing window
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});
