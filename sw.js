// Blutex app: page loads fresh when online (so updates show at once), cached copy when offline.
const CACHE="blutex-v1";
const CORE=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./blutex_logo.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const r=e.request; if(r.method!=="GET") return;
  const u=new URL(r.url);
  const cdn=/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(u.host);
  if(u.origin!==location.origin&&!cdn) return;          // analytics etc. go straight to network
  if(r.headers.has("range")) return;                     // audio seeking
  if(cdn){ // libraries never change: cache first
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res;})));
    return;
  }
  // own files: network first, fall back to cache
  e.respondWith(fetch(r).then(res=>{ if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));} return res; })
    .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match("./index.html"))));
});
