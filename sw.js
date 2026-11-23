// Offline cache: the game page and the three.js modules are stored after the first visit,
// so later visits / refreshes start instantly without downloading them again.
const CACHE='abandoned-grounds-v3';
const CDN='https://cdn.jsdelivr.net/npm/three@0.160.0/';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html'])).catch(()=>{}));});
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim();})()));
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=req.url;
  if(url.startsWith(CDN)){            // versioned library files never change: cache first
    e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(req);if(hit)return hit;const res=await fetch(req);if(res.ok)c.put(req,res.clone());return res;}));
    return;
  }
  if(new URL(url).origin===self.location.origin){   // game files: serve the cached copy instantly, refresh it in the background
    e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(req,{ignoreSearch:true});
      const net=fetch(req).then(res=>{if(res.ok)c.put(req,res.clone());return res;}).catch(()=>hit);
      return hit||net;}));
  }
});
