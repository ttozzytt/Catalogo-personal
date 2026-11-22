'use strict';
const CACHE='navaja27-pwa-v4';
const SHELL=['./','./index.html','./styles.css','./app.js','./pwa.html','./pwa.css','./pwa.js','./manifest.json','./icons/icon.svg','./data/servicios.json','./imagenes/imagen-respaldo.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('navaja27-pwa-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);
 if(url.origin===self.location.origin&&url.searchParams.has('__health')){event.respondWith(fetch(request));return;}
 if(request.mode==='navigate'){event.respondWith(fetch(request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));return response;}).catch(async()=>await caches.match(request)||await caches.match('./pwa.html')));return;}
 if(url.origin!==self.location.origin&&request.destination!=='image')return;
 if(request.destination==='image'){event.respondWith((async()=>{const cached=await caches.match(request);if(cached)return cached;try{const response=await fetch(request);if(response.ok||response.type==='opaque')await(await caches.open(CACHE)).put(request,response.clone());return response;}catch(_){return new Response('',{status:504});}})());return;}
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));return response;})));
});