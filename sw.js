// Offline cache: keeps the game playable from the home screen after the first visit.
const CACHE = "organelle-rangers-3-v5";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // the intro movie streams straight from the network (video players need ranged requests, which a cache copy would break)
  if (/\.mp4$/.test(new URL(e.request.url).pathname)) return;
  if (e.request.mode === "navigate") { e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put("./index.html", cp)); return r; }).catch(() => caches.match("./index.html"))); return; }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
