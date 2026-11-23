'use strict';
const CACHE='tada-pwa-v25-clean-prices';
const SDK_URL='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2';
const SHELL=['./','./index.html','./styles.css','./app.js','./pwa.html','./pwa.css','./pwa.js','./manifest.json','../catalog-db.js','./icons/icon.svg','../theme-toggle.js?v=light-dark-v1','./brand-logo.svg','./styles.css?v=tada-brand-logo-v4','./pwa.css?v=tada-mobile-grid-v19','./pwa.js?v=tada-clean-catalog-v18'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await cache.addAll(SHELL);
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),7000);
 try{
  const response=await fetch(new Request(SDK_URL,{mode:'cors',cache:'reload',signal:controller.signal}));
  if(response.ok)await cache.put(SDK_URL,response.clone());
 }catch(error){console.warn('SDK Supabase no precargado; se intentará descargar al abrir la PWA.',error);}
 finally{clearTimeout(timeout);}
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>(key.startsWith('tada-pwa-')||key.startsWith('catalogo-tada-')||key.startsWith('tada-data-'))&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);
 if(url.href===SDK_URL){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE),cached=await cache.match(SDK_URL);
   if(cached)return cached;
   try{const response=await fetch(req);if(response.ok)await cache.put(SDK_URL,response.clone());return response;}
   catch(_){return new Response('La biblioteca de conexión no está disponible sin Internet.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});}
  })());
  return;
 }
 if(url.origin===self.location.origin&&url.searchParams.has('__tadahealth')){event.respondWith(fetch(req));return;}
 if(req.mode==='navigate'){event.respondWith(fetch(req).then(res=>{if(res.ok)caches.open(CACHE).then(cache=>cache.put(req,res.clone()));return res;}).catch(async()=>await caches.match(req)||await caches.match('./pwa.html')));return;}
 if(url.origin!==self.location.origin&&req.destination!=='image')return;
 if(req.destination==='image'){event.respondWith((async()=>{const saved=await caches.match(req);if(saved)return saved;try{const response=await fetch(req);if(response.ok||response.type==='opaque')await(await caches.open(CACHE)).put(req,response.clone());return response;}catch(_){return new Response('',{status:504});}})());return;}
 event.respondWith(caches.match(req).then(saved=>saved||fetch(req).then(res=>{if(res.ok)caches.open(CACHE).then(cache=>cache.put(req,res.clone()));return res;})));
});