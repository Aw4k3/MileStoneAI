// src/sw.js
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Always try network first for HTML navigations so users receive the latest Vercel deploy
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'milestone-pages',
    networkTimeoutSeconds: 4,
  })
);

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle incoming Web Push notifications
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Milestone AI',
    body: 'You reached a new milestone on your learning blueprint.',
    url: '/dashboard',
    tag: 'milestone-notification',
    icon: '/icons/pwa-192x192.png',
    badge: '/icons/badge-72x72.png',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        ...payload,
        ...parsed,
        url: parsed.url || parsed.targetUrl || '/dashboard',
        tag: parsed.tag || parsed.eventKey || 'milestone-notification',
      };
    } catch {
      const textBody = event.data.text();
      if (textBody) payload.body = textBody;
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag,
    renotify: false,
    data: {
      url: payload.url,
      eventKey: payload.eventKey || payload.tag,
    },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Focus existing app window or open target route on notification tap
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      const absoluteTarget = new URL(targetUrl, self.location.origin).href;

      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          await client.focus();
          client.postMessage({ type: 'MILESTONE_NAVIGATE', url: targetUrl });
          return client;
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteTarget);
      }
      return undefined;
    })
  );
});

// Notify active clients if push subscription rotates
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        client.postMessage({ type: 'MILESTONE_PUSH_SUBSCRIPTION_CHANGED' });
      }
    })
  );
});
