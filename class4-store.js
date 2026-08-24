/* CLASS 04 — browser-local project + media persistence inspired by Escaparates Pro */
(function(){
  'use strict';
  const DB_NAME='restaurant-premium-studio';
  const DB_VERSION=1;
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
      req.onerror=()=>reject(req.error);
    });
    return dbPromise;
  }

  function request(store,mode,action){
    return open().then(db=>new Promise((resolve,reject)=>{
      const tx=db.transaction(store,mode);
      const s=tx.objectStore(store);
      let req;
      try{ req=action(s); }catch(err){ reject(err); return; }
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    }));
  }

  function normalizeProject(project){
    const now=new Date().toISOString();
    return Object.assign({
      id:'restaurant-class4',
      schemaVersion:4,
      status:'draft',
      createdAt:now,
      updatedAt:now
    },project||{}, {updatedAt:now});
  }

  function saveProject(project){ return request(PROJECTS,'readwrite',s=>s.put(normalizeProject(project))).then(()=>normalizeProject(project)); }
  function loadProject(id='restaurant-class4'){ return request(PROJECTS,'readonly',s=>s.get(id)); }
  function clearProject(id='restaurant-class4'){ return request(PROJECTS,'readwrite',s=>s.delete(id)); }
  function saveMedia(slot,file){ return request(MEDIA,'readwrite',s=>s.put({slot,file,name:file.name,type:file.type,size:file.size,updatedAt:new Date().toISOString()})); }
  function loadMedia(slot){ return request(MEDIA,'readonly',s=>s.get(slot)); }
  function deleteMedia(slot){ return request(MEDIA,'readwrite',s=>s.delete(slot)); }
  function listMedia(){ return request(MEDIA,'readonly',s=>s.getAll()); }
  function clearMedia(){ return open().then(db=>new Promise((resolve,reject)=>{const tx=db.transaction(MEDIA,'readwrite');tx.objectStore(MEDIA).clear();tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);})); }

  function exportJSON(project){
    return JSON.stringify({schemaVersion:4,exportedAt:new Date().toISOString(),project},null,2);
  }

  window.RestaurantStore={open,saveProject,loadProject,clearProject,saveMedia,loadMedia,deleteMedia,listMedia,clearMedia,exportJSON};
})();