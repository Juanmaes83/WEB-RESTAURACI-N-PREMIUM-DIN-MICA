/* CLASS 04 — durable browser-local project + media persistence, aligned with Escaparates Pro patterns */
(function(){
  'use strict';
  const DB_NAME='restaurant-premium-studio';
  const DB_VERSION=2;
  const PROJECTS='projects';
  const MEDIA='media';
  let dbPromise;

  function open(){
    if(dbPromise) return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(PROJECTS)) db.createObjectStore(PROJECTS,{keyPath:'id'});
        if(!db.objectStoreNames.contains(MEDIA)) db.createObjectStore(MEDIA,{keyPath:'slot'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('IndexedDB open failed'));
      req.onblocked=()=>reject(new Error('IndexedDB upgrade blocked by another tab'));
    });
    return dbPromise;
  }

  function tx(store,mode,action){
    return open().then(db=>new Promise((resolve,reject)=>{
      const transaction=db.transaction(store,mode);
      const objectStore=transaction.objectStore(store);
      let request=null;
      let requestResult;
      try{ request=action(objectStore); }catch(err){ reject(err); return; }
      if(request){
        request.onsuccess=()=>{ requestResult=request.result; };
        request.onerror=()=>{ reject(request.error||new Error('IndexedDB request failed')); };
      }
      transaction.oncomplete=()=>resolve(requestResult);
      transaction.onerror=()=>reject(transaction.error||new Error('IndexedDB transaction failed'));
      transaction.onabort=()=>reject(transaction.error||new Error('IndexedDB transaction aborted'));
    }));
  }

  function normalizeProject(project){
    const now=new Date().toISOString();
    const incoming=project||{};
    return Object.assign({
      id:'restaurant-class4',
      schemaVersion:4,
      status:'draft',
      createdAt:incoming.createdAt||now,
      updatedAt:now,
      lastOpenedAt:now,
      persistenceMode:'indexeddb'
    },incoming,{updatedAt:now,lastOpenedAt:now,persistenceMode:'indexeddb'});
  }

  async function saveProject(project){
    const normalized=normalizeProject(project);
    await tx(PROJECTS,'readwrite',s=>s.put(normalized));
    return normalized;
  }
  function loadProject(id='restaurant-class4'){ return tx(PROJECTS,'readonly',s=>s.get(id)); }
  function clearProject(id='restaurant-class4'){ return tx(PROJECTS,'readwrite',s=>s.delete(id)); }

  async function saveMedia(slot,file,meta={}){
    if(!slot) throw new Error('Media slot is required');
    if(!(file instanceof Blob)) throw new Error('Media must be a Blob/File');
    const record={
      slot,
      file,
      name:file.name||meta.name||slot,
      type:file.type||meta.type||'application/octet-stream',
      size:file.size||0,
      updatedAt:new Date().toISOString(),
      kind:(file.type||'').startsWith('video/')?'video':'image',
      fit:meta.fit||'cover',
      position:meta.position||'50% 50%'
    };
    await tx(MEDIA,'readwrite',s=>s.put(record));
    return record;
  }
  function loadMedia(slot){ return tx(MEDIA,'readonly',s=>s.get(slot)); }
  function deleteMedia(slot){ return tx(MEDIA,'readwrite',s=>s.delete(slot)); }
  function listMedia(){ return tx(MEDIA,'readonly',s=>s.getAll()); }
  function clearMedia(){ return tx(MEDIA,'readwrite',s=>s.clear()); }

  async function verifyPersistence(){
    const probeId='__class4_probe__';
    const probe={id:probeId,schemaVersion:4,status:'probe',config:{ok:true,stamp:Date.now()}};
    await saveProject(probe);
    const loaded=await loadProject(probeId);
    await clearProject(probeId);
    if(!loaded||loaded.config?.ok!==true) throw new Error('Project persistence self-test failed');
    return true;
  }

  function exportJSON(project){
    return JSON.stringify({schemaVersion:4,exportedAt:new Date().toISOString(),project},null,2);
  }

  window.RestaurantStore={open,saveProject,loadProject,clearProject,saveMedia,loadMedia,deleteMedia,listMedia,clearMedia,verifyPersistence,exportJSON};

  /* Studio shell is bound synchronously. CSS owns open/close; application code must not animate this transform. */
  const studio=document.getElementById('studio');
  const backdrop=document.getElementById('studio-backdrop');
  if(studio&&backdrop){
    const openStudioShell=()=>{
      studio.setAttribute('aria-hidden','false');
      studio.classList.add('is-open');
      backdrop.classList.add('is-open');
      document.body.classList.add('studio-open');
      setTimeout(()=>document.getElementById('studio-close')?.focus(),100);
    };
    const closeStudioShell=()=>{
      studio.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      studio.setAttribute('aria-hidden','true');
      document.body.classList.remove('studio-open');
    };
    document.querySelectorAll('.studio-open').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();openStudioShell();},true));
    document.getElementById('studio-close')?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();closeStudioShell();},true);
    backdrop.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();closeStudioShell();},true);
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&studio.getAttribute('aria-hidden')==='false')closeStudioShell();},true);
    window.RestaurantStudioShell={open:openStudioShell,close:closeStudioShell};
  }
})();
