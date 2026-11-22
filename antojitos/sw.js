'use strict';
const CACHE = "catalogo-antojitos-v2";
const APP_SHELL = ["./","./index.html","./styles.css","./app.js","./pwa.html","./pwa.css","./pwa.js","./manifest.json","./icons/icon.svg","./media/hero.webp","./media/paceña.webp","./media/mani.webp","./media/maracuya.webp","./media/barbacoa.webp","./media/piña.webp","./media/doble.webp","./media/salchipapas.webp"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("catalogo-antojitos") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin && request.destination !== "image") return;
  event.respondWith((async () => {
    const saved = await caches.match(request);
    if (saved) return saved;
    try {
      const response = await fetch(request);
      if (response.ok || response.type === "opaque") {
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (_) {
      return (await caches.match("./pwa.html")) || new Response("Recurso no disponible sin conexión.", {status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
    }
  })());
});