/* CLASS 04 — resilient browser-local persistence. Visual runtime must never depend on storage success. */
(function(){
  'use strict';
  const DB_NAME='restaurant-premium-studio';
  const DB_VERSION=3;
  const PROJECTS='projects';
  const MEDIA='media';
  const PROJECT_KEY='restaurant-class4-fallback-project';
  const PROBE_KEY='restaurant-class4-fallback-probe';
  const MEDIA_META_KEY='restaurant-class4-fallback-media-meta';
  const CACHE_NAME='restaurant-premium-media-v1';
  let dbPromise;
  let mode='indexeddb';

  function open(){
    if(dbPromise) return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return;}
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(PROJECTS)) db.createObjectStore(PROJECTS,{keyPath:'id'});
        if(!db.objectStoreNames.contains(MEDIA)) db.createObjectStore(MEDIA,{keyPath:'slot'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('IndexedDB open failed'));
      req.onblocked=()=>reject(new Error('IndexedDB upgrade blocked'));
    }).catch(err=>{mode='fallback';throw err;});
    return dbPromise;
  }

  function tx(store,txMode,action){
    return open().then(db=>new Promise((resolve,reject)=>{
      const transaction=db.transaction(store,txMode);
      const objectStore=transaction.objectStore(store);
      let request=null,requestResult;
      try{request=action(objectStore);}catch(err){reject(err);return;}
      if(request){request.onsuccess=()=>{requestResult=request.result;};request.onerror=()=>reject(request.error||new Error('IndexedDB request failed'));}
      transaction.oncomplete=()=>resolve(requestResult);
      transaction.onerror=()=>reject(transaction.error||new Error('IndexedDB transaction failed'));
      transaction.onabort=()=>reject(transaction.error||new Error('IndexedDB transaction aborted'));
    }));
  }

  function normalizeProject(project){
    const now=new Date().toISOString();
    const incoming=project||{};
    return Object.assign({id:'restaurant-class4',schemaVersion:4,status:'draft',createdAt:incoming.createdAt||now},incoming,{updatedAt:now,lastOpenedAt:now,persistenceMode:mode});
  }

  function fallbackProjectSave(project){const normalized=normalizeProject(project);normalized.persistenceMode='localStorage';localStorage.setItem(PROJECT_KEY,JSON.stringify(normalized));return normalized;}
  function fallbackProjectLoad(id='restaurant-class4'){try{const raw=localStorage.getItem(PROJECT_KEY),data=raw?JSON.parse(raw):null;return data?.id===id?data:null;}catch{return null;}}
  function fallbackProjectClear(){localStorage.removeItem(PROJECT_KEY);}

  async function saveProject(project){
    const normalized=normalizeProject(project);
    try{await tx(PROJECTS,'readwrite',s=>s.put(normalized));mode='indexeddb';return normalized;}
    catch(err){mode='fallback';console.warn('IndexedDB project save failed; using localStorage fallback',err);return fallbackProjectSave(project);}
  }
  async function loadProject(id='restaurant-class4'){
    try{const value=await tx(PROJECTS,'readonly',s=>s.get(id));mode='indexeddb';return value||fallbackProjectLoad(id);}
    catch{mode='fallback';return fallbackProjectLoad(id);}
  }
  async function clearProject(id='restaurant-class4'){try{await tx(PROJECTS,'readwrite',s=>s.delete(id));}catch{}fallbackProjectClear();}

  function mediaUrl(slot){return `${location.origin}/__restaurant_studio_media__/${encodeURIComponent(slot)}`;}
  function readMeta(){try{return JSON.parse(localStorage.getItem(MEDIA_META_KEY)||'{}');}catch{return {};}}
  function writeMeta(meta){localStorage.setItem(MEDIA_META_KEY,JSON.stringify(meta));}
  async function cacheSaveMedia(slot,file,meta={}){
    if(!('caches' in window)) throw new Error('Cache Storage unavailable');
    const cache=await caches.open(CACHE_NAME);
    await cache.put(mediaUrl(slot),new Response(file,{headers:{'Content-Type':file.type||'application/octet-stream'}}));
    const all=readMeta();all[slot]={slot,name:file.name||meta.name||slot,type:file.type||meta.type||'application/octet-stream',size:file.size||0,updatedAt:new Date().toISOString(),kind:(file.type||'').startsWith('video/')?'video':'image',fit:meta.fit||'cover',position:meta.position||'50% 50%'};writeMeta(all);
    return {...all[slot],file};
  }
  async function cacheLoadMedia(slot){
    if(!('caches' in window)) return null;
    const cache=await caches.open(CACHE_NAME),res=await cache.match(mediaUrl(slot));if(!res)return null;
    const all=readMeta(),m=all[slot]||{},blob=await res.blob();
    return {...m,slot,file:blob,type:m.type||blob.type,kind:m.kind||((blob.type||'').startsWith('video/')?'video':'image')};
  }

  async function saveMedia(slot,file,meta={}){
    if(!slot) throw new Error('Media slot is required');
    if(!(file instanceof Blob)) throw new Error('Media must be a Blob/File');
    const record={slot,file,name:file.name||meta.name||slot,type:file.type||meta.type||'application/octet-stream',size:file.size||0,updatedAt:new Date().toISOString(),kind:(file.type||'').startsWith('video/')?'video':'image',fit:meta.fit||'cover',position:meta.position||'50% 50%'};
    try{await tx(MEDIA,'readwrite',s=>s.put(record));mode='indexeddb';return record;}
    catch(err){mode='fallback';console.warn('IndexedDB media save failed; using Cache Storage fallback',err);return cacheSaveMedia(slot,file,meta);}
  }
  async function loadMedia(slot){try{const rec=await tx(MEDIA,'readonly',s=>s.get(slot));if(rec)return rec;}catch{mode='fallback';}return cacheLoadMedia(slot);}
  async function deleteMedia(slot){try{await tx(MEDIA,'readwrite',s=>s.delete(slot));}catch{}if('caches' in window){const cache=await caches.open(CACHE_NAME);await cache.delete(mediaUrl(slot));}const all=readMeta();delete all[slot];writeMeta(all);}
  async function listMedia(){try{return await tx(MEDIA,'readonly',s=>s.getAll());}catch{return [];}}
  async function clearMedia(){try{await tx(MEDIA,'readwrite',s=>s.clear());}catch{}if('caches' in window)await caches.delete(CACHE_NAME);localStorage.removeItem(MEDIA_META_KEY);}

  async function verifyPersistence(){
    const probe={id:'__class4_probe__',schemaVersion:4,status:'probe',config:{ok:true,stamp:Date.now()}};
    try{await tx(PROJECTS,'readwrite',s=>s.put(probe));const loaded=await tx(PROJECTS,'readonly',s=>s.get(probe.id));await tx(PROJECTS,'readwrite',s=>s.delete(probe.id));if(loaded?.config?.ok===true){mode='indexeddb';return {ok:true,mode};}}catch{}
    try{localStorage.setItem(PROBE_KEY,JSON.stringify(probe));const loaded=JSON.parse(localStorage.getItem(PROBE_KEY)||'null');localStorage.removeItem(PROBE_KEY);if(loaded?.config?.ok===true){mode='fallback';return {ok:true,mode};}}catch{}
    return {ok:false,mode:'memory'};
  }
  function getMode(){return mode;}
  function exportJSON(project){return JSON.stringify({schemaVersion:4,exportedAt:new Date().toISOString(),project},null,2);}
  window.RestaurantStore={open,saveProject,loadProject,clearProject,saveMedia,loadMedia,deleteMedia,listMedia,clearMedia,verifyPersistence,getMode,exportJSON};

  const studio=document.getElementById('studio'),backdrop=document.getElementById('studio-backdrop');
  if(studio&&backdrop){
    const openStudioShell=()=>{studio.setAttribute('aria-hidden','false');studio.classList.add('is-open');backdrop.classList.add('is-open');document.body.classList.add('studio-open');setTimeout(()=>document.getElementById('studio-close')?.focus(),100);};
    const closeStudioShell=()=>{studio.classList.remove('is-open');backdrop.classList.remove('is-open');studio.setAttribute('aria-hidden','true');document.body.classList.remove('studio-open');};
    document.querySelectorAll('.studio-open').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();openStudioShell();},true));
    document.getElementById('studio-close')?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();closeStudioShell();},true);
    backdrop.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();closeStudioShell();},true);
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&studio.getAttribute('aria-hidden')==='false')closeStudioShell();},true);
    window.RestaurantStudioShell={open:openStudioShell,close:closeStudioShell};
  }
})();