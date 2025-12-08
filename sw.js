const CACHE = 'wc-v1';
const FILES = ['/', '/index.html', '/styles.css', '/app.js', '/editor.html',
'/editor.css', '/editor.js', '/manifest.json'];
self.addEventListener('install', evt=>{
evt.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));
self.skipWaiting();
});
self.addEventListener('activate',
evt=>{evt.waitUntil(self.clients.claim())});
self.addEventListener('fetch', evt=>{
evt.respondWith(caches.match(evt.request).then(r=>r ||
fetch(evt.request)));
});