/* CLASS 24 · MOTION GOVERNANCE

   Product rule, not another motion engine:
     1 product choreography + 0/1 transversal Scroll Traveler + optional experiences.

   Runs after class4-config.js and BEFORE app-v4.js so defaults are correct for a new
   project. Existing saved projects still win during the normal config merge.

   capabilities.motionStudio controls whether advanced Motion authoring is exposed.
   It does NOT change the public choreography already selected for the restaurant.
*/
(() => {
  'use strict';
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const root=document.documentElement;
  const D=window.RestaurantDefaults;
  if(!D)return;

  D.capabilities={...(D.capabilities||{}),motionStudio:D.capabilities?.motionStudio!==false};
  if(D.scrollTraveler)D.scrollTraveler.enabled=false;

  function ensureStyles(){
    if($('link[data-motion-governance-styles]'))return;
    const l=document.createElement('link');l.rel='stylesheet';l.href='styles-v24-governance.css';
    l.dataset.motionGovernanceStyles='1';document.head.appendChild(l);
  }

  function capabilityEnabled(){
    const live=window.RestaurantStudioConfig?.get?.('capabilities.motionStudio');
    return live===undefined?D.capabilities.motionStudio!==false:live!==false;
  }

  function applyCapability(){
    const on=capabilityEnabled();
    root.dataset.motionStudioCapability=on?'on':'off';
    const tab=$('#studio .studio-nav [data-panel="motion"]');
    const panel=$('#studio .studio-panel.motion-panel');
    if(tab)tab.hidden=!on;
    if(panel){
      panel.dataset.capabilityHidden=on?'0':'1';
      if(!on){
        if(tab?.classList.contains('active'))$('#studio .studio-nav [data-panel="brand"]')?.click?.();
        panel.hidden=true;
      }
    }
  }

  function makeGroup(kind,title,note){
    const section=document.createElement('section');
    section.className=`ml-governance-group ml-group-${kind}`;
    section.dataset.motionGroup=kind;
    section.innerHTML=`<header class="ml-group-head"><div><span>${title}</span><p>${note}</p></div></header><div class="ml-group-grid"></div>`;
    return section;
  }

  function groupLibrary(){
    const lib=$('.ml-library');
    if(!lib)return false;
    const host=$('[data-ml-grid]',lib);
    if(!host||host.dataset.governed==='1')return false;
    host.dataset.governed='1';host.classList.add('ml-governed-grid');
    const cards=$$(':scope > [data-ml-card]',host);
    const groups={
      preset:makeGroup('preset','Motor de producto · elige uno','Una sola coreografía gobierna la colección principal.'),
      page:makeGroup('page','Movimiento transversal · opcional','Scroll Traveler recorre la página y puede convivir con cualquier motor de producto.'),
      experience:makeGroup('experience','Experiencias completas','Experiencias independientes que se abren dentro de la aplicación.')
    };
    Object.values(groups).forEach(g=>host.appendChild(g));
    cards.forEach(card=>groups[card.dataset.mlKind]?.querySelector('.ml-group-grid')?.appendChild(card));
    return true;
  }

  function travellerOn(){return window.RestaurantStudioConfig?.get?.('scrollTraveler.enabled')===true}

  function enhanceTraveler(){
    const lib=$('.ml-library');
    if(!lib)return false;
    const pageGroup=$('[data-motion-group="page"] .ml-group-grid',lib);
    const card=$('[data-ml-card="scroll-traveler"]',lib);
    const tuner=$('.studio-panel.motion-panel .st-studio');
    if(card)card.classList.add('ml-traveler-card');
    if(tuner){
      tuner.classList.add('st-studio-governed');
      if(pageGroup&&tuner.parentElement!==pageGroup)pageGroup.appendChild(tuner);
      const check=$('.st-check',tuner);
      if(check&&!check.dataset.governed){
        check.dataset.governed='1';
        const input=$('input[type="checkbox"]',check);
        if(input){
          const title=document.createElement('strong');title.textContent='Scroll Traveler';
          const state=document.createElement('span');state.className='st-switch-state';
          check.insertBefore(title,input);
          check.appendChild(state);
        }
      }
    }
    syncTraveler();
    return !!card&&!!tuner&&!!pageGroup;
  }

  function syncTraveler(){
    const on=travellerOn();
    root.dataset.scrollTravelerChoice=on?'on':'off';
    const lib=$('.ml-library');
    const card=lib?$('[data-ml-card="scroll-traveler"]',lib):null;
    const tuner=$('.st-studio-governed');
    const input=tuner?$('.st-check input[type="checkbox"]',tuner):null;
    if(input&&document.activeElement!==input)input.checked=on;
    if(tuner){
      tuner.classList.toggle('is-on',on);tuner.classList.toggle('is-off',!on);
      const state=$('.st-switch-state',tuner);if(state)state.textContent=on?'ON':'OFF';
    }
    if(card){
      card.dataset.mlState=on?'activo':'apagado';
      const toggle=$('.ml-toggle',card);
      if(toggle){toggle.setAttribute('aria-pressed',String(on));toggle.textContent=on?'ON · Desactivar':'OFF · Activar';}
      const label=$('[data-ml-state-label]',card);if(label)label.textContent=`TRANSVERSAL · ${on?'ON':'OFF'}`;
    }
  }

  function improveCopy(){
    const lib=$('.ml-library');if(!lib)return;
    const eyebrow=$('.ml-head .eyebrow',lib);
    if(eyebrow&&eyebrow.textContent!=='Motion Studio')eyebrow.textContent='Motion Studio';
    const title=$('.ml-head h3',lib);
    if(title?.firstChild&&title.firstChild.textContent!=='Dirección de movimiento ')
      title.firstChild.textContent='Dirección de movimiento ';
    const lead=$('.ml-head .ml-lead',lib);
    const copy='Elige un motor para el producto. Después decide, por separado, si la página necesita una capa transversal como Scroll Traveler.';
    if(lead&&lead.textContent!==copy)lead.textContent=copy;
  }

  function apply(){
    ensureStyles();applyCapability();
    if(!capabilityEnabled())return false;
    groupLibrary();
    const complete=enhanceTraveler();
    improveCopy();
    return complete;
  }

  let scheduled=false;
  const observer=new MutationObserver(()=>{
    if(scheduled)return;scheduled=true;
    queueMicrotask(()=>{
      scheduled=false;
      if(apply())observer.disconnect();
    });
  });
  observer.observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('restaurant:config-applied',()=>{applyCapability();syncTraveler();});
  document.addEventListener('click',e=>{if(e.target.closest?.('.studio-open'))setTimeout(apply,180)},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,80));
  else setTimeout(apply,80);

  window.RestaurantMotionGovernance={
    apply,
    state(){return {motionStudio:capabilityEnabled(),scrollTraveler:travellerOn(),
      grouped:!!$('[data-ml-grid][data-governed="1"]'),
      groups:$$('[data-motion-group]').map(x=>x.dataset.motionGroup)}}
  };
})();

/* CLASS 25 · BEVERAGE EXPERIENCE — additive capability loader.
   This does not make Beverages part of Motion Governance; this file is simply the
   newest guaranteed top-level entrypoint in the Half Orbit product line. The loader
   itself waits for the shared Media/Studio APIs and owns the deterministic chain. */
(() => {
  'use strict';
  const load=()=>{
    if(document.querySelector('script[data-class25-beverage-loader]'))return;
    const s=document.createElement('script');s.src='class25-beverage-loader.js';s.dataset.class25BeverageLoader='1';document.body.appendChild(s);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,300));
  else setTimeout(load,300);
})();
