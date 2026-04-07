// Göker Lojistik CRM — Service Worker
// Strateji: Network-first (her zaman güncel versiyon göster, çevrimdışıysa cache'den sun)

var CACHE_NAME = 'goker-crm-v1';
var OFFLINE_URL = '/goker/';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.add(OFFLINE_URL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  // Eski cache'leri temizle
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Sadece GET isteklerini yakala
  if (event.request.method !== 'GET') return;
  // Supabase ve harici API isteklerini atla
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Başarılı yanıtı cache'le (index.html için)
        if (event.request.url.includes('/goker/') && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // Ağ yoksa cache'den sun
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});
