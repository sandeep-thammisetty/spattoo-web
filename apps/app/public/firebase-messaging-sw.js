/* eslint-disable no-undef */
// ── Firebase Cloud Messaging service worker ──────────────────────────────────────────────────────
// Shows the notification when the app is BACKGROUNDED or closed — which is the case that matters, a
// baker's phone on the counter with the screen off. With the app in the foreground FCM does not come
// here at all: it fires onMessage in the page instead, and the page decides (see lib/push.ts).
//
// ── WHY THE CONFIG ARRIVES IN THE URL ───────────────────────────────────────────────────────────
// A service worker is a STATIC file — it is not part of the Next build, so `process.env` does not
// exist here and NEXT_PUBLIC_* is never substituted. Hardcoding the config would mean this file
// naming the dev Firebase project forever, and prod silently registering against dev.
//
// So the page passes it when registering:
//     navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params}`)
// and we read it back off our own URL. One static file, every environment, no build step.
//
// The values are public by design — they identify the project, they authorise nothing. The secret is
// the service-account key, which lives on the API and never reaches a browser.
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js');

const params = new URL(self.location).searchParams;
const config = {
  apiKey:            params.get('apiKey'),
  authDomain:        params.get('authDomain'),
  projectId:         params.get('projectId'),
  messagingSenderId: params.get('messagingSenderId'),
  appId:             params.get('appId'),
};

if (config.projectId) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  // Handled explicitly rather than left to the SDK's default, because the default renders whatever
  // the payload's `notification` block says and we want one place that decides what a Spattoo
  // notification looks like — and, more importantly, where tapping it goes.
  messaging.onBackgroundMessage((payload) => {
    const d = payload.data ?? {};
    self.registration.showNotification(d.title || 'Spattoo', {
      body:  d.body || '',
      icon:  '/icon-192.png',
      badge: '/icon-192.png',
      // Same tag replaces rather than stacks. A baker who gets two "deliveries today" nudges wants
      // the later one, not a pile.
      tag:   d.tag || undefined,
      data:  { url: d.url || '/' },
    });
  });
}

// Tapping a notification must land on the thing it is about, and must REUSE an open tab rather than
// opening a third copy of the app — a baker with the dashboard already open should be taken to it.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      const open = wins.find((w) => w.url.includes(new URL(url, self.location.origin).pathname));
      if (open) return open.focus();
      return clients.openWindow(url);
    }),
  );
});
