/* CLASS 19 · MOTION + MODULE STUDIO INTEGRATION

   Thirteen motion engines exist in this project: nine selectable product
   choreographies, one transversal page motion and three complete experiences.

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
   `kind`; Class 24 is one additional row. Its runtime is loaded additively below and
   remains fully owned by `class24-half-orbit-selector.js`.
*/
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  /* Class 24 arrived after the original runtime chain. This is only a loader; the
     library still owns no Class 24 geometry, interaction or state. */
  if(!document.querySelector('script[data-half-orbit-runtime]')){
    const s=document.createElement('script');
    s.src='class24-half-orbit-selector.js';s.dataset.halfOrbitRuntime='1';
    document.body.appendChild(s);
  }
  /* Class 25 arrived after Class 24. Same loader contract; the library still owns no
     Class 25 geometry, interaction or state — that stays in the engine file. */
  if(!document.querySelector('script[data-chromatic-wipe-runtime]')){
    const s=document.createElement('script');
    s.src='class25-chromatic-ingredient-wipe.js';s.dataset.chromaticWipeRuntime='1';
    document.body.appendChild(s);
  }

  /* ---------- the catalogue ----------
     `kind` is the whole contract:
       preset      → a choreography of the shared product stage, chosen in the select
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
      href:'experiences/circular-dish-rotator/index.html',
      name:'Circular Dish Rotator',project:'Project 06',
      note:'Rueda circular de sectores con su propia narrativa y personalización.'},
    {n:'08',id:'pizza-slice-orbit',kind:'preset',value:'pizza-slice-orbit',
      name:'Pizza Slice Orbit · Premium',project:'Project 07',
      note:'Ocho porciones independientes sobre una estación fija, con mundo cromático por producto.'},
    {n:'09',id:'scroll-traveler',kind:'page',path:'scrollTraveler.enabled',
      name:'Scroll Traveler',project:'Project 09',
      note:'Un objeto atraviesa la página al hacer scroll. Convive con cualquier coreografía.'},
    {n:'10',id:'dish-stage',kind:'experience',
      href:'experiences/dish-stage/index.html',
      name:'Dish Stage',project:'Project 10',
      note:'Escenario a pantalla completa: un plato, su mundo y su ficha.'},
    {n:'11',id:'cinematic-product-rail',kind:'experience',
      href:'experiences/cinematic-product-rail/index.html',
      name:'Cinematic Product Rail',project:'Project 11',
      note:'Raíl cinematográfico de producto con avance continuo.'},
    {n:'12',id:'half-orbit',kind:'preset',value:'half-orbit',
      name:'Half Orbit Selector',project:'Class 24',
      note:'Media circunferencia tipográfica: drag y flechas hacen un barrido de 180°, cambian el fondo y elevan el producto activo.'},
    {n:'13',id:'chromatic-ingredient-wipe',kind:'preset',value:'chromatic-ingredient-wipe',
      name:'Chromatic Ingredient Wipe',project:'Class 25',
      note:'Transición cinematográfica entre productos: un ingrediente gigante barre la escena y cambia por completo el mundo cromático.'}
  ];

  /* Not engines. They are listed so Studio shows everything the product has, and they
     are deliberately outside the count of twelve.

     Sin `href`: un módulo se configura en el Studio y se ve en la propia web pública
     sobre el proyecto real, así que no hay ninguna página a la que enlazar desde el
     producto. Sus labs siguen existiendo para tests y evidencia — dejaron de ser una
     acción del recorrido. */
  const MODULES=[
    {id:'location',
      name:'Location / Google Maps',project:'Class 16 · Class 20',
      note:'Dirección, horarios y mapas con carga bajo consentimiento.'},
    {id:'social-reputation',
      name:'Social / Reputation',project:'Class 17',
      note:'Prueba social y reputación: reseñas, valoraciones y credibilidad.'},
    {id:'whatsapp-contact',
      name:'WhatsApp Contact',project:'Class 18',
      note:'Contacto directo por WhatsApp con mensaje y horario configurables.'}
  ];

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

  function statusOf(engine){
    if(engine.kind==='preset'){
      const has=!!optionFor(engine.value);
      const active=select()?.value===engine.value;
      return {available:has,active,state:!has?'cargando':(active?'activo':'disponible')};
    }
    if(engine.kind==='page'){
      const on=window.RestaurantStudioConfig?.get?.(engine.path)===true;
      return {available:!!window.RestaurantScrollTraveler,active:on,state:on?'activo':'apagado'};
    }
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
      ? `<button type="button" class="ml-action ml-open" data-experience-open="${engine.id}"
           data-ml-open="${engine.id}">Abrir experiencia →</button>`
      : engine.kind==='page'
        ? `<button type="button" class="ml-action ml-toggle" data-ml-toggle="${engine.id}"
             aria-pressed="${st.active}">${st.active?'ON · Desactivar':'OFF · Activar'}</button>`
        : `<button type="button" class="ml-action ml-activate" data-ml-activate="${engine.id}"
             ${st.available?'':'disabled'} ${st.active?'aria-current="true"':''}>${st.active?'En uso':'Activar'}</button>`;
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
    const intro=$('.panel-intro',panel);
    if(intro&&intro.parentNode===panel)intro.insertAdjacentElement('afterend',library);
    else panel.insertBefore(library,panel.firstElementChild);
    wire();
    library.addEventListener('click',e=>{const b=e.target.closest('[data-configure-module]');if(b)window.RestaurantModulesStudio?.open(({ 'social-reputation':'social','whatsapp-contact':'whatsapp' })[b.dataset.configureModule]||b.dataset.configureModule)});
    library.addEventListener('click',e=>{
      const b=e.target.closest('[data-experience-open]');if(!b)return;
      window.RestaurantExperienceShell?.open(b.dataset.experienceOpen,{trigger:b});
    });
    sync();
    root.dataset.motionLibrary='ready';
    return true;
  }

  function wire(){
    library.addEventListener('click',e=>{
      const f=e.target.closest('[data-ml-filter]');
      if(f){
        filter=f.dataset.mlFilter;
        $$('[data-ml-filter]',library).forEach(b=>b.setAttribute('aria-selected',String(b.dataset.mlFilter===filter)));
        applyFilter();return;
      }
      const act=e.target.closest('[data-ml-activate]');
      if(act&&!act.disabled){
        const engine=ENGINES.find(x=>x.id===act.dataset.mlActivate);
        activate(engine);return;
      }
      const tog=e.target.closest('[data-ml-toggle]');
      if(tog){
        const engine=ENGINES.find(x=>x.id===tog.dataset.mlToggle);
        const now=window.RestaurantStudioConfig?.get?.(engine.path)===true;
        window.RestaurantStudioConfig?.set?.(engine.path,!now);
      }
    });
    select()?.addEventListener('change',sync);
    select()?.addEventListener('input',sync);
    new MutationObserver(sync).observe(select()||document.body,{childList:true,attributes:true,attributeFilter:['value']});
    document.addEventListener('restaurant:config-applied',sync);
    root.dataset.motionLibraryCount=String(ENGINES.length);
  }

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

  function sync(){
    if(!library)return;
    MODULES.forEach(mod=>{const key=({'social-reputation':'social','whatsapp-contact':'whatsapp'})[mod.id]||mod.id;const badge=$(`[data-ml-module-state="${mod.id}"]`,library);if(badge)badge.textContent=`MÓDULO · ${window.RestaurantStudioConfig?.get(`modules.${key}.enabled`)?'ON':'OFF'}`});
    ENGINES.forEach(engine=>{
      const el=$(`[data-ml-card="${engine.id}"]`,library);if(!el)return;
      const st=statusOf(engine);el.dataset.mlState=st.state;
      const labelEl=$('[data-ml-state-label]',el);if(labelEl)labelEl.textContent=label(KINDS[engine.kind].badge,st.state);
      const btn=$('.ml-activate',el);
      if(btn){btn.disabled=!st.available;btn.textContent=st.active?'En uso':'Activar';if(st.active)btn.setAttribute('aria-current','true');else btn.removeAttribute('aria-current')}
      const toggle=$('.ml-toggle',el);
      if(toggle){toggle.setAttribute('aria-pressed',String(st.active));toggle.textContent=st.active?'ON · Desactivar':'OFF · Activar'}
    });
    const active=ENGINES.find(e=>e.kind==='preset'&&statusOf(e).active);
    root.dataset.motionLibraryActive=active?active.id:'';
    applyFilter();
  }

  function boot(){
    if(ready)return;
    const panel=$('.studio-panel.motion-panel');
    if(!panel||panel.offsetParent===null)return;
    if(!build())return;
    ready=true;
  }
  const timer=setInterval(()=>{boot();if(ready)clearInterval(timer)},200);
  setTimeout(()=>clearInterval(timer),120000);
  document.addEventListener('click',e=>{if(e.target.closest?.('.studio-open'))setTimeout(()=>{boot();sync()},260)},true);
  setInterval(()=>{if(ready&&library&&library.offsetParent!==null)sync()},1500);

  window.RestaurantMotionLibrary={
    engines:()=>ENGINES.map(e=>({...e,status:statusOf(e)})),
    modules:()=>MODULES.slice(),
    count:()=>ENGINES.length,
    moduleCount:()=>MODULES.length,
    activate(id){const e=ENGINES.find(x=>x.id===id);return e?activate(e):false},
    setFilter(id){filter=id;if(library){
      $$('[data-ml-filter]',library).forEach(b=>b.setAttribute('aria-selected',String(b.dataset.mlFilter===filter)));
      applyFilter()}return filter},
    state(){return {ready,count:ENGINES.length,modules:MODULES.length,filter,
      active:root.dataset.motionLibraryActive||'',available:ENGINES.filter(e=>statusOf(e).available).length}}
  };
})();
