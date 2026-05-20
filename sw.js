// מגן הפוקוס — Service Worker v1
// רץ ברקע גם כשהטאב סגור, אחראי על התראות הטיימר

const CACHE_NAME = 'focus-defender-v1';

// ─── התקנה ─────────────────────────────────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

// ─── קבלת הודעות מהאפליקציה ────────────────────────────────────
self.addEventListener('message', e => {
  const { type, payload } = e.data || {};

  if (type === 'SCHEDULE_NOTIFICATION') {
    // payload: { delayMs, title, body }
    const { delayMs, title, body } = payload;

    // בטל תזמון קודם אם קיים
    if (self._notifTimeout) clearTimeout(self._notifTimeout);

    self._notifTimeout = setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: './icon-192.png',
        badge: './icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'focus-timer',         // מחליף התראה קודמת אם קיימת
        renotify: true,
        requireInteraction: false,
        actions: [
          { action: 'open', title: 'פתח אפליקציה' }
        ]
      });
    }, delayMs);
  }

  if (type === 'CANCEL_NOTIFICATION') {
    if (self._notifTimeout) {
      clearTimeout(self._notifTimeout);
      self._notifTimeout = null;
    }
  }
});

// ─── לחיצה על התראה ────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // אם הטאב פתוח — תן לו פוקוס
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      // אחרת — פתח חלון חדש
      return self.clients.openWindow('./');
    })
  );
});
