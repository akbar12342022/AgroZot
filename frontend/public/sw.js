// Chorvabozor Service Worker — Web Push bildirishnomalari (Firebase o'rniga).
// Bu fayl /sw.js manzilida ochiladi va push kelganda bildirishnoma ko'rsatadi.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Server yuborgan push — bildirishnoma ko'rsatiladi (mijoz saytda bo'lmasa ham)
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data && event.data.text() };
  }

  const title = data.title || 'Chorvabozor';
  const options = {
    body: data.body || '',
    icon: '/assets/logo-clean.png',
    badge: '/assets/logo-clean.png',
    tag: data.tag || undefined,
    renotify: !!data.tag,
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Bildirishnoma bosilganda — ochiq oynani fokuslash yoki yangi oyna ochish
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
