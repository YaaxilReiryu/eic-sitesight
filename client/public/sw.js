const CACHE_NAME = 'eic-sitesight-v2';
const STATIC_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  // Force the new service worker to activate immediately
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
})

self.addEventListener('activate', (event) => {
  // Take control of all pages immediately
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
    ])
  )
})

self.addEventListener('fetch', (event) => {
  // Never cache API calls
  if (event.request.url.includes('/api/')) return

  // Network first for HTML files — always get fresh page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html')
      )
    )
    return
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})