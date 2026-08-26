// public/sw.js
self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      const options = {
        body: payload.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',

        vibrate: [100, 50, 100],
        data: {
          url: payload.url || '/'
        }
      };
      event.waitUntil(
        self.registration.showNotification(payload.title, options)
      );
    } catch (e) {
      const options = {
        body: event.data.text(),
        icon: '/icon-192.png',
        vibrate: [100, 50, 100]
      };

      event.waitUntil(
        self.registration.showNotification('HECTH', options)
      );
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
