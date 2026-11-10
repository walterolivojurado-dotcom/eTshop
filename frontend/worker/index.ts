/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('push', (event: PushEvent) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const options: any = {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: {
          url: data.url
        },
        vibrate: [100, 50, 100],
      };

      event.waitUntil(sw.registration.showNotification(data.title, options));
    } catch (e) {
      console.error('[SW] Error parsing push data', e);
    }
  }
});

sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const urlToOpen = new URL(event.notification.data?.url || '/', sw.location.origin).href;

  const promiseChain = sw.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((windowClients: ReadonlyArray<WindowClient>) => {
      let matchingClient: WindowClient | null = null;

      for (let i = 0; i < windowClients.length; i++) {
        const wc = windowClients[i];
        if (wc.url === urlToOpen) {
          matchingClient = wc;
          break;
        }
      }

      if (matchingClient) {
        return matchingClient.focus();
      } else {
        return sw.clients.openWindow(urlToOpen);
      }
    });

  event.waitUntil(promiseChain);
});
