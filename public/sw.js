// Service worker: shows a notification when the server pushes a table call, even with the app closed.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "🔔 Una mesa te llama", body: event.data ? event.data.text() : "" }; }
  event.waitUntil(
    self.registration.showNotification(data.title || "🔔 Una mesa te llama", {
      body: data.body || "Un cliente necesita al mesero.",
      tag: data.tag || "call",          // same tag replaces instead of piling up
      renotify: true,                   // but still alerts again
      requireInteraction: true,         // stays on screen until the waiter taps it
      vibrate: [400, 150, 400, 150, 400],
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      data: { url: data.url || "/admin" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if (c.url.includes("/admin") && "focus" in c) return c.focus();
      return self.clients.openWindow(url);
    }),
  );
});
