// Minimal no-op service worker stub to avoid 404 requests from browsers
// This file intentionally does not add caching logic. It simply registers
// basic lifecycle hooks so dev servers and browsers won't return 404s.
self.addEventListener("install", (event) => {
  // Activate immediately without waiting
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Claim clients so the service worker takes effect immediately
  event.waitUntil(
    self.clients?.claim ? self.clients.claim() : Promise.resolve()
  );
});

// Optional fetch handler: pass-through
self.addEventListener("fetch", (event) => {
  // No special handling — allow network requests to proceed.
});

/*
 * This stub is intentionally minimal. If you plan to implement a PWA
 * offline cache strategy, replace this file with a proper service worker
 * implementation.
 */
