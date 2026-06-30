/* Glossarium service worker — offline app shell.
   Push notifications ("Do your BUCKING vocab!") are stubbed below; they
   activate once a Cloudflare Worker sends Web Push to saved subscriptions. */
const CACHE = "glossarium-v25";
const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./buck-192.png", "./buck-512.png", "./buck-maskable-512.png", "./buck-180.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.allSettled(ASSETS.map((u) => c.add(u)));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.status === 200 && new URL(req.url).origin === location.origin) {
        const c = await caches.open(CACHE); c.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      if (req.mode === "navigate") return caches.match("./index.html");
      throw err;
    }
  })());
});

/* ---- Web Push (wired up later with the Worker) ----
self.addEventListener("push", (e) => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(data.title || "Glossarium", {
    body: data.body || "Do your BUCKING vocab!",
    icon: "buck-192.png", badge: "buck-192.png", tag: "daily"
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow("./index.html"));
});
*/
