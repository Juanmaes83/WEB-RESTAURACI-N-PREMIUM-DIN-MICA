/* IN-APP EXPERIENCE — puente del hijo.

   Se carga en cada lab ANTES de su motor y no hace absolutamente nada salvo que la
   shell del producto lo esté enmarcando. Abierto directamente, el lab se comporta
   exactamente como siempre — que es la condición para que siga sirviendo de evidencia
   y regresión.

   Enmarcado, hace tres cosas y ninguna más:

     1. deja el PROYECTO ACTIVO donde el motor ya lo buscaba (`RestaurantDefaults`),
        antes de que arranque. No copia nada a ningún sitio y no escribe de vuelta: es
        una lectura del proyecto del padre, no un segundo estado;
     2. neutraliza la persistencia propia de la experiencia que la tenga, para que la
        superficie de producto no crezca un store paralelo. Bloquea escrituras, no
        lecturas, y la experiencia ya degrada sin ruido;
     3. marca el documento como enmarcado, para que los tests y la propia shell puedan
        comprobarlo.

   No toca geometría, animaciones, DOM interno ni el modelo de producto de nadie.
*/
(() => {
  'use strict';
  const framed=(()=>{
    try{
      return window.parent!==window
        && location.hash==='#shell'
        && typeof window.parent.RestaurantExperienceShell?.project==='function';
    }catch(e){return false}   /* otro origen: no es nuestra shell */
  })();

  document.documentElement.dataset.experienceFramed=framed?'1':'0';
  if(!framed)return;

  let project=null;
  try{project=window.parent.RestaurantExperienceShell.project()}catch(e){project=null}
  if(!project)return;

  /* ---------- 1. el proyecto activo, donde el motor ya miraba ----------

     Dish Stage y Cinematic Product Rail leen `RestaurantDefaults.dishes` y
     `brand.accent` al arrancar. Se mezcla sobre lo que el lab ya hubiera cargado, de
     modo que si el proyecto no trae un campo, el valor de la plantilla sigue en su
     sitio y nada queda inventado ni vacío. */
  const base=window.RestaurantDefaults||{};
  const dishes=Array.isArray(project.dishes)&&project.dishes.length
    ? project.dishes : base.dishes;
  window.RestaurantDefaults={
    ...base,
    brand:{...(base.brand||{}),...(project.brand||{})},
    dishes,
    media:{...(base.media||{}),...(project.media||{})},
    productDetail:{...(base.productDetail||{}),...(project.productDetail||{})}
  };
  if(project.locale)document.documentElement.dataset.locale=project.locale;

  /* ---------- 2. ninguna persistencia paralela dentro del producto ----------

     Sólo la experiencia que la tiene: su perfil de restaurante en localStorage y su
     almacén de assets en IndexedDB. Las LECTURAS del perfil se sirven con la marca del
     proyecto, así que hereda nombre y acento sin escribir nada; las escrituras se
     descartan y el `open` de su base se rechaza — su `restoreAssets()` ya envuelve cada
     lectura en try/catch. */
  const OWN_PROFILE_KEYS=[/^cdr\.project06\./];
  const OWN_DB_NAMES=[/^cdr-project06-/];
  const owns=(value,patterns)=>patterns.some(re=>re.test(String(value||'')));

  const brandProfile=()=>{
    const brand=project.brand||{};
    const name=brand.name||brand.restaurantName;
    const accent=brand.accent;
    const out={};
    if(name)out.restaurantName=name;
    if(accent)out.brandAccent=accent;
    return Object.keys(out).length?JSON.stringify(out):null;
  };

  const store=window.localStorage;
  if(store){
    const getItem=store.getItem.bind(store);
    const setItem=store.setItem.bind(store);
    const removeItem=store.removeItem.bind(store);
    try{
      Object.defineProperties(window.localStorage,{
        getItem:{configurable:true,value(key){
          if(owns(key,OWN_PROFILE_KEYS))return brandProfile();
          return getItem(key);
        }},
        setItem:{configurable:true,value(key,value){
          if(owns(key,OWN_PROFILE_KEYS))return;      /* nada se persiste */
          return setItem(key,value);
        }},
        removeItem:{configurable:true,value(key){
          if(owns(key,OWN_PROFILE_KEYS))return;
          return removeItem(key);
        }}
      });
    }catch(e){/* si el motor no puede envolverse, se deja como está: nunca romperlo */}
  }

  if(window.indexedDB){
    const openDb=window.indexedDB.open.bind(window.indexedDB);
    try{
      Object.defineProperty(window.indexedDB,'open',{configurable:true,
        value(name,...rest){
          if(owns(name,OWN_DB_NAMES)){
            /* una petición que falla, que es un estado que la experiencia ya maneja */
            const request={onsuccess:null,onerror:null,onupgradeneeded:null,
              result:null,error:new DOMException('Blocked inside the product shell','InvalidStateError')};
            setTimeout(()=>{try{request.onerror?.({target:request})}catch(e){}},0);
            return request;
          }
          return openDb(name,...rest);
        }});
    }catch(e){}
  }

  /* ---------- 3. dejar constancia ---------- */
  document.documentElement.dataset.experienceProject=
    (project.brand&&(project.brand.name||''))||'';
  document.documentElement.dataset.experienceDishes=String(dishes?.length||0);
})();
