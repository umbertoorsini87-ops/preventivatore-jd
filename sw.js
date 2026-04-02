/* JD Preventivatore — Service Worker v1 */
const CACHE = 'jd-prev-v1';
const APP_ASSETS = [
  './JD_Preventivatore.html',
  './manifest.json',
  './icon.svg',
];
const CDN_JSPDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

/* ── INSTALL: precache app shell ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

/* ── ACTIVATE: remove old caches ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── FETCH strategy ── */
self.addEventListener('fetch', e => {
  const url = e.request.url;

  /* CDN jsPDF: network-first, cache fallback */
  if(url.includes('cdnjs.cloudflare.com')) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          if(r.ok){ const rc = r.clone(); caches.open(CACHE).then(c => c.put(e.request, rc)); }
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  /* App assets: cache-first, network fallback */
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(r => {
        if(r.ok){
          const rc = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, rc));
        }
        return r;
      });
    })
  );
});
