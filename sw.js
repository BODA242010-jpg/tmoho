/* Service Worker خاص بطموح. لا يلمس أي Cache لتطبيقات أخرى (بادئة tmoh- فقط). */
const P="tmoh-",C=P+"v7-connected-tools-1",F=["./","index.html","app.js","style.css","tmoh-v6.js","tmoh-v6.css","tmoh-study.css","tmoh-study-content.js","tmoh-study.js","cloud-config.js","cloud-auth.js","rewards-ai-config.js","tmoh-sky.js","tmoh-sky.css","tmoh-league.js","tmoh-league.css","tmoh-tools.js","tmoh-tools.css","tmoh-v8.css","tmoh-v8-library.js","tmoh-v8-helpbox.js","icon.svg","manifest.json","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith(P)&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("message",e=>{if(e.data==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",e=>{const r=e.request,u=new URL(r.url);if(r.method!=="GET"||u.origin!==location.origin)return;
e.respondWith(fetch(r).then(res=>{if(res.ok&&res.type==="basic"){const c=res.clone();caches.open(C).then(x=>x.put(r,c))}return res})
.catch(()=>caches.match(r).then(m=>m||(r.mode==="navigate"?caches.match("index.html").then(i=>i||caches.match("./")):undefined)).then(m=>m||new Response("غير متصل بالإنترنت",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}}))))});
