'use strict';
const CACHE='compucenter-pwa-v7-cloud';
const SHELL=['./','./index.html','./styles.css','./app.js','./pwa.html','./pwa.css','./pwa.js','./manifest.json','./icons/icon.svg',];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>(key.startsWith('compucenter-pwa-')||key.startsWith('compucenter-data-'))&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);
 if(url.origin===self.location.origin&&url.searchParams.has('__cchealth')){event.respondWith(fetch(req));return;}
 if(req.mode==='navigate'){event.respondWith(fetch(req).then(res=>{if(res.ok)caches.open(CACHE).then(cache=>cache.put(req,res.clone()));return res;}).catch(async()=>await caches.match(req)||await caches.match('./pwa.html')));return;}
 if(url.origin!==self.location.origin&&req.destination!=='image')return;
 if(req.destination==='image'){event.respondWith((async()=>{const saved=await caches.match(req);if(saved)return saved;try{const response=await fetch(req);if(response.ok||response.type==='opaque')await(await caches.open(CACHE)).put(req,response.clone());return response;}catch(_){return new Response('',{status:504});}})());return;}
 event.respondWith(caches.match(req).then(saved=>saved||fetch(req).then(res=>{if(res.ok)caches.open(CACHE).then(cache=>cache.put(req,res.clone()));return res;})));
});