// Greek Flashcards moved to https://greek-flashcards.github.io/ in November 2026.
// This file replaces the old offline helper: phones that check for an update get this version,
// which deletes the old offline copy, removes itself and reloads the page (which then forwards to the new address).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  for(const k of await caches.keys()) if(k.startsWith("gf-")) await caches.delete(k);
  await self.registration.unregister();
  for(const c of await self.clients.matchAll({type: "window"})) c.navigate(c.url);
})()));
