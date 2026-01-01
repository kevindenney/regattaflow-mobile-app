/* Minimal bathymetry service worker placeholder
 * Prevents 404s in production deployments while keeping room
 * for future tile caching logic.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Currently a no-op; hook caching for bathymetry tiles here if needed.
});
