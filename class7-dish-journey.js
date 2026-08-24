/* CLASS 07 — DISH JOURNEY
   First vertical slice: Wild Red Prawn / dish-01.
   Class 06 remains the fallback product experience when Dish Journey is OFF. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  const RED_PRAWN='dish-01';
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let enabled=true,active=false,selectedId=null,selectedSrc='',raf=0,lastScroll=scrollY;
  let current={x:50,y:48,scale:1.16,rotate:0,opacity:0};
  let target={...current};

  const copy={
    es:{
      hint:'Desliza para seguir la gamba',sub:'El plato continuará por Origin, Atmosphere, Chef y Reserva.',
      origin:{eyebrow:'GAMBA ROJA · SANTA POLA',title:'Antes del plato está el mar.',body:'Santa Pola, 07:20. La gamba llega todavía con el Mediterráneo encima. Producto, lonja y territorio se convierten en el primer capítulo del plato.'},
      atmosphere:{eyebrow:'SAL · HUMO · CÍTRICO',title:'El plato entra en la sala.',body:'La misma gamba abandona la lonja y convive ahora con la luz, la materia y el ritmo del servicio. El producto deja de ser ingrediente y se convierte en recuerdo.'},
      chef:{eyebrow:'38 SEGUNDOS · CARBÓN DE OLIVO',title:'Intervenir lo mínimo.',body:'“Calor, yodo y cítrico. Nada debería ponerse en medio.” La técnica existe para acercar la madrugada de Santa Pola a la mesa, no para taparla.'},
      visit:{eyebrow:'ÚLTIMO ACTO',title:'Del mar a tu mesa.',body:'Has seguido la Gamba Roja desde su origen hasta el pase. La historia termina donde empieza la experiencia real: tomando asiento.'}
    },
    en:{
      hint:'Scroll to follow the red prawn',sub:'The dish will continue through Origin, Atmosphere, Chef and Reservation.',
      origin:{eyebrow:'RED PRAWN · SANTA POLA',title:'Before the plate, there is the sea.',body:'Santa Pola, 07:20. The prawn arrives with the Mediterranean still on it. Product, market and territory become the first chapter of the dish.'},
      atmosphere:{eyebrow:'SALT · SMOKE · CITRUS',title:'The dish enters the room.',body:'The same prawn leaves the fish market and now shares space with light, material and service. Product stops being an ingredient and becomes a memory.'},
      chef:{eyebrow:'38 SECONDS · OLIVE-WOOD CHARCOAL',title:'Intervene as little as possible.',body:'“Heat, iodine and citrus. Nothing should get in the way.” Technique exists to bring the Santa Pola dawn closer to the table, never to cover it.'},
      visit:{eyebrow:'FINAL ACT',title:'From the sea to your table.',body:'You have followed the Red Prawn from its origin to the pass. The story ends where the real experience begins: taking your seat.'}
    }
  };

  function lang(){return document.documentElement.dataset.locale==='en'?'en':'es'}
  function ensureStyles(){if($('link[data-class7-styles]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='styles-v7.css';l.dataset.class7Styles='1';document.head.appendChild(l)}

  function ensureLayer(){
    let layer=$('#class7-journey-layer');if(layer)return layer;
    layer=document.createElement('div');layer.id='class7-journey-layer';layer.className='class7-journey-layer';layer.setAttribute('aria-hidden','true');
    layer.innerHTML='<div class="class7-journey-halo"></div><img id="class7-journey-image" alt=""><div class="class7-journey-chip"><span>Dish Journey</span><strong id="class7-journey-chip-title"></strong></div>';
    document.body.appendChild(layer);return layer;
  }

  function ensureHint(){
    const detail=$('#dish-detail .detail-copy');if(!detail)return null;
    let hint=$('#class7-journey-hint');if(hint)return hint;
    hint=document.createElement('button');hint.type='button';hint.id='class7-journey-hint';hint.className='class7-journey-hint';
    hint.innerHTML='<span class="class7-hint-icon">↓</span><span><strong id="class7-hint-title"></strong><small id="class7-hint-sub"></small></span>';
    detail.appendChild(hint);
    hint.addEventListener('click',e=>{e.preventDefault();beginJourneyFromDetail()});
    return hint;
  }

  function ensureContexts(){
    const specs=[['#experience','origin'],['.experience-section','atmosphere'],['.chef-section','chef'],['#visit','visit']];
    specs.forEach(([sel,key])=>{const host=$(sel);if(!host||host.querySelector(`.class7-context[data-journey-context="${key}"]`))return;const el=document.createElement('aside');el.className='class7-context';el.dataset.journeyContext=key;el.innerHTML='<span class="class7-context-eyebrow"></span><h3></h3><p></p>';host.appendChild(el)});
  }

  function renderCopy(){
    const c=copy[lang()];
    const hint=ensureHint();if(hint){$('#class7-hint-title').textContent=c.hint;$('#class7-hint-sub').textContent=c.sub}
    $$('.class7-context').forEach(el=>{const d=c[el.dataset.journeyContext];if(!d)return;$('.class7-context-eyebrow',el).textContent=d.eyebrow;$('h3',el).textContent=d.title;$('p',el).textContent=d.body});
  }

  async function readEnabled(){
    window.RestaurantDefaults.motion=window.RestaurantDefaults.motion||{};
    if(window.RestaurantDefaults.motion.dishJourney===undefined)window.RestaurantDefaults.motion.dishJourney=true;
    let value=window.RestaurantDefaults.motion.dishJourney;
    try{const saved=await window.RestaurantStore?.loadProject?.();if(typeof saved?.config?.motion?.dishJourney==='boolean')value=saved.config.motion.dishJourney}catch{}
    enabled=value!==false;publishEnabled();return enabled;
  }

  async function saveEnabled(value){
    enabled=!!value;window.RestaurantDefaults.motion=window.RestaurantDefaults.motion||{};window.RestaurantDefaults.motion.dishJourney=enabled;
    try{
      const saved=await window.RestaurantStore?.loadProject?.();
      const base=saved||{id:'restaurant-class4',schemaVersion:6,status:'draft',config:JSON.parse(JSON.stringify(window.RestaurantDefaults))};
      base.config=base.config||JSON.parse(JSON.stringify(window.RestaurantDefaults));base.config.motion=base.config.motion||{};base.config.motion.dishJourney=enabled;
      await window.RestaurantStore?.saveProject?.(base);
    }catch(err){console.warn('Class 07 Dish Journey preference fallback',err)}
    if(!enabled)deactivateJourney();publishEnabled();
  }

  function publishEnabled(){
    document.documentElement.dataset.dishJourneyEnabled=enabled?'true':'false';
    const box=$('#class7-journey-toggle');if(box){$$('button',box).forEach(b=>{const on=(b.dataset.value==='on')===enabled;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))})}
    const hint=$('#class7-journey-hint');if(hint)hint.hidden=!enabled||selectedId!==RED_PRAWN;
  }

  function ensureStudioToggle(){
    const panel=$('.motion-panel');if(!panel||$('#class7-journey-card'))return;
    const card=document.createElement('article');card.id='class7-journey-card';card.className='motion-card class7-studio-card';
    card.innerHTML='<div class="motion-card-head"><div><span class="motion-number">08</span><strong>Dish Journey</strong></div><span class="motion-badge">CLASS 07</span></div><p>El plato seleccionado puede continuar por la web. La coreografía es parte del producto: sólo se activa o desactiva.</p><div id="class7-journey-toggle" class="class7-toggle" role="group" aria-label="Dish Journey"><button type="button" data-value="off">OFF</button><button type="button" data-value="on">ON</button></div><small>Primera validación: Gamba Roja → Origin → Atmosphere → Chef → Reserva.</small>';
    const featured=$('.motion-card-featured',panel);featured?.insertAdjacentElement('afterend',card);if(!featured)panel.appendChild(card);
    card.addEventListener('click',e=>{const b=e.target.closest('[data-value]');if(b)saveEnabled(b.dataset.value==='on')});publishEnabled();
  }

  function marks(){
    const items=[
      {key:'origin',el:$('#experience'),x:72,y:49,scale:.72,rotate:5},
      {key:'atmosphere',el:$('.experience-section'),x:25,y:47,scale:.90,rotate:-5},
      {key:'chef',el:$('.chef-section'),x:55,y:56,scale:.68,rotate:3},
      {key:'visit',el:$('#visit'),x:50,y:43,scale:1.02,rotate:0}
    ].filter(x=>x.el);
    return items.map(m=>{const r=m.el.getBoundingClientRect();return{...m,scroll:scrollY+r.top+Math.max(0,r.height-innerHeight)*.46}}).sort((a,b)=>a.scroll-b.scroll);
  }

  function stateAt(y){
    const ms=marks();if(!ms.length)return{x:50,y:50,scale:1,rotate:0,opacity:1,key:'origin'};
    if(y<=ms[0].scroll){const pre=Math.max(0,ms[0].scroll-innerHeight*.72),t=clamp((y-pre)/(ms[0].scroll-pre||1));return{x:mix(50,ms[0].x,t),y:mix(48,ms[0].y,t),scale:mix(1.12,ms[0].scale,t),rotate:mix(0,ms[0].rotate,t),opacity:clamp(t*1.35),key:ms[0].key}}
    for(let i=0;i<ms.length-1;i++){const a=ms[i],b=ms[i+1];if(y<=b.scroll){const t=clamp((y-a.scroll)/(b.scroll-a.scroll||1));return{x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),scale:mix(a.scale,b.scale,t),rotate:mix(a.rotate,b.rotate,t),opacity:1,key:t<.5?a.key:b.key}}}
    const z=ms[ms.length-1];return{x:z.x,y:z.y,scale:z.scale,rotate:z.rotate,opacity:1,key:z.key};
  }

  function frame(){
    if(!active){raf=0;return}
    target=stateAt(scrollY);
    const k=reduce.matches?1:.13;
    ['x','y','scale','rotate','opacity'].forEach(p=>current[p]=mix(current[p],target[p],k));
    const layer=ensureLayer(),img=$('#class7-journey-image');
    layer.style.setProperty('--journey-x',current.x+'vw');layer.style.setProperty('--journey-y',current.y+'vh');layer.style.setProperty('--journey-scale',current.scale);layer.style.setProperty('--journey-rotate',current.rotate+'deg');layer.style.setProperty('--journey-opacity',current.opacity);
    document.documentElement.dataset.journeySection=target.key||'';
    $$('.class7-context').forEach(el=>el.classList.toggle('is-current',el.dataset.journeyContext===target.key));
    if(img&&selectedSrc&&img.src!==selectedSrc)img.src=selectedSrc;
    raf=requestAnimationFrame(frame);
  }

  function activateJourney(src){
    if(!enabled||selectedId!==RED_PRAWN)return;
    selectedSrc=src||selectedSrc;if(!selectedSrc)return;
    active=true;const layer=ensureLayer(),img=$('#class7-journey-image');img.src=selectedSrc;img.alt=lang()==='es'?'Gamba roja salvaje':'Wild red prawn';
    $('#class7-journey-chip-title').textContent=img.alt;layer.classList.add('is-active');layer.setAttribute('aria-hidden','false');document.documentElement.dataset.dishJourney='active';
    $$('.class7-context').forEach(el=>el.classList.add('is-active'));if(!raf)raf=requestAnimationFrame(frame);
  }

  function deactivateJourney(){
    active=false;document.documentElement.dataset.dishJourney='inactive';document.documentElement.dataset.journeySection='';const layer=$('#class7-journey-layer');layer?.classList.remove('is-active');layer?.setAttribute('aria-hidden','true');$$('.class7-context').forEach(el=>el.classList.remove('is-active','is-current'));if(raf)cancelAnimationFrame(raf);raf=0;
  }

  function beginJourneyFromDetail(){
    if(!enabled||selectedId!==RED_PRAWN)return;
    const img=$('#detail-visual img');if(img)selectedSrc=img.currentSrc||img.src;
    const close=$('#detail-close');close?.click();
    setTimeout(()=>{activateJourney(selectedSrc);$('#experience')?.scrollIntoView({behavior:reduce.matches?'auto':'smooth',block:'start'})},reduce.matches?0:180);
  }

  function onDetailOpen(e){
    selectedId=e.detail?.id||$('#detail-visual .orbit-dish')?.dataset.id||null;
    const img=$('#detail-visual img');selectedSrc=img?.currentSrc||img?.src||'';renderCopy();publishEnabled();
    const hint=$('#class7-journey-hint');if(hint)hint.hidden=!enabled||selectedId!==RED_PRAWN;
  }

  function bindDetailGesture(){
    const detail=$('#dish-detail');if(!detail||detail.dataset.class7Gesture==='1')return;detail.dataset.class7Gesture='1';
    detail.addEventListener('wheel',e=>{if(detail.getAttribute('aria-hidden')!=='false'||selectedId!==RED_PRAWN||!enabled||e.deltaY<36)return;e.preventDefault();e.stopPropagation();beginJourneyFromDetail()},{passive:false,capture:true});
    let touchY=null;detail.addEventListener('touchstart',e=>{touchY=e.touches?.[0]?.clientY??null},{passive:true});detail.addEventListener('touchend',e=>{if(touchY===null)return;const end=e.changedTouches?.[0]?.clientY??touchY;if(touchY-end>54&&selectedId===RED_PRAWN&&enabled)beginJourneyFromDetail();touchY=null},{passive:true});
  }

  async function init(){
    ensureStyles();ensureLayer();ensureHint();ensureContexts();renderCopy();bindDetailGesture();await readEnabled();ensureStudioToggle();
    window.addEventListener('restaurant:dish-detail-open',onDetailOpen);
    window.addEventListener('restaurant:locale-change',()=>{renderCopy();if(active){const img=$('#class7-journey-image');if(img)img.alt=lang()==='es'?'Gamba roja salvaje':'Wild red prawn'}});
    window.addEventListener('resize',()=>{if(active)target=stateAt(scrollY)});
    document.addEventListener('click',e=>{if(e.target.closest('.studio-open'))setTimeout(ensureStudioToggle,120)},true);
    document.documentElement.dataset.class7Runtime='ready';
    window.Class7DishJourney={activate:activateJourney,deactivate:deactivateJourney,setEnabled:saveEnabled,get enabled(){return enabled},get active(){return active}};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,180));else setTimeout(init,180);
})();