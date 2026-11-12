// CasaFinance — service worker: funciona offline e atualiza sozinho
const V='casafinance-v2';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!=='cf-share').map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;const u=new URL(r.url);
  // arquivos compartilhados de outros apps (comprovante do banco, foto da nota) chegam aqui
  if(r.method==='POST'&&u.searchParams.has('compartilhar')){e.respondWith((async()=>{try{const fd=await r.formData();const fs=fd.getAll('arquivos').filter(f=>f&&f.size);const c=await caches.open('cf-share');
      const meta={text:[fd.get('title'),fd.get('text'),fd.get('url')].filter(Boolean).join('\n'),files:[]};
      for(let i=0;i<fs.length;i++){await c.put(new URL('./__share/'+i,self.registration.scope).href,new Response(fs[i],{headers:{'Content-Type':fs[i].type||'application/octet-stream'}}));meta.files.push({i,name:fs[i].name,type:fs[i].type})}
      await c.put(new URL('./__share/meta',self.registration.scope).href,new Response(JSON.stringify(meta),{headers:{'Content-Type':'application/json'}}))}catch(err){}
    return Response.redirect(new URL('./?compartilhado=1',self.registration.scope).href,303)})());return}
  if(r.method!=='GET')return;
  if(/script\.google|api\.anthropic/.test(u.host))return;
  if(r.mode==='navigate'||u.pathname.endsWith('/index.html')){ // rede primeiro: pega a versão nova quando houver internet
    e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put('./index.html',c));return res}).catch(()=>caches.match('./index.html')));return}
  e.respondWith(caches.match(r).then(hit=>{const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res}).catch(()=>hit);return hit||net}));
});
