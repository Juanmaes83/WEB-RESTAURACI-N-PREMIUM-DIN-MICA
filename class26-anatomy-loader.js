/* CLASS 26 — ANATOMY CAPABILITY LOADER

   Espera a las APIs compartidas que ya son de la plataforma —Media Library, Media Picker
   y Studio config— y encadena Class 26 en orden determinista. Aditivo: si algo falla, el
   resto del producto no se entera.

   Se carga desde `index.html`, no colgado del fichero de otra clase. Class 25 tuvo que
   engancharse a `class24-motion-governance.js` porque llegó después de la cadena; aquí
   no hace falta el atajo y una etiqueta <script> se lee mejor que una dependencia
   escondida.

   `review` va ANTES del engine a propósito: la ruta de revisión superpone el namespace
   `anatomy` y entrega su plato en memoria, así que tiene que estar en pie cuando el
   motor pregunte por primera vez. Sin `?review=anatomy` el fichero se descarta solo en
   su primera línea y no cuesta nada.
*/
(() => {
  'use strict';
  /* NO MONTAR DENTRO DE LA SHELL DE EXPERIENCIAS — y sólo ahí.

     La primera versión guardaba con `window.parent!==window`, que es la forma corta y
     resulta demasiado amplia: bloquea CUALQUIER framing. Medido: el enlace de revisión
     por raw.githack.com abre la página dentro de un iframe, y con esa guarda la sección
     no se montaba y el enlace no servía para revisar nada.

     La shell de Class 22 marca su iframe con `class="xs-frame"` y siempre carga páginas
     del MISMO origen, así que se puede reconocer con exactitud. Si el padre es de otro
     origen, `frameElement` lanza o devuelve null: no es nuestra shell, y se monta. */
  const insideExperienceShell=()=>{
    if(window.parent===window)return false;
    try{return !!window.frameElement?.classList?.contains('xs-frame')}
    catch{return false}
  };
  if(insideExperienceShell())return;
  const root=document.documentElement;
  const CHAIN=['class26-anatomy-model.js','class26-anatomy-review.js',
               'class26-anatomy-engine.js','class26-anatomy-studio.js'];

  function ensureStyles(){
    if(document.querySelector('link[data-class26-anatomy-styles]'))return;
    const l=document.createElement('link');
    l.rel='stylesheet';l.href='styles-v26.css';l.dataset.class26AnatomyStyles='1';
    document.head.appendChild(l);
  }

  function load(i=0){
    if(i>=CHAIN.length){
      root.dataset.class26Anatomy='ready';
      document.dispatchEvent(new CustomEvent('restaurant:anatomy-loaded'));
      return;
    }
    const src=CHAIN[i];
    if(document.querySelector(`script[src="${src}"]`)){load(i+1);return}
    const s=document.createElement('script');
    s.src=src;s.dataset.class26AnatomyPart=String(i+1);
    s.onload=()=>load(i+1);
    s.onerror=()=>{root.dataset.class26Anatomy='error';console.error(`Class 26 failed to load ${src}`)};
    document.body.appendChild(s);
  }

  function waitForPlatform(attempt=0){
    if(window.RestaurantMedia&&window.RestaurantMediaPicker&&window.RestaurantStudioConfig){
      ensureStyles();load();return;
    }
    if(attempt>160){
      root.dataset.class26Anatomy='error';
      console.error('Class 26 timed out waiting for shared platform APIs');
      return;
    }
    setTimeout(()=>waitForPlatform(attempt+1),50);
  }

  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',()=>waitForPlatform(),{once:true});
  else waitForPlatform();
})();
