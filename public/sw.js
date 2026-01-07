// Service Worker para PWA
const CACHE_NAME = 'venai-v4'
const urlsToCache = [
  '/',
  '/foods',
  '/recipes',
  '/profile',
  '/manifest.json',
  '/logo.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  return self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Estrategia: Network First, luego Cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, clonarla y guardarla en cache
        if (response && response.status === 200) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // Si falla la red, intentar desde cache
        return caches.match(event.request)
      })
  )
})

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const title = data.title || 'VenAi'
  const options = {
    body: data.message || 'Tienes una nueva notificación',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    tag: data.tag || 'notification',
    requireInteraction: false,
    data: data.url || '/'
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  )
})

// Manejar mensajes del cliente para mostrar notificaciones programadas
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data
    
    event.waitUntil(
      self.registration.showNotification(title, {
        ...options,
        icon: options.icon || '/icon-192.png',
        badge: options.badge || '/icon-96.png',
        tag: options.tag || 'venai',
        requireInteraction: false,
        data: options.data || '/'
      })
    )
  }
})

