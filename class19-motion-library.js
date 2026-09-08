/* CLASS 19 · MOTION + MODULE STUDIO INTEGRATION

   Eleven motion engines exist in this project, and until now they lived in three
   different places: seven inside one <select>, one as its own transversal card, and
   three only as isolated labs with no entry in Studio at all. You could not see what
   the product had, let alone choose it.

   This is a LIBRARY, not a new engine. It owns no motion, no geometry and no state:

     · which orbit preset is active is still `#motion-orbital-style` — this reads it
       and writes to it, exactly as a visitor would;
     · whether the traveler is on is still `scrollTraveler.enabled` through
       RestaurantStudioConfig;
     · the three full-page experiences are still their own pages. They build their own
       DOM (`.ds-lab`, `.cpr-page`, the rotator's own stage) and one of them asserts in
       its contract that it does not depend on the shared motion engine. Turning them
       into orbit presets would be a rewrite of approved work, so the library opens
       them instead of pretending they are presets.

   Nothing here is per-engine code. The catalogue is data and the renderer switches on
   `kind`, so a twelfth engine is one row.
*/
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  /* ---------- the catalogue ----------
     `kind` is the whole contract:
       preset      → a choreography of the shared orbit stage, chosen in the select
       page        → transversal page motion, switched by a config flag
       experience  → a full-screen experience with its own page
     `needs` is the option value or the runtime flag that proves it is really loaded. */
  const ENGINES=[
    {n:'01',id:'elegant',kind:'preset',value:'elegant',
      name:'Elegant Orbit',project:'Class 05',
      note:'La coreografía base: la colección gira con calma alrededor del plato activo.'},
    {n:'02',id:'urban',kind:'preset',value:'urban',
      name:'Urban Acrobatics',project:'Class 05',
      note:'Acrobacia urbana: entradas rápidas, recorte seco y aterrizaje con carácter.'},
    {n:'03',id:'editorial-flow',kind:'preset',value:'editorial-flow',
      name:'Editorial Flow',project:'Class 07',
      note:'Ritmo de revista: el producto avanza como una maqueta editorial.'},
    {n:'04',id:'depth-carousel',kind:'preset',value:'depth-carousel',
      name:'Cinematic Depth Carousel',project:'Project 01',
      note:'Profundidad real: capas, decorado y fondo que responden al plato en foco.'},
    {n:'05',id:'anchor-scenes',kind:'preset',value:'anchor-scenes',
      name:'Precomposed Anchor Scenes',project:'Project 02',
      note:'Escenas fotográficas reales encadenadas sobre un anclaje común.'},
    {n:'06',id:'orbital-food',kind:'preset',value:'orbital-food',
      name:'Orbital Food Slider',project:'Project 03',
      note:'La colección entera en órbita, con el héroe descentrado y tipografía de fondo.'},
    {n:'07',id:'circular-dish-rotator',kind:'experience',
      href:'labs/project06-circular-dish-rotator/index.html',
      name:'Circular Dish Rotator',project:'Project 06',
      note:'Rueda circular de sectores con su propia narrativa y personalización.'},
    {n:'08',id:'pizza-slice-orbit',kind:'preset',value:'pizza-slice-orbit',
      name:'Pizza Slice Orbit · Premium',project:'Project 07',
      note:'Ocho porciones independientes sobre una estación fija, con mundo cromático por producto.'},
    {n:'09',id:'scroll-traveler',kind:'page',path:'scrollTraveler.enabled',
      name:'Scroll Traveler',project:'Project 09',
      note:'Un objeto atraviesa la página al hacer scroll. Convive con cualquier coreografía.'},
    {n:'10',id:'dish-stage',kind:'experience',
      href:'labs/project10-dish-stage/index.html',
      name:'Dish Stage',project:'Project 10',
      note:'Escenario a pantalla completa: un plato, su mundo y su ficha.'},
    {n:'11',id:'cinematic-product-rail',kind:'experience',
      href:'labs/project11-cinematic-product-rail/index.html',
      name:'Cinematic Product Rail',project:'Project 11',
      note:'Raíl cinematográfico de producto con avance continuo.'}
  ];

  /* Not engines. They are listed so Studio shows everything the product has, and they
     are deliberately outside the count of eleven. */
  const MODULES=[
    {id:'location',href:'labs/module-location-maps/index.html',
      name:'Location / Google Maps',project:'Class 16 · Class 20',
      note:'Dirección, horarios y mapas con carga bajo consentimiento.'},
    {id:'social-reputation',href:'labs/module-social-reputation/index.html',
      name:'Social / Reputation',project:'Class 17',
      note:'Prueba social y reputación: reseñas, valoraciones y credibilidad.'},
    {id:'whatsapp-contact',href:'labs/module-whatsapp-contact/index.html',
      name:'WhatsApp Contact',project:'Class 18',
      note:'Contacto directo por WhatsApp con mensaje y horario configurables.'}
  ];

  /* The badge is short on purpose. A long one ("pantalla completa")competed with the engine
     name for the same row and pushed three-word titles into three lines. */
  const KINDS={
    preset:{label:'Coreografía de producto',badge:'ORBIT'},
    page:{label:'Movimiento de página',badge:'TRANSVERSAL'},
    experience:{label:'Experiencia completa',badge:'EXPERIENCIA'}
  };
  const FILTERS=[
    {id:'all',label:'Todos'},
    {id:'preset',label:'Coreografías'},
    {id:'page',label:'Página'},
    {id:'experience',label:'Experiencias'}
  ];

  let root=document.documentElement;
  let library=null,filter='all',ready=false;

  const select=()=>$('#motion-orbital-style');
  const optionFor=value=>select()?.querySelector(`option[value="${value}"]`);

  /* Availability is READ from the page, never assumed: a preset exists once its
     runtime has injected its option, and an experience exists as a page. */
  function statusOf(engine){
    if(engine.kind==='preset'){
      const has=!!optionFor(engine.value);
      const active=select()?.value===engine.value;
      return {available:has,active,
        state:!has?'cargando':(active?'activo':'disponible')};
    }
    if(engine.kind==='page'){
      const on=window.RestaurantStudioConfig?.get?.(engine.path)!==false;
      return {available:!!window.RestaurantScrollTraveler,active:on,
        state:on?'activo':'apagado'};
    }
    /* an experience has no on/off state to report — the button already says what it
       does, and "EXPERIENCIA · ABRIR" only wrapped the footer onto two lines */
    return {available:true,active:false,state:''};
  }

  function ensureStyles(){
    if($('link[data-motion-library-styles]'))return;
    const l=document.createElement('link');
    l.rel='stylesheet';l.href='styles-v19.css';l.dataset.motionLibraryStyles='1';
    document.head.appendChild(l);
  }

  const label=(badge,state)=>state?`${badge} · ${state}`:badge;

  function card(engine){
    const kind=KINDS[engine.kind];
    const st=statusOf(engine);
    const action=engine.kind==='experience'
      ? `<a class="ml-action ml-open" href="${engine.href}" target="_blank" rel="noopener"
           data-ml-open="${engine.id}">Abrir experiencia →</a>`
      : engine.kind==='page'
        ? `<button type="button" class="ml-action ml-toggle" data-ml-toggle="${engine.id}"
             aria-pressed="${st.active}">${st.active?'Activado':'Desactivado'}</button>`
        : `<button type="button" class="ml-action ml-activate" data-ml-activate="${engine.id}"
             ${st.available?'':'disabled'} ${st.active?'aria-current="true"':''}>${
             st.active?'En uso':'Activar'}</button>`;
    return `<article class="ml-card" data-ml-card="${engine.id}" data-ml-kind="${engine.kind}"
        data-ml-state="${st.state}">
      <div class="ml-card-top">
        <span class="ml-n">${engine.n}</span>
        <div class="ml-id">
          <strong>${engine.name}</strong>
          <span class="ml-project">${engine.project}</span>
        </div>
      </div>
      <p class="ml-note">${engine.note}</p>
      <div class="ml-card-foot">
        <span class="ml-state" data-ml-state-label>${label(kind.badge,st.state)}</span>
        ${action}
      </div>
    </article>`;
  }

  function moduleCard(mod){
    return `<article class="ml-card ml-card-module" data-ml-card="${mod.id}">
      <div class="ml-card-top">
        <span class="ml-n ml-n-module">M</span>
        <div class="ml-id">
          <strong>${mod.name}</strong>
          <span class="ml-project">${mod.project}</span>
        </div>
      </div>
      <p class="ml-note">${mod.note}</p>
      <div class="ml-card-foot">
        <span class="ml-state" data-ml-module-state="${mod.id}">MÓDULO · OFF</span>
        <button class="ml-action" type="button" data-configure-module="${mod.id}">Configurar</button>
        <a class="ml-action ml-open" href="${mod.href}" target="_blank" rel="noopener"
           data-ml-open="${mod.id}">Abrir módulo →</a>
      </div>
    </article>`;
  }

  function build(){
    const panel=$('.studio-panel.motion-panel');
    if(!panel||$('.ml-library',panel))return false;
    ensureStyles();
    library=document.createElement('section');
    library.className='ml-library';
    library.innerHTML=`
      <header class="ml-head">
        <div>
          <p class="eyebrow">Motion Engines</p>
          <h3>Biblioteca de motores <span class="ml-count">${ENGINES.length}</span></h3>
          <p class="ml-lead">Todos los lenguajes de movimiento del proyecto en un solo
            sitio. Las coreografías se activan sobre la carta; el movimiento de página
            convive con cualquiera de ellas; las experiencias completas se abren en su
            propia pantalla.</p>
        </div>
      </header>
      <div class="ml-filters" role="tablist" aria-label="Filtrar motores">
        ${FILTERS.map(f=>`<button type="button" role="tab" class="ml-filter"
          data-ml-filter="${f.id}" aria-selected="${f.id===filter}">${f.label}</button>`).join('')}
      </div>
      <div class="ml-grid" data-ml-grid>${ENGINES.map(card).join('')}</div>
      <section class="ml-modules">
        <h4>Módulos <span class="ml-count ml-count-soft">${MODULES.length}</span></h4>
        <p class="ml-lead">No son motores de movimiento y no cuentan dentro de los
          ${ENGINES.length}: son piezas de negocio que se integran aparte.</p>
        <div class="ml-grid">${MODULES.map(moduleCard).join('')}</div>
      </section>`;
    /* The library is the index of the panel: it belongs under the panel's own
       introduction and above the cards that tune each engine. Anchoring on the intro
       element rather than on a child position keeps it there even if the shell adds a
       whitespace node or another block before it. */
    const intro=$('.panel-intro',panel);
    if(intro&&intro.parentNode===panel)intro.insertAdjacentElement('afterend',library);
    else panel.insertBefore(library,panel.firstElementChild);
    wire();
    library.addEventListener('click',e=>{const b=e.target.closest('[data-configure-module]');if(b)window.RestaurantModulesStudio?.open(({ 'social-reputation':'social','whatsapp-contact':'whatsapp' })[b.dataset.configureModule]||b.dataset.configureModule)});
    sync();
    root.dataset.motionLibrary='ready';
    return true;
  }

  function wire(){
    library.addEventListener('click',e=>{
      const f=e.target.closest('[data-ml-filter]');
      if(f){
        filter=f.dataset.mlFilter;
        $$('[data-ml-filter]',library).forEach(b=>
          b.setAttribute('aria-selected',String(b.dataset.mlFilter===filter)));
        applyFilter();
        return;
      }
      const act=e.target.closest('[data-ml-activate]');
      if(act&&!act.disabled){
        const engine=ENGINES.find(x=>x.id===act.dataset.mlActivate);
        activate(engine);
        return;
      }
      const tog=e.target.closest('[data-ml-toggle]');
      if(tog){
        const engine=ENGINES.find(x=>x.id===tog.dataset.mlToggle);
        const now=window.RestaurantStudioConfig?.get?.(engine.path)!==false;
        window.RestaurantStudioConfig?.set?.(engine.path,!now);
        /* sync() will read the new value back; nothing is stored here */
      }
    });
    /* the select stays the single source of truth for which choreography is on */
    select()?.addEventListener('change',sync);
    select()?.addEventListener('input',sync);
    new MutationObserver(sync).observe(select()||document.body,
      {childList:true,attributes:true,attributeFilter:['value']});
    document.addEventListener('restaurant:config-applied',sync);
    root.dataset.motionLibraryCount=String(ENGINES.length);
  }

  /* choosing a preset is exactly what a visitor does in the select */
  function activate(engine){
    const s=select();
    if(!s||!optionFor(engine.value))return false;
    s.value=engine.value;
    s.dispatchEvent(new Event('input',{bubbles:true}));
    s.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
    sync();
    return true;
  }

  function applyFilter(){
    $$('[data-ml-card]',library).forEach(c=>{
      if(c.classList.contains('ml-card-module'))return;
      c.hidden=filter!=='all'&&c.dataset.mlKind!==filter;
    });
  }

  /* Derived, always. The library never remembers which engine is active — it asks. */
  function sync(){
    if(!library)return;
    MODULES.forEach(mod=>{const key=({'social-reputation':'social','whatsapp-contact':'whatsapp'})[mod.id]||mod.id;const badge=$(`[data-ml-module-state="${mod.id}"]`,library);if(badge)badge.textContent=`MÓDULO · ${window.RestaurantStudioConfig?.get(`modules.${key}.enabled`)?'ON':'OFF'}`});
    ENGINES.forEach(engine=>{
      const el=$(`[data-ml-card="${engine.id}"]`,library);
      if(!el)return;
      const st=statusOf(engine);
      el.dataset.mlState=st.state;
      const labelEl=$('[data-ml-state-label]',el);
      if(labelEl)labelEl.textContent=label(KINDS[engine.kind].badge,st.state);
      const btn=$('.ml-activate',el);
      if(btn){
        btn.disabled=!st.available;
        btn.textContent=st.active?'En uso':'Activar';
        if(st.active)btn.setAttribute('aria-current','true');
        else btn.removeAttribute('aria-current');
      }
      const toggle=$('.ml-toggle',el);
      if(toggle){
        toggle.setAttribute('aria-pressed',String(st.active));
        toggle.textContent=st.active?'Activado':'Desactivado';
      }
    });
    const active=ENGINES.find(e=>e.kind==='preset'&&statusOf(e).active);
    root.dataset.motionLibraryActive=active?active.id:'';
    applyFilter();
  }

  function boot(){
    if(ready)return;
    const panel=$('.studio-panel.motion-panel');
    /* Build only once the panel is actually on screen.

       Studio creates its panels hidden at boot, so the library COULD be built while
       the drawer is closed — and it used to be. That put thirteen cards into the DOM
       during the busiest moment of the page's life, and under a slow CPU it shifted
       the boot order enough to expose a pre-existing race in how a preset's saved
       choice is restored: one run in six ended back on the default choreography.
       The library is an index of a drawer nobody has opened yet, so it simply waits.
       Nothing outside Studio can feel it any more. */
    if(!panel||panel.offsetParent===null)return;
    if(!build())return;
    ready=true;
  }
  /* Each engine injects its option when its runtime lands, so keep looking until the
     panel is open, then keep the view honest. */
  const timer=setInterval(()=>{boot();if(ready)clearInterval(timer)},200);
  setTimeout(()=>clearInterval(timer),120000);
  document.addEventListener('click',e=>{
    if(e.target.closest?.('.studio-open'))setTimeout(()=>{boot();sync()},260);
  },true);
  /* A preset's runtime can land after the library is built, and the select can be
     changed from anywhere, so the view is refreshed periodically — but only while the
     panel is actually on screen. A closed drawer costs nothing. */
  setInterval(()=>{if(ready&&library&&library.offsetParent!==null)sync()},1500);

  window.RestaurantMotionLibrary={
    engines:()=>ENGINES.map(e=>({...e,status:statusOf(e)})),
    modules:()=>MODULES.slice(),
    count:()=>ENGINES.length,
    moduleCount:()=>MODULES.length,
    activate(id){const e=ENGINES.find(x=>x.id===id);return e?activate(e):false},
    setFilter(id){filter=id;if(library){
      $$('[data-ml-filter]',library).forEach(b=>
        b.setAttribute('aria-selected',String(b.dataset.mlFilter===filter)));
      applyFilter()}return filter},
    state(){return {ready,count:ENGINES.length,modules:MODULES.length,filter,
      active:root.dataset.motionLibraryActive||'',
      available:ENGINES.filter(e=>statusOf(e).available).length}}
  };
})();
