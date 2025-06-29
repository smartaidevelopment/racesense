// RaceSense Service Worker for PWA functionality
// Production-ready caching and offline support

const CACHE_NAME = "racesense-v1.2.0";
const RUNTIME_CACHE = "racesense-runtime";

// Critical resources to cache immediately
const STATIC_CACHE_URLS = [
  "/",
  "/manifest.json",
  "/index.html",
  "/static/js/bundle.js",
  "/static/css/main.css",
  // Add your critical static assets here
];

// Runtime caching patterns
const CACHE_STRATEGIES = {
  // HTML pages - Network first, fallback to cache
  pages: {
    matcher: /\.html$/,
    strategy: "networkFirst",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },

  // API calls - Network first with short cache
  api: {
    matcher: /\/api\//,
    strategy: "networkFirst",
    maxAge: 5 * 60 * 1000, // 5 minutes
  },

  // Static assets - Cache first
  static: {
    matcher: /\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/,
    strategy: "cacheFirst",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },

  // Fonts - Cache first with long expiry
  fonts: {
    matcher: /fonts\.(googleapis|gstatic)\.com/,
    strategy: "cacheFirst",
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
  },
};

// Install event - cache critical resources
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching critical resources");
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[SW] Installation failed:", error);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      }),

      // Take control of all pages immediately
      self.clients.claim(),
    ]),
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Find matching cache strategy
  const strategy = findCacheStrategy(request);

  if (strategy) {
    event.respondWith(handleRequest(request, strategy));
  }
});

// Find appropriate cache strategy for request
function findCacheStrategy(request) {
  const url = new URL(request.url);

  for (const [name, config] of Object.entries(CACHE_STRATEGIES)) {
    if (
      config.matcher.test(url.pathname) ||
      config.matcher.test(url.hostname)
    ) {
      return { ...config, name };
    }
  }

  // Default strategy for unmatched requests
  return {
    name: "default",
    strategy: "networkFirst",
    maxAge: 60 * 60 * 1000, // 1 hour
  };
}

// Handle request based on caching strategy
async function handleRequest(request, strategy) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  switch (strategy.strategy) {
    case "cacheFirst":
      return cacheFirst(request, cache, cachedResponse, strategy);

    case "networkFirst":
      return networkFirst(request, cache, cachedResponse, strategy);

    case "staleWhileRevalidate":
      return staleWhileRevalidate(request, cache, cachedResponse, strategy);

    default:
      return networkFirst(request, cache, cachedResponse, strategy);
  }
}

// Cache first strategy
async function cacheFirst(request, cache, cachedResponse, strategy) {
  if (cachedResponse && !isExpired(cachedResponse, strategy.maxAge)) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Clone and cache the response
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    console.warn("[SW] Network failed, serving stale cache:", error);
    return cachedResponse || createErrorResponse();
  }
}

// Network first strategy
async function networkFirst(request, cache, cachedResponse, strategy) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Clone and cache the response
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    console.warn("[SW] Network failed, trying cache:", error);

    if (cachedResponse && !isExpired(cachedResponse, strategy.maxAge)) {
      return cachedResponse;
    }

    return createErrorResponse();
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cache, cachedResponse, strategy) {
  // Serve from cache immediately if available
  const cacheResponse =
    cachedResponse && !isExpired(cachedResponse, strategy.maxAge)
      ? cachedResponse
      : null;

  // Update cache in background
  const networkUpdate = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      console.warn("[SW] Background update failed:", error);
    });

  return cacheResponse || networkUpdate;
}

// Check if cached response is expired
function isExpired(response, maxAge) {
  if (!maxAge) return false;

  const dateHeader = response.headers.get("date");
  if (!dateHeader) return false;

  const responseTime = new Date(dateHeader).getTime();
  return Date.now() - responseTime > maxAge;
}

// Create error response for failed requests
function createErrorResponse() {
  return new Response(
    JSON.stringify({
      error: "Network unavailable",
      message: "Please check your internet connection",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 503,
      statusText: "Service Unavailable",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

// Background sync for data upload when online
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag);

  if (event.tag === "telemetry-upload") {
    event.waitUntil(uploadPendingTelemetry());
  }
});

// Upload pending telemetry data
async function uploadPendingTelemetry() {
  try {
    // Get pending data from IndexedDB
    const pendingData = await getPendingTelemetryData();

    for (const data of pendingData) {
      try {
        const response = await fetch("/api/telemetry", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          await removePendingTelemetryData(data.id);
          console.log("[SW] Uploaded telemetry data:", data.id);
        }
      } catch (error) {
        console.warn("[SW] Failed to upload telemetry:", error);
      }
    }
  } catch (error) {
    console.error("[SW] Background sync failed:", error);
  }
}

// Push notifications for racing updates
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.message,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      data: data.url,
      actions: [
        {
          action: "view",
          title: "View Details",
        },
        {
          action: "dismiss",
          title: "Dismiss",
        },
      ],
      vibrate: [200, 100, 200],
      requireInteraction: true,
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (error) {
    console.error("[SW] Push notification error:", error);
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "view" && event.notification.data) {
    event.waitUntil(clients.openWindow(event.notification.data));
  }
});

// Utility functions for IndexedDB operations
async function getPendingTelemetryData() {
  // Implement IndexedDB read operation
  return [];
}

async function removePendingTelemetryData(id) {
  // Implement IndexedDB delete operation
}

// Log service worker status
console.log("[SW] RaceSense Service Worker loaded");
