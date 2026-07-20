/* App shell cached so the app opens offline.
   Sheet data is never cached — it must always be fetched fresh. */
const CACHE = "hsbc-stocks-v2";
const SHELL = [
  "./", "./index.html", "./styles.css", "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).hostname.includes("docs.google.com")) return;
  e.respondWith(
    caches.match(e.request).then(hit =>
      hit || fetch(e.request).catch(() => caches.match("./index.html"))
    )
  );
});
