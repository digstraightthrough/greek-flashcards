// Offline helper for the phone app: keeps a copy of the site so the cards work without internet.
// Change VERSION every time the site is updated, so phones download the new files.
const VERSION = "gf-2026-11-02";
const CORE = ["./", "index.html", "data.js", "exam.js", "language.js", "manifest.webmanifest",
  "vendor/goatcounter/count.js", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(CORE.map(u => new Request(u, {cache: "reload"}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("gf-") && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  const scope = new URL(self.registration.scope);
  const mine = url.origin === scope.origin && url.pathname.startsWith(scope.pathname);
  const fonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  // the listening recordings are big and play in pieces: always straight from the internet
  if((!mine && !fonts) || url.pathname.includes("/audio/")) return;

  if(req.mode === "navigate"){
    // the page itself: newest version when online, the saved copy when offline
    e.respondWith(fetch(req)
      .then(r => { if(r.ok){ const copy = r.clone(); caches.open(VERSION).then(c => c.put("index.html", copy)); } return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  // everything else: the saved copy straight away (fast, works offline), refreshed in the background
  e.respondWith(caches.open(VERSION).then(c => c.match(req, {ignoreSearch: true}).then(hit => {
    const fresh = fetch(req)
      .then(r => { if(r.ok || r.type === "opaque") c.put(req, r.clone()); return r; })
      .catch(() => hit || Response.error());
    return hit || fresh;
  })));
});
