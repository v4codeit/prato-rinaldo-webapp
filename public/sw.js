// Service Worker per Prato Rinaldo PWA
// Versione: 1.0.0

const CACHE_NAME = 'prato-rinaldo-v1';
const OFFLINE_URL = '/offline';

// Assets da pre-cachare (minimal per performance)
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// =====================================================
// INSTALL EVENT
// =====================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Install');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching assets');
      return cache.addAll(PRECACHE_ASSETS).catch((error) => {
        console.warn('[SW] Pre-cache failed for some assets:', error);
        // Continue even if some assets fail to cache
        return Promise.resolve();
      });
    })
  );

  // Activate immediately
  self.skipWaiting();
});

// =====================================================
// ACTIVATE EVENT
// =====================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );

  // Take control of all clients immediately
  self.clients.claim();
});

// =====================================================
// FETCH EVENT - Network first, fallback to cache
// =====================================================
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension, devtools, and other non-http protocols
  if (!event.request.url.startsWith('http')) return;

  // Skip Supabase API calls (always network)
  if (event.request.url.includes('supabase.co')) return;

  // Skip API routes
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses for static assets
        if (response.status === 200 && event.request.destination !== 'document') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // Only cache static assets (images, scripts, styles)
            const url = new URL(event.request.url);
            if (
              url.pathname.startsWith('/icons/') ||
              url.pathname.startsWith('/_next/static/') ||
              url.pathname.endsWith('.png') ||
              url.pathname.endsWith('.svg') ||
              url.pathname.endsWith('.ico')
            ) {
              cache.put(event.request, responseClone);
            }
          });
        }
        return response;
      })
      .catch(async () => {
        // Fallback to cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If navigation request, show offline page
        if (event.request.mode === 'navigate') {
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) {
            return offlinePage;
          }
        }

        // Default offline response
        return new Response('Offline - Nessuna connessione disponibile', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});

// =====================================================
// PUSH EVENT - Receive push notification
// =====================================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  if (!event.data) {
    console.log('[SW] Push event but no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    // If not JSON, treat as plain text
    data = {
      title: 'Prato Rinaldo',
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    image: data.image || undefined,
    tag: data.tag || 'default',
    renotify: data.renotify || false,
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    data: {
      url: data.url || '/bacheca',
      timestamp: Date.now(),
      ...data.data,
    },
    vibrate: [100, 50, 100],
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Prato Rinaldo', options)
  );
});

// =====================================================
// NOTIFICATION CLICK EVENT
// =====================================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.notification.tag);

  event.notification.close();

  // Handle action buttons
  if (event.action) {
    console.log('[SW] Action clicked:', event.action);
    // Handle specific actions if needed
  }

  const urlToOpen = event.notification.data?.url || '/bacheca';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if a window is already open on the target URL
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }

      // Check if any window is open on the same origin
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'navigate' in client) {
          return client.focus().then(() => client.navigate(urlToOpen));
        }
      }

      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// =====================================================
// NOTIFICATION CLOSE EVENT (Analytics)
// =====================================================
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed:', event.notification.tag);

  // Could send analytics here if needed
  // Example: track dismissed notifications
});

// =====================================================
// MESSAGE EVENT - Communication from client
// =====================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// =====================================================
// PUSH SUBSCRIPTION CHANGE EVENT
// =====================================================
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed');

  // Re-subscribe with new subscription
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then((subscription) => {
        // Send new subscription to server
        return fetch('/api/push/resubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldEndpoint: event.oldSubscription.endpoint,
            newSubscription: subscription.toJSON(),
          }),
        });
      })
      .catch((error) => {
        console.error('[SW] Failed to resubscribe:', error);
      })
  );
});

console.log('[SW] Service Worker loaded');
