'use strict';
const CACHE='navaja27-pwa-v12-altoke-qr';
const SHELL=['./','./index.html','./styles.css','./app.js','./pwa.html','./pwa.css','./pwa.js','./manifest.json','./icons/icon.svg','./imagenes/imagen-respaldo.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>(key.startsWith('navaja27-pwa-')||key.startsWith('catalogo-navaja27')||key.startsWith('navaja27-data-'))&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);
 if(url.origin===self.location.origin&&url.searchParams.has('__n27health')){event.respondWith(fetch(req));return;}
 if(req.mode==='navigate'){event.respondWith(fetch(req).then(res=>{if(res.ok)caches.open(CACHE).then(cache=>cache.put(req,res.clone()));return res;}).catch(async()=>await caches.match(req)||await caches.match('./pwa.html')||await caches.match('./index.html')));return;}
 if(url.origin!==self.location.origin&&req.destination!=='image')return;
 if(req.destination==='image'){event.respondWith((async()=>{const cached=await caches.match(req);if(cached)return cached;try{const res=await fetch(req);if(res.ok||res.type==='opaque')await(await caches.open(CACHE)).put(req,res.clone());return res;}catch(_){return new Response('',{status:504});}})());return;}
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res.ok)caches.open(CACHE).then(cache=>cache.put(req,res.clone()));return res;})));
});