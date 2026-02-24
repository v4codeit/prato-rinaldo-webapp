// Service Worker per Prato Rinaldo PWA
// Auto-generated at build time - DO NOT EDIT DIRECTLY
// Edit scripts/sw-template.js instead, then run: node scripts/generate-sw.mjs
//
// Version: mm0ndl58-47eda81
// Built: 2026-02-24T13:34:46.603Z

const SW_VERSION = 'mm0ndl58-47eda81';
const CACHE_NAME = 'prato-rinaldo-mm0ndl58-47eda81';
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
  console.log('[SW] Install - Version:', SW_VERSION);

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

  // Activate immediately - don't wait for old SW to release
  self.skipWaiting();
});

// =====================================================
// ACTIVATE EVENT
// =====================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate - Version:', SW_VERSION);

  event.waitUntil(
    (async () => {
      // Step 1: Delete ALL caches that don't match current version
      const cacheNames = await caches.keys();
      const deletions = cacheNames
        .filter((name) => name !== CACHE_NAME)
        .map((name) => {
          console.log('[SW] Deleting old cache:', name);
          return caches.delete(name);
        });
      await Promise.all(deletions);

      // Step 2: Take control of all clients immediately
      await self.clients.claim();

      // Step 3: Notify all clients about the update
      const allClients = await self.clients.matchAll({ type: 'window' });
      allClients.forEach((client) => {
        client.postMessage({
          type: 'SW_UPDATED',
          version: SW_VERSION,
        });
      });

      console.log('[SW] Activation complete, old caches cleared, clients notified');
    })()
  );
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

  // Skip version.json (always fresh from network)
  if (event.request.url.includes('/version.json')) return;

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
// NOTIFICATION CLICK EVENT - PWA Priority (2025 Best Practices)
// =====================================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.notification.tag);

  // iOS workaround - prevent default behavior first
  if (event.preventDefault) {
    event.preventDefault();
  }
  event.notification.close();

  // Handle action buttons
  if (event.action) {
    console.log('[SW] Action clicked:', event.action);
  }

  // Extract URL from notification data (could be full URL or relative path)
  const rawUrl = event.notification.data?.url || '/bacheca';

  // CRITICAL FIX: navigate() requires RELATIVE PATH, not absolute URL
  let targetPath;
  try {
    const url = new URL(rawUrl, self.location.origin);
    if (url.origin === self.location.origin) {
      targetPath = url.pathname + url.search + url.hash;
    } else {
      targetPath = rawUrl;
    }
  } catch (e) {
    targetPath = rawUrl;
  }

  console.log('[SW] Target path (normalized):', targetPath);

  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      console.log(`[SW] Found ${windowClients.length} window client(s)`);

      // STRATEGY 1: Find existing window on EXACT URL - just focus it
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          console.log('[SW] Found exact URL match, focusing');
          return client.focus();
        }
      }

      // STRATEGY 2: Find ANY window on same origin (PWA or browser tab)
      let bestClient = null;
      for (const client of windowClients) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === self.location.origin) {
            if (!bestClient || client.visibilityState === 'visible') {
              bestClient = client;
            }
          }
        } catch (e) {
          console.warn('[SW] Error parsing client URL:', e);
        }
      }

      if (bestClient) {
        console.log('[SW] Found same-origin window, focusing and navigating');

        if ('navigate' in bestClient) {
          return bestClient.navigate(targetPath).catch((err) => {
            console.error('[SW] Navigate failed:', err);
            bestClient.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: targetPath
            });
            return bestClient.focus();
          });
        } else if ('focus' in bestClient) {
          bestClient.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: targetPath
          });
          return bestClient.focus();
        }
      }

      // STRATEGY 3: No existing window - must open new one
      console.log('[SW] No existing window, opening new');
      if (clients.openWindow) {
        return clients.openWindow(targetPath);
      }

      return Promise.resolve();
    }).catch((err) => {
      console.error('[SW] Notification click error:', err);
    })
  );
});

// =====================================================
// NOTIFICATION CLOSE EVENT (Analytics)
// =====================================================
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed:', event.notification.tag);
});

// =====================================================
// MESSAGE EVENT - Communication from client
// =====================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: SW_VERSION, cacheName: CACHE_NAME });
  }
});

// =====================================================
// PUSH SUBSCRIPTION CHANGE EVENT
// =====================================================
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed');

  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then((subscription) => {
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

console.log('[SW] Service Worker loaded - Version:', SW_VERSION);
