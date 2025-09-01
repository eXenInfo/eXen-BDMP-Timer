const CACHE_NAME = 'exen-bdmp-timer-cache-v1'; // Wenn du große Änderungen machst, erhöhe die Version (v2, v3 etc.)
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manual.html',
    './disziplinen.txt',
    './manifest.json',
    './vendor/Tone.js',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache and caching files');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting()) // WICHTIG: Aktiviert den neuen Service Worker sofort
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache-First-Strategie
                return response || fetch(event.request);
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName); // Löscht alte Caches
                    }
                })
            );
        }).then(() => self.clients.claim()) // Übernimmt die Kontrolle über die Seite
    );
});