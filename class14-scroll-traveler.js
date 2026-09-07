/* CLASS 14 · PROJECT 09 — SCROLL TRAVELER

   A PAGE-LEVEL capability, transversal to every product-navigation preset: one object
   persists across several sections and travels through the page as the visitor
   scrolls. The Wild Red Prawn is the demonstration; the engine is generic.

   ONE canonical value:
     journeyProgress ∈ [0,1] across the whole route
   Everything derives from it:
     scrollY → journeyProgress → segment + t → x · y · scale · rotation · opacity
             → layer state → chapter
   There is no currentSection, no activeJourneyStep and no selectedJourneyIndex that
   could disagree with what is on screen. The chapter published on <html> is read back
   from the same progress.

   The renderer knows nothing about prawns or chefs. Route and source are data, so the
   same engine carries a lemon, a bottle or a logo.

   Scroll drives the animation; the animation never drives scroll. No wheel capture,
   no preventDefault, no scroll snapping — and the layer is pointer-events:none, so it
   can never swallow a link.
*/
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const NS='scrollTraveler';
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  const ease=t=>{t=clamp(t);return t*t*(3-2*t)};
  /* how far above the first anchor the object starts arriving */
  const LEAD_IN=.62;
  const LERP=.115;
  /* the page's own content is lifted to 3 (media) and 5 (copy) by styles-v14.css
     while the traveler is on, so these three states read as real layers */
  const LAYER_Z={behind:1,between:4,front:60};

  let root=document.documentElement;
  let layer=null,img=null,shadow=null;
  let anchors=[],route=[],ready=false,active=false,raf=0;
  let progress=0,lastScroll=0,velocity=0,lastT=0;
  let current={x:50,y:50,scale:1,rotation:0,opacity:0,blur:0,spin:0};
  let assetUrl='',objectUrl='',sourceKey='';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');

  const config=()=>window.RestaurantStudioConfig?.get?.(NS)
    ||window.RestaurantDefaults?.[NS]||{};
  const isMobile=()=>innerWidth<820;
  const enabled=()=>config().enabled!==false;

  /* ---------- route resolution ----------
     The designed route is data; this only resolves it against the real DOM and
     applies the restaurant's intensity. */
  function resolveRoute(){
    const cfg=config();
    const table=(isMobile()&&Array.isArray(cfg.routeMobile)&&cfg.routeMobile.length)
      ? cfg.routeMobile : (cfg.route||[]);
    const intensity=Number.isFinite(cfg.intensity)?clamp(cfg.intensity,0,2):1;
    const scaleMul=Number.isFinite(cfg.scale)?clamp(cfg.scale,.3,2):1;
    const rotMul=Number.isFinite(cfg.rotationIntensity)?clamp(cfg.rotationIntensity,0,2):1;
    route=table
      .map(stop=>({...stop,el:$(stop.anchor)}))
      .filter(stop=>stop.el)
      .map(stop=>({
        ...stop,
        /* intensity pulls the designed offsets toward the centre rather than
           rescaling the whole composition */
        x:50+(stop.x-50)*intensity,
        y:50+(stop.y-50)*intensity,
        scale:(stop.scale??1)*scaleMul,
        rotation:(stop.rotation??0)*rotMul*intensity,
        opacity:stop.opacity??1,
        blur:stop.blur??0,
        layer:LAYER_Z[stop.layer]!==undefined?stop.layer:'front'
      }));
    return route;
  }

  /* Where in the document each anchor's composition should be reached. Cached, and
     recomputed on resize and on a ScrollTrigger refresh — reading layout every frame
     is what makes a scroll effect thrash. */
  function measure(){
    resolveRoute();
    const y=scrollY;
    /* every composition has to be REACHABLE by scrolling. The last section sits at the
       bottom of the page, so its ideal aim point can lie past the furthest the browser
       will scroll — and then the route's final frame could never be seen. */
    const doc=document.scrollingElement||document.documentElement;
    const maxScroll=Math.max(0,doc.scrollHeight-innerHeight);
    anchors=route.map(stop=>{
      const r=stop.el.getBoundingClientRect();
      const top=y+r.top;
      /* for a section taller than the viewport, aim at a point inside it rather than
         at its top edge, so the object lands while the section is actually on screen */
      const inner=Math.max(0,r.height-innerHeight)*.46;
      return {...stop,scroll:clamp(top+inner,0,maxScroll)};
    }).sort((a,b)=>a.scroll-b.scroll);
    return anchors;
  }

  const startY=()=>anchors.length?anchors[0].scroll-innerHeight*LEAD_IN:0;
  const endY=()=>anchors.length?anchors[anchors.length-1].scroll:1;

  /* THE canonical value. Everything else in this file is derived from it. */
  function progressAt(y){
    if(anchors.length<2)return 0;
    const a=startY(),b=endY();
    return clamp((y-a)/Math.max(1,b-a),0,1);
  }

  /* progress → the object's state. Derived, cached nowhere. */
  function stateAt(p){
    if(!anchors.length)return {...current,opacity:0,chapter:'',layer:'front'};
    if(anchors.length===1)return {...anchors[0],chapter:anchors[0].chapter,spin:0};
    /* the entry ramp: before the first anchor the object arrives from off-composition
       instead of appearing, so there is no pop-in */
    const first=anchors[0];
    const rampSpan=(first.scroll-startY())/Math.max(1,endY()-startY());
    if(p<rampSpan){
      const t=ease(rampSpan>0?p/rampSpan:1);
      return {x:mix(50,first.x,t),y:mix(first.y+16,first.y,t),
        scale:mix(first.scale*.82,first.scale,t),
        rotation:mix(first.rotation-12,first.rotation,t),
        opacity:clamp(t*1.5),blur:0,spin:0,
        chapter:first.chapter,layer:first.layer};
    }
    /* the travelling part, in anchor units */
    const span=1-rampSpan;
    const pos=span>0?((p-rampSpan)/span)*(anchors.length-1):anchors.length-1;
    const i=clamp(Math.floor(pos),0,anchors.length-2);
    const t=clamp(pos-i,0,1);
    const a=anchors[i],b=anchors[i+1];
    const u=ease(t);
    /* a controlled arc: the object lifts slightly and over-rotates through the middle
       of a segment, which reads as travel rather than as a tween between two points */
    const arc=Math.sin(Math.PI*t);
    const dir=(b.rotation-a.rotation)>=0?1:-1;
    return {
      x:mix(a.x,b.x,u)+arc*Math.min(5,Math.abs(b.x-a.x)*.07),
      y:mix(a.y,b.y,u)-arc*(isMobile()?1.6:2.6),
      scale:mix(a.scale,b.scale,u)*(1+arc*.05),
      rotation:mix(a.rotation,b.rotation,u)+arc*4.5*dir,
      opacity:mix(a.opacity,b.opacity,u),
      blur:mix(a.blur,b.blur,u),
      spin:0,
      chapter:t<.5?a.chapter:b.chapter,
      /* z-index is a state, not a value to tween: it hands over at the midpoint */
      layer:t<.5?a.layer:b.layer
    };
  }

  /* ---------- the single DOM object ---------- */
  function ensureStyles(){
    if($('link[data-scroll-traveler-styles]'))return;
    const l=document.createElement('link');
    l.rel='stylesheet';l.href='styles-v14.css';l.dataset.scrollTravelerStyles='1';
    document.head.appendChild(l);
  }
  function ensureLayer(){
    if(layer?.isConnected)return layer;
    layer=document.createElement('div');
    layer.className='st-traveler';
    layer.id='scroll-traveler';
    layer.setAttribute('aria-hidden','true');
    shadow=document.createElement('div');shadow.className='st-shadow';
    img=document.createElement('img');img.className='st-object';img.alt='';img.decoding='async';
    layer.append(shadow,img);
    document.body.appendChild(layer);
    return layer;
  }

  /* ---------- asset ----------
     A dish asset, an uploaded transparent image or a brand object. An upload is
     validated before it is allowed to become the traveler; a broken file leaves the
     previous object in place rather than emptying the composition. */
  async function resolveAsset(){
    const src=config().source||{};
    if(src.type==='upload'&&src.mediaSlot){
      try{
        const rec=await window.RestaurantStore?.loadMedia?.(src.mediaSlot);
        const blob=rec?.file||rec?.blob||rec;
        if(blob instanceof Blob){
          const url=URL.createObjectURL(blob);
          const ok=await validateImage(url);
          if(ok){
            if(objectUrl)URL.revokeObjectURL(objectUrl);
            objectUrl=url;return url;
          }
          URL.revokeObjectURL(url);
        }
      }catch(e){}
    }
    return src.asset||'';
  }
  function validateImage(url){
    return new Promise(res=>{
      const probe=new Image();
      probe.onload=()=>res(probe.naturalWidth>8&&probe.naturalHeight>8);
      probe.onerror=()=>res(false);
      probe.src=url;
    });
  }
  async function paintAsset(){
    const url=await resolveAsset();
    if(!url)return false;
    const ok=await validateImage(url);
    if(!ok){root.dataset.travelerAsset='invalid';return false}
    assetUrl=url;
    ensureLayer();
    if(img.getAttribute('src')!==url)img.src=url;
    const src=config().source||{};
    sourceKey=JSON.stringify(src);
    img.alt='';
    layer.dataset.source=src.type||'dish';
    root.dataset.travelerAsset='ready';
    return true;
  }

  /* ---------- the frame ----------
     One transform write per frame on one element. No clones, no layout reads. */
  function apply(state){
    if(!layer)return;
    const k=reduced.matches?1:LERP;
    ['x','y','scale','rotation','opacity','blur'].forEach(p=>{
      current[p]=mix(current[p],state[p]??0,k);
    });
    /* a small rotation response to scroll velocity, damped so it settles instead of
       wobbling once the page stops moving */
    const vSpin=reduced.matches?0:clamp(velocity*.05,-7,7);
    current.spin=mix(current.spin,vSpin,.09);

    layer.style.setProperty('--st-x',`${current.x.toFixed(3)}vw`);
    layer.style.setProperty('--st-y',`${current.y.toFixed(3)}vh`);
    layer.style.setProperty('--st-scale',current.scale.toFixed(4));
    layer.style.setProperty('--st-rot',`${(current.rotation+current.spin).toFixed(3)}deg`);
    layer.style.setProperty('--st-opacity',current.opacity.toFixed(3));
    layer.style.setProperty('--st-blur',`${Math.max(0,current.blur).toFixed(2)}px`);
    layer.style.zIndex=String(LAYER_Z[state.layer]??LAYER_Z.front);
    layer.dataset.layer=state.layer;
    layer.dataset.chapter=state.chapter||'';
    root.dataset.travelerChapter=state.chapter||'';
    root.dataset.travelerProgress=progress.toFixed(4);
  }

  function frame(){
    if(!active){raf=0;return}
    const now=performance.now();
    const dt=Math.max(16,now-lastT);
    velocity=velocity*.72+((scrollY-lastScroll)/dt*16)*.28;
    lastScroll=scrollY;lastT=now;
    progress=progressAt(scrollY);
    apply(stateAt(progress));
    /* settle: once the page and the object have stopped, stop asking for frames */
    const settled=Math.abs(velocity)<.02
      &&Math.abs(current.spin)<.05
      &&Math.abs(current.x-stateAt(progress).x)<.02
      &&Math.abs(current.scale-stateAt(progress).scale)<.001;
    raf=settled?0:requestAnimationFrame(frame);
    if(settled)root.dataset.travelerSettled='1';
    else delete root.dataset.travelerSettled;
  }
  function kick(){
    if(!active)return;
    if(!raf){lastT=performance.now();raf=requestAnimationFrame(frame)}
  }

  /* ---------- lifecycle ---------- */
  async function activate(){
    ensureStyles();
    if(!enabled()){deactivate();return}
    ensureLayer();
    measure();
    if(anchors.length<2){deactivate();return}
    const painted=await paintAsset();
    if(!painted){deactivate();return}
    active=true;
    layer.classList.add('is-active');
    root.dataset.scrollTraveler='ready';
    lastScroll=scrollY;lastT=performance.now();
    progress=progressAt(scrollY);
    /* land on the first frame without a slide-in from a stale position */
    const s=stateAt(progress);
    current={...current,...s,spin:0};
    apply(s);
    kick();
  }
  function deactivate(){
    active=false;
    if(raf)cancelAnimationFrame(raf);
    raf=0;
    if(layer){
      layer.classList.remove('is-active');
      layer.removeAttribute('data-chapter');
      layer.removeAttribute('data-layer');
    }
    delete root.dataset.scrollTraveler;
    delete root.dataset.travelerChapter;
    delete root.dataset.travelerProgress;
    delete root.dataset.travelerSettled;
    delete root.dataset.travelerAsset;
    current={x:50,y:50,scale:1,rotation:0,opacity:0,blur:0,spin:0};
  }

  /* ---------- Studio: PAGE MOTION, not product navigation ----------
     A transversal capability, so it gets its own card and coexists with whichever
     product preset is selected. Persistence goes through the existing project state
     via data-path — no new settings store. */
  function ensureStudioPanel(){
    const panel=$('.studio-panel.motion-panel');
    if(!panel||$('.st-studio',panel))return;
    const card=document.createElement('article');
    card.className='motion-card st-studio';
    card.innerHTML=`
      <div class="motion-card-head">
        <div><span class="motion-number">09</span><strong>Page Motion · Scroll Traveler</strong></div>
        <span class="motion-badge">TRANSVERSAL</span>
      </div>
      <p>Un objeto recorre la página al hacer scroll y atraviesa los capítulos del
         restaurante. Coexiste con cualquier coreografía de producto.</p>
      <label class="st-check"><input type="checkbox" data-path="${NS}.enabled"> Activado</label>
      <label>Ruta
        <select data-path="${NS}.preset">
          <option value="red-prawn">Red Prawn Journey</option>
          <option value="custom">Custom Traveler</option>
        </select></label>
      <label>Intensidad de movimiento
        <input type="range" min="0.4" max="1.4" step="0.05" data-path="${NS}.intensity"></label>
      <label>Escala del objeto
        <input type="range" min="0.5" max="1.5" step="0.05" data-path="${NS}.scale"></label>
      <label>Rotación
        <input type="range" min="0" max="1.6" step="0.05" data-path="${NS}.rotationIntensity"></label>
      <label>Objeto (PNG/WebP con transparencia)
        <input type="file" class="st-upload" accept="image/png,image/webp"></label>
      <p class="st-status" role="status" aria-live="polite"></p>
      <small class="st-route-hint"></small>`;
    panel.appendChild(card);
    /* the hint lists the route that is actually loaded — change the route and the
       label follows, because the panel describes data instead of repeating it */
    const hint=$('.st-route-hint',card);
    if(hint)hint.textContent=(config().route||[])
      .map(stop=>String(stop.chapter||'').replace(/^./,c=>c.toUpperCase()))
      .filter(Boolean).join(' → ');

    /* Studio binds [data-path] once at boot, so a card added later wires itself
       through the same mutate → apply → persist path those inputs already use. */
    $$('[data-path]',card).forEach(input=>{
      const apply=()=>{
        const raw=input.type==='checkbox'?input.checked
          :(input.type==='range'?parseFloat(input.value):input.value);
        window.RestaurantStudioConfig?.set?.(input.dataset.path,raw);
      };
      input.addEventListener('input',apply);
      input.addEventListener('change',apply);
    });

    const status=t=>{const el=$('.st-status',card);if(el)el.textContent=t||''};
    $('.st-upload',card)?.addEventListener('change',async e=>{
      const file=e.target.files?.[0];if(!file)return;
      status('Validando…');
      const url=URL.createObjectURL(file);
      const ok=await validateImage(url);
      URL.revokeObjectURL(url);
      if(!ok){status('La imagen no se pudo leer. El objeto actual se mantiene.');e.target.value='';return}
      try{
        await window.RestaurantStore?.saveMedia?.('scroll-traveler-object',file,{kind:'scroll-traveler'});
        window.RestaurantStudioConfig?.set?.(`${NS}.source`,
          {type:'upload',mediaSlot:'scroll-traveler-object',asset:config().source?.asset||''});
        status('Objeto actualizado.');
      }catch(err){status('No se pudo guardar el objeto. El actual se mantiene.')}
    });
    syncStudioPanel();
  }
  function syncStudioPanel(){
    const card=$('.st-studio');
    if(!card)return;
    $$('[data-path]',card).forEach(input=>{
      if(document.activeElement===input)return;
      const v=window.RestaurantStudioConfig?.get?.(input.dataset.path);
      if(input.type==='checkbox')input.checked=v!==false;
      else if(v!==undefined&&v!==null)input.value=v;
    });
  }

  /* ---------- wiring ----------
     Passive listeners only. Nothing here calls preventDefault, and nothing scrolls
     the page: scroll drives the animation, never the other way round. */
  function bind(){
    addEventListener('scroll',kick,{passive:true});
    let resizeTimer=0;
    addEventListener('resize',()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>{if(active){measure();kick()}},140);
    },{passive:true});
    /* the config was applied — by an input, a programmatic set, an import or an undo */
    document.addEventListener('restaurant:config-applied',async()=>{
      syncStudioPanel();
      if(!enabled()){deactivate();return}
      if(!active){activate();return}
      /* the OBJECT can change too, not just the route: a different dish, an upload,
         a brand mark. Compare the declared source rather than the resolved URL, so an
         upload is not re-read on every unrelated edit. */
      if(JSON.stringify(config().source||{})!==sourceKey){
        const ok=await paintAsset();
        if(!ok){deactivate();return}
      }
      measure();kick();
    });
    /* a preset change relayouts the page, so the route has to be re-measured */
    new MutationObserver(()=>{if(active){measure();kick()}})
      .observe(root,{attributes:true,attributeFilter:['data-orbital-motion']});
    document.addEventListener('click',e=>{
      if(e.target.closest?.('.studio-open'))setTimeout(ensureStudioPanel,140);
    },true);
    /* GSAP's ScrollTrigger owns section reveals on this site; when it recalculates,
       so do we */
    if(window.ScrollTrigger?.addEventListener)
      window.ScrollTrigger.addEventListener('refresh',()=>{if(active){measure();kick()}});
  }

  async function boot(){
    if(ready)return;
    /* ready when the page can actually carry a route — not when one named section
       exists. The engine must not know which sections this restaurant has. */
    if(!document.body||!(config().route||[]).some(stop=>$(stop.anchor)))return;
    ready=true;
    ensureStyles();
    bind();
    ensureStudioPanel();
    await activate();
  }
  const timer=setInterval(()=>{boot();if(ready)clearInterval(timer)},150);
  setTimeout(()=>clearInterval(timer),25000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,160));
  else setTimeout(boot,160);

  window.RestaurantScrollTraveler={
    activate,deactivate,
    measure,
    syncStudioPanel,
    /* test seam: drive the canonical progress directly without faking a scroll */
    setProgress(p){
      if(!active)return null;
      progress=clamp(p,0,1);
      const s=stateAt(progress);
      current={...current,...s,spin:0};
      apply(s);
      return this.state();
    },
    scrollToProgress(p){
      if(!anchors.length)return 0;
      const y=startY()+clamp(p,0,1)*(endY()-startY());
      scrollTo({top:y,behavior:'auto'});
      return y;
    },
    stateAtProgress(p){return stateAt(clamp(p,0,1))},
    /* a derived read, not a second state: which canonical progress lands on anchor i,
       and where between two anchors a fraction sits. Evidence and tests need to name
       route positions without re-deriving the ramp. */
    progressForAnchor(i,fraction=0){
      if(anchors.length<2)return 0;
      const a=startY(),b=endY();
      const rampSpan=(anchors[0].scroll-a)/Math.max(1,b-a);
      const unit=clamp(i+fraction,0,anchors.length-1)/(anchors.length-1);
      return clamp(rampSpan+unit*(1-rampSpan),0,1);
    },
    /* deliberately reports the ONE progress and everything derived from it */
    state(){
      return {enabled:enabled(),active,ready:root.dataset.scrollTraveler==='ready',
        progress,chapter:root.dataset.travelerChapter||'',
        settled:root.dataset.travelerSettled==='1',
        anchors:anchors.map(a=>({anchor:a.anchor,chapter:a.chapter,scroll:Math.round(a.scroll),
          x:+a.x.toFixed(2),y:+a.y.toFixed(2),scale:+a.scale.toFixed(3),layer:a.layer})),
        current:{x:+current.x.toFixed(2),y:+current.y.toFixed(2),
          scale:+current.scale.toFixed(3),rotation:+current.rotation.toFixed(2),
          opacity:+current.opacity.toFixed(3),
          /* the damped response to scroll velocity — derived, not a second state */
          spin:+current.spin.toFixed(3)},
        layer:layer?.dataset.layer||'',
        zIndex:layer?+getComputedStyle(layer).zIndex||0:0,
        asset:assetUrl,source:config().source?.type||'dish',
        mobileRoute:isMobile(),reduced:reduced.matches};
    }
  };
})();
