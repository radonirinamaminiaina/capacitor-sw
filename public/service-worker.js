const CACHE_NAME = "dynamic-cache-v1";

// Install event - no pre-caching in this example
self.addEventListener("install", (event) => {
  // Skip waiting so that the new service worker activates immediately
  self.skipWaiting();
});

// Fetch event - cache all URLs dynamically
self.addEventListener("fetch", (event) => {
  if (event.request.url.startsWith("chrome-extension://")) {
    return;
  }

  // Check if the request is for an external resource
  if (event.request.url.includes("cdn.jsdelivr.net")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Optional: handle network errors or provide a fallback
        return new Response("Network error occurred", {
          status: 408,
          statusText: "Network Error",
        });
      })
    );
    return;
  }

  // For other requests, handle caching as usual
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== "basic"
        ) {
          return networkResponse;
        }
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
