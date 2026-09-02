/* CORE Scale — service worker: deja la app disponible SIN internet.
   Estrategia: responde desde caché y actualiza en segundo plano
   (stale-while-revalidate). Al publicar cambios, suba la VERSION.            */

/* Al publicar cambios: subir VERSION aquí y el ?v= de index.html a la par. */
const VERSION = 'corescale-v0.2.2';
const V = '?v=0.2.2';
const ARCHIVOS = [
  '.', 'index.html', 'css/style.css' + V,
  'js/db.js' + V, 'js/plantillas.js' + V, 'js/escalas.js' + V, 'js/graficas.js' + V,
  'js/eval.js' + V, 'js/escala-ui.js' + V, 'js/evolucion.js' + V, 'js/app.js' + V,
  'fonts/archivo-latin.woff2',
  'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png',
  'icons/icon-512.png', 'icons/icon-32.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.open(VERSION).then(async (c) => {
      const enCache = await c.match(e.request);
      const red = fetch(e.request).then(resp => {
        if (resp && resp.ok) c.put(e.request, resp.clone());
        return resp;
      }).catch(() => enCache);
      /* sin waitUntil, el navegador puede matar la actualización en segundo
         plano y la caché se queda vieja para siempre */
      e.waitUntil(red.catch(() => {}));
      return enCache || red;
    })
  );
});
