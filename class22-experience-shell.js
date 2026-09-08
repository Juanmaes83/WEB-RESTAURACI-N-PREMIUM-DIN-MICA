/* CLASS 22 — IN-APP EXPERIENCE SHELL

   Las tres experiencias autónomas dejan de ser una pestaña nueva. Se abren DENTRO de
   la aplicación, sobre el mismo proyecto, y cerrar devuelve al Studio.

   Por qué un iframe same-origin y no integración nativa está medido y razonado en
   docs/IN-APP-EXPERIENCE-AUDIT.md; en una frase: ninguna de las tres tiene `destroy()`
   y su CSS da por hecho que es el documento. Quitar el nodo del iframe apaga rAF,
   timers, listeners y canvas sin tocar su motor, y aísla su CSS sin editar una regla.

   La shell es la superficie de producto:

     · el `src` sólo se asigna al abrir — cerrada no hace ninguna petición;
     · el proyecto se entrega al hijo de forma explícita y sincrónica, aprovechando el
       mismo origen: el hijo no es una segunda fuente de verdad y no persiste nada;
     · cerrar, Escape y el botón Atrás del navegador hacen lo mismo: volver al Studio;
     · el foco entra en la shell y vuelve a quien la abrió.

   `labs/` sigue existiendo para evidencia y regresión. Deja de ser el punto de entrada
   del producto: eso es todo lo que cambia.
*/
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const root=document.documentElement;

  /* Catálogo: id, nombre visible y su página. Datos, no ramas — una experiencia más
     es una fila. Los mismos ids que usa el catálogo de Class 19. */
  const EXPERIENCES=[
    {id:'circular-dish-rotator',name:'Circular Dish Rotator',project:'Project 06',
      url:'labs/project06-circular-dish-rotator/index.html'},
    {id:'dish-stage',name:'Dish Stage',project:'Project 10',
      url:'labs/project10-dish-stage/index.html'},
    {id:'cinematic-product-rail',name:'Cinematic Product Rail',project:'Project 11',
      url:'labs/project11-cinematic-product-rail/index.html'}
  ];
  const find=id=>EXPERIENCES.find(e=>e.id===id)||null;

  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let layer=null,frame=null,active=null,trigger=null,pushed=false,loadTimer=0;
  let pendingFocus=null;
  const restoreFocus=()=>{
    const el=pendingFocus;pendingFocus=null;
    if(el&&el.isConnected)el.focus();
  };

  /* ---------- el proyecto que se entrega al hijo ----------

     Se lee del Project State vivo (o de la plantilla si el Studio aún no ha arrancado)
     y se entrega en claro. No se copia a ningún sitio, no se persiste y el hijo no
     escribe de vuelta: es una lectura del proyecto activo, no un segundo estado. */
  function project(){
    const cfg=window.RestaurantStudioConfig;
    const snap=cfg?.snapshot?.()||window.RestaurantDefaults||{};
    return {
      brand:snap.brand||{},
      dishes:snap.dishes||[],
      media:snap.media||{},
      productDetail:snap.productDetail||{},
      locale:root.dataset.locale||'es',
      /* la media subida vive como blob en el store del proyecto y el padre ya tiene
         sus URLs resueltas; un blob: del padre es legible desde un iframe del mismo
         origen, así que se pasa la referencia y no se duplica el asset */
      resolveMedia:slot=>{
        try{return window.RestaurantMediaResolve?.(slot)||snap.media?.[slot]?.src||''}
        catch(e){return ''}
      }
    };
  }

  function ensureStyles(){
    if($('link[data-experience-shell-styles]'))return;
    const l=document.createElement('link');
    l.rel='stylesheet';l.href='styles-v22.css';l.dataset.experienceShellStyles='1';
    document.head.appendChild(l);
  }

  function ensureLayer(){
    if(layer?.isConnected)return layer;
    ensureStyles();
    layer=document.createElement('div');
    layer.className='xs-shell';
    layer.id='experience-shell';
    layer.setAttribute('role','dialog');
    layer.setAttribute('aria-modal','true');
    layer.setAttribute('aria-hidden','true');
    layer.setAttribute('aria-labelledby','xs-title');
    layer.innerHTML=`
      <header class="xs-bar">
        <button type="button" class="xs-back" data-xs-back>
          <span aria-hidden="true">←</span> Volver al Studio</button>
        <div class="xs-id">
          <strong id="xs-title" data-xs-name></strong>
          <span class="xs-project" data-xs-project></span>
        </div>
        <span class="xs-badge">Vista previa</span>
      </header>
      <div class="xs-stage">
        <p class="xs-status" data-xs-status role="status" aria-live="polite">Cargando…</p>
        <div class="xs-frame-host" data-xs-host></div>
      </div>`;
    document.body.appendChild(layer);
    layer.addEventListener('click',e=>{
      if(e.target.closest('[data-xs-back]'))close({reason:'back-button'});
    });
    return layer;
  }

  const status=(text,state)=>{
    const el=$('[data-xs-status]',layer);
    if(!el)return;
    el.textContent=text||'';
    el.hidden=!text;
    if(layer)layer.dataset.state=state||'';
  };

  /* ---------- apertura ---------- */
  function open(id,options={}){
    const exp=find(id);
    if(!exp)return false;
    if(active&&active.id===exp.id)return true;
    if(active)teardown();
    ensureLayer();
    active=exp;
    trigger=options.trigger
      ||(document.activeElement instanceof HTMLElement?document.activeElement:null);

    $('[data-xs-name]',layer).textContent=exp.name;
    $('[data-xs-project]',layer).textContent=exp.project;
    status('Cargando la experiencia…','loading');

    /* el proyecto se deja disponible ANTES de crear el iframe: el puente del hijo lo
       pide de forma sincrónica en cuanto su documento empieza a ejecutar */
    api.project=project;

    frame=document.createElement('iframe');
    frame.className='xs-frame';
    frame.title=exp.name;
    /* mismo origen a propósito: es lo que permite el traspaso explícito del proyecto */
    frame.setAttribute('referrerpolicy','same-origin');
    frame.addEventListener('load',()=>{
      clearTimeout(loadTimer);
      status('','ready');
      /* el foco entra en la shell, no en el documento de fondo */
      requestAnimationFrame(()=>$('[data-xs-back]',layer)?.focus());
    });
    frame.addEventListener('error',()=>{
      clearTimeout(loadTimer);
      status('No se pudo cargar la experiencia. Vuelve al Studio e inténtalo de nuevo.','error');
    });
    /* `#shell` es la señal que el puente del hijo lee para saber que está enmarcado por
       el producto: abierto directamente, el lab se comporta como siempre */
    frame.src=`${exp.url}#shell`;
    $('[data-xs-host]',layer).appendChild(frame);
    loadTimer=setTimeout(()=>{
      if(layer?.dataset.state==='loading')
        status('La experiencia está tardando más de lo normal…','loading');
    },6000);

    layer.classList.add('is-open');
    layer.setAttribute('aria-hidden','false');
    document.body.classList.add('xs-open');
    root.dataset.experienceShell=exp.id;

    /* Atrás del navegador cierra, y un refresh no deja la app rota: el estado se
       empuja, pero la shell nunca se abre sola al recargar. */
    if(options.history!==false&&window.history?.pushState){
      try{
        history.pushState({experienceShell:exp.id},'',`#experience/${exp.id}`);
        pushed=true;
      }catch(e){pushed=false}
    }
    document.dispatchEvent(new CustomEvent('restaurant:experience-open',{detail:{id:exp.id}}));
    return true;
  }

  /* ---------- cierre: quitar el nodo ES el desmontaje ---------- */
  function teardown(){
    clearTimeout(loadTimer);
    if(frame){
      /* apagar antes de desconectar evita que el hijo pinte un último frame */
      try{frame.src='about:blank'}catch(e){}
      frame.remove();
      frame=null;
    }
    const host=layer?$('[data-xs-host]',layer):null;
    if(host)host.innerHTML='';
    active=null;
  }

  function close(options={}){
    if(!active&&!layer?.classList.contains('is-open'))return false;
    const closing=active?.id||'';
    teardown();
    if(layer){
      layer.classList.remove('is-open');
      layer.setAttribute('aria-hidden','true');
      layer.dataset.state='';
    }
    document.body.classList.remove('xs-open');
    delete root.dataset.experienceShell;
    /* Si se cerró desde la shell, deshacer el estado de historial que ella empujó.

       El orden importa: `history.back()` es una navegación del mismo documento y el
       navegador devuelve el foco al `body` DESPUÉS de ejecutarse, así que devolver el
       foco antes no sirve de nada. Se hace las dos veces — ahora y en el siguiente
       frame — porque enfocar dos veces el mismo botón es inocuo y perder el foco no. */
    const back=trigger;
    trigger=null;
    let pushedBack=false;
    if(pushed&&options.reason!=='history'){
      pushed=false;
      try{history.back();pushedBack=true}catch(e){}
    }else pushed=false;
    /* El navegador devuelve el foco al `body` cuando la navegación del mismo documento
       termina, que es DESPUÉS del popstate — así que el foco se guarda y se aplica
       cuando ese ciclo ha pasado, con un plazo de gracia como red. */
    pendingFocus=back;
    if(pushedBack)setTimeout(restoreFocus,140);
    else restoreFocus();
    document.dispatchEvent(new CustomEvent('restaurant:experience-close',{detail:{id:closing}}));
    return true;
  }

  const isOpen=()=>!!active&&!!layer?.classList.contains('is-open');

  /* ---------- teclado e historial ---------- */
  /* Escape cierra la experiencia y NADA más.

     El Studio registra su propio Escape en captura sobre `document` (class4-store), y
     entre dos listeners de captura en el MISMO nodo gana el que se registró primero —
     él, que carga mucho antes. Resultado: el cajón se cerraba con la experiencia, el
     usuario salía a la web en vez de volver al Studio, y el foco no podía regresar a
     un botón que acababa de quedar dentro de un subárbol invisible.

     La ruta de captura empieza en `window`, un nodo por encima, así que escuchar ahí
     llega antes sin tocar una línea del Studio. */
  addEventListener('keydown',e=>{
    if(e.key!=='Escape'||!isOpen())return;
    e.preventDefault();
    e.stopImmediatePropagation();
    close({reason:'escape'});
  },true);
  addEventListener('popstate',()=>{
    if(isOpen()){close({reason:'history'});return}
    /* el cierre pidió este popstate: ahora que ha pasado, el foco puede volver */
    setTimeout(restoreFocus,0);
  });
  /* una recarga con el hash puesto no debe abrir nada por su cuenta: la shell es una
     vista previa dentro del Studio, no una URL pública */
  if(location.hash.startsWith('#experience/')){
    try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
  }

  const api={
    open,close,isOpen,
    getActive:()=>active?{...active}:null,
    experiences:()=>EXPERIENCES.map(e=>({...e})),
    project,
    state(){
      return {open:isOpen(),active:active?.id||null,
        frames:document.querySelectorAll('.xs-frame').length,
        status:layer?.dataset.state||'',
        history:pushed,reduced:reduced.matches};
    }
  };
  window.RestaurantExperienceShell=api;
  root.dataset.experienceShellReady='ready';
})();
